import * as cheerio from "cheerio";
import { politeFetch } from "./http";

// Free web search: the owner's SearXNG (SEARXNG_URL, JSON format enabled), falling back to DuckDuckGo HTML.

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

export async function webSearch(query: string, page = 0): Promise<SearchResult[]> {
  const base = process.env.SEARXNG_URL?.replace(/\/+$/, "");
  if (base) {
    try {
      const params = new URLSearchParams({ q: query, format: "json", pageno: String(page + 1) });
      const res = await politeFetch(`${base}/search?${params}`, { gapMs: 1500, headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = (await res.json()) as { results?: { url: string; title?: string; content?: string }[] };
        return (data.results ?? []).map((r) => ({ url: r.url, title: r.title ?? "", snippet: r.content ?? "" }));
      }
    } catch {
      // fall through to DuckDuckGo
    }
  }
  return duckduckgo(query, page);
}

async function duckduckgo(q: string, page: number): Promise<SearchResult[]> {
  const body = new URLSearchParams({ q, s: String(page * 30), dc: String(page * 30 + 1), kl: "pk-en" });
  try {
    const res = await politeFetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      body,
      gapMs: 4000,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" },
    });
    const html = await res.text();
    if (!res.ok || /anomaly-modal|challenge-form/.test(html)) return [];
    return parseDuckDuckGo(html);
  } catch {
    return [];
  }
}

export function parseDuckDuckGo(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const out: SearchResult[] = [];
  $(".result").each((_, el) => {
    const a = $(el).find("a.result__a").first();
    let href = a.attr("href") ?? "";
    // Links go through //duckduckgo.com/l/?uddg=<encoded target>
    const uddg = /[?&]uddg=([^&]+)/.exec(href)?.[1];
    if (uddg) href = decodeURIComponent(uddg);
    if (href.startsWith("//")) href = `https:${href}`;
    if (!/^https?:\/\//.test(href)) return;
    out.push({ url: href, title: a.text().trim(), snippet: $(el).find(".result__snippet").text().trim() });
  });
  return out;
}
