// Polite HTTP: one request at a time per host, a gap between requests, backoff on
// 5xx/timeouts, and a hard stop for a host that answers 403/429 (we never push past a block).

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

export class BlockedError extends Error {}

const blocked = new Set<string>();
const lastHit = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isBlocked(url: string): boolean {
  return blocked.has(new URL(url).host);
}

/** Fetch with a per-host gap (default 1.2 s). Throws BlockedError on 403/429 and remembers the host. */
export async function politeFetch(
  url: string,
  init: RequestInit & { gapMs?: number; retries?: number } = {},
): Promise<Response> {
  const host = new URL(url).host;
  if (blocked.has(host)) throw new BlockedError(`${host} blocked earlier in this run`);
  const { gapMs = 1200, retries = 2, ...rest } = init;
  for (let attempt = 0; ; attempt++) {
    const wait = (lastHit.get(host) ?? 0) + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastHit.set(host, Date.now());
    try {
      const res = await fetch(url, {
        ...rest,
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", ...(rest.headers ?? {}) },
        signal: AbortSignal.timeout(25_000),
      });
      // Rate limited: back off once for a minute, then give the host up for this run.
      if (res.status === 429 && attempt === 0 && retries > 0) {
        await sleep(60_000);
        continue;
      }
      if (res.status === 403 || res.status === 429) {
        blocked.add(host);
        throw new BlockedError(`${host} answered ${res.status}`);
      }
      if (res.status >= 500 && attempt < retries) {
        await sleep(2000 * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      if (err instanceof BlockedError || attempt >= retries) throw err;
      await sleep(2000 * 2 ** attempt);
    }
  }
}

export async function getJson<T>(url: string, init: Parameters<typeof politeFetch>[1] = {}): Promise<T | null> {
  const res = await politeFetch(url, { ...init, headers: { Accept: "application/json", ...(init.headers ?? {}) } });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

export async function getText(url: string, init: Parameters<typeof politeFetch>[1] = {}): Promise<{ status: number; text: string; url: string }> {
  const res = await politeFetch(url, init);
  return { status: res.status, text: await res.text(), url: res.url };
}
