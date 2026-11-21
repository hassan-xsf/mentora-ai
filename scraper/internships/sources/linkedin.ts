import * as cheerio from "cheerio";
import type { RawListing, Source, SourceResult } from "../types";
import { checkInternshipTitle, checkPakistan } from "../lib/filters";
import { BlockedError, getText } from "../lib/http";

// LinkedIn's public (logged-out) job search, the same HTML its guest pages load.
// Search pages give title/company/location/date; the public job page adds the description,
// the employment type and whether it still accepts applications.

const SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";
const KEYWORDS = ["intern", "internship", "internee", "trainee", "summer internship"];
const MAX_PAGES = 25; // 10 cards a page; LinkedIn stops at ~1000 results per query
const GAP = 4000;

export function parseSearch(html: string): RawListing[] {
  const $ = cheerio.load(html);
  return $(".base-search-card")
    .toArray()
    .map((el) => {
      const card = $(el);
      const id = /jobPosting:(\d+)/.exec(card.attr("data-entity-urn") ?? "")?.[1] ?? "";
      const date = card.find("time").attr("datetime");
      // The card's own link (pk.linkedin.com/jobs/view/<slug>-<id>) is where www.linkedin.com redirects anyway.
      const href = (card.find("a.base-card__full-link").attr("href") ?? "").split("?")[0];
      return {
        source: "linkedin",
        sourceId: id,
        title: card.find(".base-search-card__title").text().trim(),
        company: card.find(".base-search-card__subtitle").text().trim(),
        location: card.find(".job-search-card__location").text().trim(),
        applyUrl: /^https:\/\/[a-z]{2,3}\.linkedin\.com\/jobs\/view\/[\w-]+-\d+$/.test(href) ? href : `https://www.linkedin.com/jobs/view/${id}`,
        postedAt: date ? new Date(date) : null,
      };
    })
    .filter((l) => l.sourceId && l.title);
}

export function parseJobPage(html: string): Pick<RawListing, "description" | "closed" | "typeInternship"> & { employmentType: string } {
  const $ = cheerio.load(html);
  const criteria: Record<string, string> = {};
  $(".description__job-criteria-item").each((_, el) => {
    criteria[$(el).find("h3").text().trim().toLowerCase()] = $(el).find("span").text().trim();
  });
  const employmentType = criteria["employment type"] ?? "";
  return {
    description: $(".show-more-less-html__markup").first().text().replace(/\s+/g, " ").trim().slice(0, 2000),
    closed: $(".closed-job").length > 0 || /no longer accepting applications/i.test($(".top-card-layout").text()),
    typeInternship: /internship/i.test(employmentType),
    employmentType,
  };
}

export const linkedinSource: Source = {
  name: "linkedin",
  async run(): Promise<SourceResult> {
    const notes: string[] = [];
    const byId = new Map<string, RawListing>();
    try {
      for (const kw of KEYWORDS) {
        for (let page = 0; page < MAX_PAGES; page++) {
          const params = new URLSearchParams({ keywords: kw, location: "Pakistan", f_TPR: "r2592000", start: String(page * 10) });
          const { status, text } = await getText(`${SEARCH}?${params}`, { gapMs: GAP });
          const cards = status === 200 ? parseSearch(text) : [];
          if (!cards.length) break;
          for (const c of cards) if (!byId.has(c.sourceId)) byId.set(c.sourceId, c);
        }
      }
    } catch (err) {
      notes.push(`search stopped: ${(err as Error).message}`);
    }

    // Detail pages only for cards that could pass the filters.
    let detailed = 0;
    for (const l of byId.values()) {
      if (!checkInternshipTitle(l.title).ok || !checkPakistan(l.location).ok) continue;
      try {
        const { status, text } = await getText(l.applyUrl, { gapMs: GAP });
        if (status === 404 || status === 410) {
          l.closed = true;
          continue;
        }
        const d = parseJobPage(text);
        l.description = /volunteer/i.test(d.employmentType) ? `${d.description} (Employment type: Volunteer)` : d.description;
        l.closed = d.closed;
        l.typeInternship = d.typeInternship;
        detailed++;
      } catch (err) {
        if (err instanceof BlockedError) {
          notes.push(`detail pages stopped after ${detailed}: ${err.message}`);
          break;
        }
      }
    }
    notes.push(`${byId.size} cards, ${detailed} detail pages`);
    return { listings: [...byId.values()], notes };
  },
};
