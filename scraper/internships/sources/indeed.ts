import { chromium } from "playwright";
import type { RawListing, Source, SourceResult } from "../types";
import { htmlToText } from "../lib/jsonld";
import { UA } from "../lib/http";

// pk.indeed.com refuses plain HTTP clients, so a real (headless) browser loads the search
// page and we read the job cards Indeed embeds as JSON. One page at a time, with pauses;
// a challenge page ends the source for this run.

const QUERIES = ["internship", "intern", "internee", "trainee"];
const MAX_PAGES = 8;

type Card = {
  jobkey: string;
  displayTitle?: string;
  title?: string;
  company?: string;
  formattedLocation?: string;
  country?: string;
  remoteLocation?: boolean;
  pubDate?: number;
  snippet?: string;
  salarySnippet?: { text?: string };
  expired?: boolean;
  jobTypes?: string[];
};

export const indeedSource: Source = {
  name: "indeed",
  async run(): Promise<SourceResult> {
    const notes: string[] = [];
    const byKey = new Map<string, RawListing>();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ userAgent: UA, locale: "en-US" });
      outer: for (const q of QUERIES) {
        for (let p = 0; p < MAX_PAGES; p++) {
          const url = `https://pk.indeed.com/jobs?${new URLSearchParams({ q, l: "Pakistan", fromage: "30", sort: "date", start: String(p * 10) })}`;
          const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
          await page.waitForTimeout(3000 + Math.random() * 2000);
          const title = await page.title().catch(() => "");
          if (!res || res.status() === 403 || res.status() === 429 || /just a moment|security check|blocked/i.test(title)) {
            notes.push(`stopped at "${q}" page ${p + 1}: challenge or HTTP ${res?.status() ?? "error"}`);
            break outer;
          }
          const cards = (await page
            .evaluate(
              () =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).mosaic?.providerData?.["mosaic-provider-jobcards"]?.metaData?.mosaicProviderJobCardsModel?.results ?? [],
            )
            .catch(() => [])) as Card[];
          const fresh = cards.filter((c) => c.jobkey && !byKey.has(c.jobkey));
          for (const c of fresh) {
            byKey.set(c.jobkey, {
              source: "indeed",
              sourceId: c.jobkey,
              title: c.displayTitle ?? c.title ?? "",
              company: c.company ?? "",
              // pk.indeed.com geolocates every card; "Remote" there means remote within that country.
              location: `${c.formattedLocation ?? ""}${c.country === "PK" ? ", Pakistan" : ""}`,
              remote: c.remoteLocation === true,
              description: htmlToText(c.snippet ?? ""),
              applyUrl: `https://pk.indeed.com/viewjob?jk=${c.jobkey}`,
              postedAt: c.pubDate ? new Date(c.pubDate) : null,
              stipend: c.salarySnippet?.text ?? null,
              closed: c.expired === true,
              typeInternship: (c.jobTypes ?? []).some((t) => /internship/i.test(t)),
            });
          }
          if (cards.length === 0 || fresh.length === 0) break;
        }
      }
    } finally {
      await browser.close();
    }
    notes.push(`${byKey.size} cards`);
    return { listings: [...byKey.values()], notes };
  },
};
