import * as cheerio from "cheerio";
import type { RawListing, Source, SourceResult } from "../types";
import { checkInternshipTitle, parseDate } from "../lib/filters";
import { BlockedError, getText } from "../lib/http";
import { parseJobPostings } from "../lib/jsonld";

// jobz.pk republishes newspaper job ads (government bodies, banks, universities, NGOs) with a
// schema.org JobPosting per ad. This is where government / organisation internship programmes
// (often not on LinkedIn) show up.

const LISTS = ["internship-jobs", "internship-program-jobs", "internee-jobs", "trainee-jobs", "apprenticeship-jobs"];
const MAX_AGE_DAYS = 45;

interface Row {
  url: string;
  org: string;
  city: string;
  posted: Date | null;
  positions: string[];
}

export function parseList(html: string): Row[] {
  const $ = cheerio.load(html);
  const rows: Row[] = [];
  $(".row_container").each((_, el) => {
    const r = $(el);
    const a = r.find(".cell1 a").first();
    const url = a.attr("href") ?? "";
    if (!/_jobs-\d+\.html$/.test(url)) return;
    rows.push({
      url,
      org: r.find(".cell2").first().text().trim(),
      city: r.find(".cell3").first().text().trim(),
      posted: parseDate(r.find(".cell4").first().text().replace(/\//g, "-")),
      positions: r
        .find(".cell1")
        .last()
        .find("a")
        .toArray()
        .map((p) => $(p).text().trim())
        .filter(Boolean),
    });
  });
  return rows;
}

export const jobzSource: Source = {
  name: "jobzpk",
  async run(): Promise<SourceResult> {
    const notes: string[] = [];
    const rows = new Map<string, Row>();
    try {
      for (const list of LISTS) {
        const { status, text } = await getText(`https://www.jobz.pk/${list}/`, { gapMs: 2000 });
        if (status === 200) for (const r of parseList(text)) rows.set(r.url, r);
      }
    } catch (err) {
      notes.push(`lists stopped: ${(err as Error).message}`);
    }
    const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
    const listings: RawListing[] = [];
    for (const r of rows.values()) {
      const position = r.positions.find((p) => checkInternshipTitle(p).ok);
      if (!position || (r.posted && r.posted.getTime() < cutoff)) continue;
      try {
        const { status, text } = await getText(r.url, { gapMs: 2000 });
        if (status !== 200) continue;
        const [p] = parseJobPostings(text, r.url, "jobzpk");
        const lastDate = /Expected Last Date:\s*([^<\n]{6,30})/i.exec(cheerio.load(text).text())?.[1];
        listings.push({
          source: "jobzpk",
          sourceId: r.url,
          // The ad title is "<Org> <City> Job 2026"; the position names the role.
          title: p && checkInternshipTitle(p.title).ok ? titleCase(p.title) : position,
          company: p?.company || r.org,
          location: p?.location || `${r.city}, Pakistan`,
          description: p?.description,
          applyUrl: r.url,
          postedAt: p?.postedAt ?? r.posted,
          deadline: (lastDate ? parseDate(lastDate) : null) ?? p?.deadline ?? null,
        });
      } catch (err) {
        if (err instanceof BlockedError) {
          notes.push(`detail pages stopped: ${err.message}`);
          break;
        }
      }
    }
    notes.push(`${rows.size} ads listed, ${listings.length} internship ads fetched`);
    return { listings, notes };
  },
};

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
