// Resource link verification. Pure (no server imports) so client components can
// use searchUrl/displayLink too.

export type LinkKind = "direct" | "search" | "none";
export type ResourceType = "video" | "article" | "note";

export type LinkInput = { title: string; type: string; url?: string | null };
export type VerifiedLink = {
  url: string | null;
  link_kind: LinkKind;
  /** Final HTTP status of the check; 0 = network error/timeout; null = not checked. */
  link_status: number | null;
  verified_at: string | null;
};

type Check = { ok: boolean; status: number };
type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
};

/** An honest "go find it" link: YouTube search for videos, web search otherwise. */
export function searchUrl(title: string, type: string): string {
  const q = encodeURIComponent(title.trim().slice(0, 200));
  return type === "video"
    ? `https://www.youtube.com/results?search_query=${q}`
    : `https://www.google.com/search?q=${q}`;
}

/** Only absolute http(s) URLs; anything else (javascript:, data:, relative) is rejected. */
export function parseHttpUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/** A site root (optionally a bare locale like /en-US/) is not a lesson. */
export function isHomepage(u: URL): boolean {
  const path = u.pathname.replace(/\/(index\.html?)?$/i, "");
  return u.search === "" && (path === "" || /^\/[a-z]{2}(-[a-z]{2})?$/i.test(path));
}

/** Videos, playlists and shorts are checked via oEmbed; channels via a normal fetch. */
export function isYouTubeMedia(u: URL): boolean {
  const host = u.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") return u.pathname.length > 1;
  return host === "youtube.com" && /^\/(watch|playlist|shorts\/|embed\/|live\/)/.test(u.pathname);
}

async function checkUrl(u: URL, fetchFn: FetchFn, timeoutMs: number): Promise<Check> {
  // One signal for the whole check (HEAD + GET fallback) keeps it inside the budget.
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    if (isYouTubeMedia(u)) {
      const res = await fetchFn(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u.href)}`,
        { signal }
      );
      void res.body?.cancel().catch(() => {});
      return { ok: res.ok, status: res.status };
    }
    const init = { redirect: "follow" as const, signal, headers: HEADERS };
    let res = await fetchFn(u.href, { ...init, method: "HEAD" }).catch(() => null);
    // Many servers reject or mishandle HEAD; a GET is the real answer.
    if (!res || res.status >= 400) {
      if (signal.aborted) return { ok: false, status: res?.status ?? 0 };
      res = await fetchFn(u.href, { ...init, method: "GET" });
    }
    void res.body?.cancel().catch(() => {});
    // A dead deep link that redirects to the site root is a soft 404.
    const landed = parseHttpUrl(res.url);
    const ok = res.status >= 200 && res.status < 400 && !(landed && isHomepage(landed));
    return { ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/**
 * Verify every resource link with bounded concurrency and a hard overall budget.
 * Output is index-aligned with `items`. Anything not proven live becomes a search
 * link, so a dead URL is never presented as a direct link.
 */
export async function verifyLinks(
  items: LinkInput[],
  opts: { fetchFn?: FetchFn; budgetMs?: number; concurrency?: number; requestMs?: number } = {}
): Promise<VerifiedLink[]> {
  const { fetchFn = fetch, budgetMs = 15_000, concurrency = 8, requestMs = 6_000 } = opts;
  const deadline = Date.now() + budgetMs;

  const parsed = items.map((i) => {
    const u = parseHttpUrl(i.url);
    return u && !isHomepage(u) ? u : null;
  });
  const unique = [...new Set(parsed.filter((u): u is URL => !!u).map((u) => u.href))];
  const results = new Map<string, Check>();

  let next = 0;
  const worker = async () => {
    while (next < unique.length) {
      const href = unique[next++];
      const left = deadline - Date.now();
      results.set(
        href,
        left < 300 ? { ok: false, status: 0 } : await checkUrl(new URL(href), fetchFn, Math.min(requestMs, left))
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));

  const verifiedAt = new Date().toISOString();
  return items.map((item, i) => {
    const u = parsed[i];
    const r = u ? results.get(u.href) : undefined;
    if (u && r?.ok) {
      return { url: u.href, link_kind: "direct", link_status: r.status, verified_at: verifiedAt };
    }
    if (!item.url && item.type === "note") {
      return { url: null, link_kind: "none", link_status: null, verified_at: null };
    }
    return {
      url: searchUrl(item.title, item.type),
      link_kind: "search",
      link_status: r?.status ?? null,
      verified_at: verifiedAt,
    };
  });
}

/**
 * What the UI should link to. Rows created before verification existed
 * (link_kind missing) are unproven, so they also get a search link.
 */
export function displayLink(r: {
  title: string;
  type: string;
  url: string | null;
  link_kind?: LinkKind | null;
}): { href: string; verified: boolean } | null {
  if (r.link_kind === "direct" && r.url) return { href: r.url, verified: true };
  if (r.link_kind === "search" && parseHttpUrl(r.url)) return { href: r.url!, verified: false };
  if (r.link_kind === "none" || (!r.url && r.type === "note")) return null;
  return { href: searchUrl(r.title, r.type), verified: false };
}
