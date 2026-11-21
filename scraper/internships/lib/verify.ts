import * as cheerio from "cheerio";
import { BlockedError, getText } from "./http";
import { checkPakistan, looksClosed } from "./filters";

export type Verdict = "open" | "gone" | "closed" | "unknown";

/**
 * Re-check a listing's apply URL. "gone" = 404/410, "closed" = the page says so,
 * "unknown" = blocked / needs a browser / network error (never treated as closed).
 */
export async function verifyUrl(url: string): Promise<{ verdict: Verdict; detail: string; pakistan?: boolean }> {
  if (/indeed\.com/.test(url)) return { verdict: "unknown", detail: "needs a browser" };
  try {
    const { status, text } = await getText(url, { gapMs: 2000, retries: 1 });
    if (status === 404 || status === 410) return { verdict: "gone", detail: `HTTP ${status}` };
    if (status !== 200) return { verdict: "unknown", detail: `HTTP ${status}` };
    const $ = cheerio.load(text);
    $("script, style, noscript").remove();
    // LinkedIn shows "similar jobs" further down; only its top card speaks for this job.
    const scope = $(".top-card-layout").length ? $(".top-card-layout").text() : $("body").text();
    const closed = $(".closed-job").length > 0 || looksClosed(scope);
    const pakistan = checkPakistan(`${$("title").text()} ${scope.slice(0, 5000)}`).ok;
    return { verdict: closed ? "closed" : "open", detail: `HTTP ${status}`, pakistan };
  } catch (err) {
    return { verdict: "unknown", detail: err instanceof BlockedError ? "blocked" : (err as Error).message };
  }
}
