import type { RawListing, Source, SourceResult } from "../types";
import { checkPakistan } from "../lib/filters";
import { getText, isBlocked } from "../lib/http";
import { parseJobPostings } from "../lib/jsonld";
import { webSearch } from "../lib/search";
import { boardFromUrl, discoveredBoards } from "./ats";

// Open-web discovery through SearXNG: search results that are ATS boards feed the ATS source;
// any other result page is fetched and kept only if it carries a schema.org JobPosting
// (company career pages, Pakistani job boards). Pages without structured data are skipped.

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];
const QUERIES = [
  ...CITIES.map((c) => `internship ${c} ${new Date().getFullYear()}`),
  ...CITIES.slice(0, 3).map((c) => `paid internship ${c} apply`),
  "internship program Pakistan apply now",
  "summer internship Pakistan",
  "software engineering intern Pakistan",
  "remote internship Pakistan students",
  "internee jobs Pakistan",
  "site:rozee.pk internship",
  "site:mustakbil.com internship",
  "site:zohorecruit.com internship Pakistan",
  "site:jobs.punjab.gov.pk internship",
];
const COVERED = /(^|\.)(linkedin\.com|indeed\.com|jobz\.pk|pintern\.net|wikipedia\.org|youtube\.com|facebook\.com|instagram\.com|reddit\.com|glassdoor\.com|slideshare\.net|scribd\.com)$/;
const MAX_PAGES = 80;

export const webSource: Source = {
  name: "web",
  async run(): Promise<SourceResult> {
    const notes: string[] = [];
    const urls = new Set<string>();
    for (const q of QUERIES) {
      for (const r of await webSearch(q).catch(() => [])) {
        const board = boardFromUrl(r.url);
        if (board) {
          if (checkPakistan(`${r.title} ${r.snippet}`).ok) discoveredBoards.push(board);
        }
        else if (!COVERED.test(new URL(r.url).hostname)) urls.add(r.url.split("#")[0]);
      }
    }
    const listings: RawListing[] = [];
    let fetched = 0;
    // Pages that look like a single posting first; listing pages and articles rarely carry JobPosting data.
    const jobLike = (u: string) => (/\/(jobs?|careers?|vacanc\w*|openings?|positions?|internships?)\/[^/?#]+/i.test(new URL(u).pathname) ? 0 : 1);
    for (const url of [...urls].sort((a, b) => jobLike(a) - jobLike(b))) {
      if (fetched >= MAX_PAGES) break;
      if (isBlocked(url)) continue;
      fetched++;
      try {
        const { status, text, url: finalUrl } = await getText(url, { retries: 0 });
        if (status === 200) listings.push(...parseJobPostings(text, finalUrl, "web"));
      } catch {
        // blocked or unreachable: the host is remembered and skipped
      }
    }
    notes.push(`${QUERIES.length} searches, ${urls.size} candidate pages, ${fetched} fetched, ${discoveredBoards.length} ATS links handed on`);
    return { listings, notes };
  },
};
