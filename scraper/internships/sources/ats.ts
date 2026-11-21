import * as cheerio from "cheerio";
import type { RawListing, Source, SourceResult } from "../types";
import { checkInternshipTitle, checkPakistan } from "../lib/filters";
import { BlockedError, getJson, getText, politeFetch } from "../lib/http";
import { htmlToText, parseJobPostings } from "../lib/jsonld";
import { webSearch } from "../lib/search";

// Public job-board APIs of applicant tracking systems. Boards come from a curated list of
// companies hiring in Pakistan (each verified to answer) plus boards discovered through
// web search every run, so new employers show up without code changes.

export type Ats =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "smartrecruiters"
  | "workable"
  | "breezy"
  | "recruitee"
  | "pinpoint"
  | "jazzhr"
  | "workday";

export interface Board {
  ats: Ats;
  /** Board slug; Workday uses "tenant/wdN/site". */
  slug: string;
  name?: string;
}

// Verified 2026-11: each answers with a live board. Global companies are fine: we filter to Pakistan.
const CURATED: Board[] = [
  { ats: "greenhouse", slug: "gomotive", name: "Motive" },
  { ats: "greenhouse", slug: "careem", name: "Careem" },
  { ats: "lever", slug: "educative", name: "Educative" },
  { ats: "ashby", slug: "tajir", name: "Tajir" },
  { ats: "ashby", slug: "kodifly", name: "Kodifly" },
  { ats: "ashby", slug: "Deel", name: "Deel" },
  { ats: "smartrecruiters", slug: "Devsinc", name: "Devsinc" },
  { ats: "smartrecruiters", slug: "SeptemSystems", name: "Septem Systems" },
  { ats: "smartrecruiters", slug: "VoltonicSolutionPvtLtd", name: "Voltonic Solution" },
  { ats: "workable", slug: "devsinc-17", name: "Devsinc" },
  { ats: "workable", slug: "pakistan-mobile-communication-limited-pmcl", name: "Jazz" },
  { ats: "workable", slug: "bayutdubizzle", name: "Bayut | dubizzle" },
  { ats: "workable", slug: "interwood-mobel", name: "Interwood Mobel" },
  { ats: "workable", slug: "prime-system", name: "Prime System" },
  { ats: "workable", slug: "burq", name: "Burq" },
  { ats: "workable", slug: "jeeny", name: "Jeeny" },
  { ats: "workable", slug: "pakistan-single-window", name: "Pakistan Single Window" },
  { ats: "breezy", slug: "zameen", name: "Zameen.com" },
  { ats: "breezy", slug: "avanceon", name: "Avanceon" },
  { ats: "breezy", slug: "dubizzlelabs", name: "dubizzle Labs" },
  { ats: "pinpoint", slug: "emumba", name: "Emumba" },
  { ats: "jazzhr", slug: "10pearls", name: "10Pearls" },
  { ats: "jazzhr", slug: "venturedive", name: "VentureDive" },
  { ats: "jazzhr", slug: "gamedistrict", name: "Game District" },
  { ats: "greenhouse", slug: "nysonian", name: "Nysonian" },
  { ats: "breezy", slug: "savvital", name: "Savvital" },
  { ats: "workday", slug: "talentmanagementsolution/wd3/ContourSoftware-Careers", name: "Contour Software" },
  { ats: "workday", slug: "hitachi/wd1/hitachi", name: "Hitachi Energy" },
  { ats: "workday", slug: "pwc/wd3/Global_Experienced_Careers", name: "PwC (A. F. Ferguson)" },
];

const DISCOVERY_SITES: [Ats, string][] = [
  ["greenhouse", "boards.greenhouse.io"],
  ["greenhouse", "job-boards.greenhouse.io"],
  ["lever", "jobs.lever.co"],
  ["ashby", "jobs.ashbyhq.com"],
  ["smartrecruiters", "jobs.smartrecruiters.com"],
  ["workable", "apply.workable.com"],
  ["breezy", "breezy.hr"],
  ["recruitee", "recruitee.com"],
  ["pinpoint", "pinpointhq.com"],
  ["jazzhr", "applytojob.com"],
  ["workday", "myworkdayjobs.com"],
];
const DISCOVERY_TERMS = ["Pakistan intern", "Lahore", "Karachi", "Islamabad", "Pakistan internship"];

const RESERVED = new Set(["", "jobs", "embed", "api", "v1", "en", "apply", "search", "www", "app", "careers", "p", "o"]);

/** ATS board referenced by a URL, if any. */
export function boardFromUrl(raw: string): Board | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  const seg = u.pathname.split("/").filter(Boolean);
  const first = seg[0] ?? "";
  const sub = host.split(".")[0];
  const pick = (ats: Ats, slug: string | undefined): Board | null =>
    slug && !RESERVED.has(slug.toLowerCase()) && /^[A-Za-z0-9._-]+$/.test(slug) ? { ats, slug } : null;
  if (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io") return pick("greenhouse", first);
  if (host === "jobs.lever.co") return pick("lever", first);
  if (host === "jobs.ashbyhq.com") return pick("ashby", first);
  if (host === "jobs.smartrecruiters.com") return pick("smartrecruiters", first);
  if (host === "apply.workable.com") return pick("workable", first);
  if (host.endsWith(".breezy.hr")) return pick("breezy", sub);
  if (host.endsWith(".recruitee.com")) return pick("recruitee", sub);
  if (host.endsWith(".pinpointhq.com")) return pick("pinpoint", sub);
  if (host.endsWith(".applytojob.com")) return pick("jazzhr", sub);
  const wd = /^([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com$/.exec(host);
  if (wd) {
    const site = /^[a-z]{2}-[A-Z]{2}$/.test(first) ? seg[1] : first;
    return site && site !== "wday" ? { ats: "workday", slug: `${wd[1]}/${wd[2]}/${site}` } : null;
  }
  return null;
}

/** Boards found by other sources (web discovery) during this run. */
export const discoveredBoards: Board[] = [];

const key = (b: Board) => `${b.ats}:${b.slug.toLowerCase()}`;

async function discover(notes: string[]): Promise<Board[]> {
  const found: Board[] = [];
  for (const [, site] of DISCOVERY_SITES) {
    for (const term of DISCOVERY_TERMS) {
      try {
        for (const r of await webSearch(`site:${site} ${term}`)) {
          const b = boardFromUrl(r.url);
          // Search engines pad results with unrelated boards; only follow ones the result ties to Pakistan.
          if (b && checkPakistan(`${r.title} ${r.snippet}`).ok) found.push(b);
        }
      } catch (err) {
        notes.push(`discovery ${site}: ${(err as Error).message}`);
      }
    }
  }
  return found;
}

// Cheap pre-check before per-job detail requests (JazzHR, Workday).
const worthDetail = (title: string, location: string) => checkInternshipTitle(title).ok && checkPakistan(location).ok;

type J = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function greenhouse(b: Board): Promise<RawListing[]> {
  const data = await getJson<J>(`https://boards-api.greenhouse.io/v1/boards/${b.slug}/jobs?content=true`);
  if (!data?.jobs) throw new Error("no board");
  const name = b.name ?? (await getJson<J>(`https://boards-api.greenhouse.io/v1/boards/${b.slug}`))?.name ?? b.slug;
  return (data.jobs as J[]).map((j) => ({
    source: "greenhouse",
    sourceId: String(j.id),
    title: j.title,
    company: name,
    location: [j.location?.name, ...((j.offices ?? []) as J[]).map((o) => o.location ?? o.name)].filter(Boolean).join("; "),
    description: htmlToText(htmlToText(j.content ?? "")).slice(0, 2000), // content is HTML-escaped HTML
    applyUrl: j.absolute_url,
    postedAt: j.first_published ? new Date(j.first_published) : j.updated_at ? new Date(j.updated_at) : null,
  }));
}

async function lever(b: Board): Promise<RawListing[]> {
  const data = await getJson<J[]>(`https://api.lever.co/v0/postings/${b.slug}?mode=json`);
  if (!Array.isArray(data)) throw new Error("no board");
  return data.map((j) => ({
    source: "lever",
    sourceId: j.id,
    title: j.text,
    company: b.name ?? b.slug,
    location: [...(j.categories?.allLocations ?? [j.categories?.location]), j.country].filter(Boolean).join("; "),
    remote: j.workplaceType === "remote",
    description: String(j.descriptionPlain ?? "").slice(0, 2000),
    applyUrl: j.hostedUrl,
    postedAt: j.createdAt ? new Date(j.createdAt) : null,
    stipend: j.salaryRange ? `${j.salaryRange.currency} ${j.salaryRange.min} - ${j.salaryRange.max} per ${j.salaryRange.interval}` : null,
    typeInternship: /intern/i.test(j.categories?.commitment ?? ""),
  }));
}

async function ashby(b: Board): Promise<RawListing[]> {
  const data = await getJson<J>(`https://api.ashbyhq.com/posting-api/job-board/${b.slug}?includeCompensation=true`);
  if (!data?.jobs) throw new Error("no board");
  return (data.jobs as J[])
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      source: "ashby",
      sourceId: j.id,
      title: j.title,
      company: b.name ?? b.slug,
      location: [
        j.location,
        ...((j.secondaryLocations ?? []) as J[]).map((s) => s.location),
        j.address?.postalAddress?.addressLocality,
        j.address?.postalAddress?.addressCountry,
      ]
        .filter(Boolean)
        .join("; "),
      remote: j.isRemote === true || j.workplaceType === "Remote",
      description: String(j.descriptionPlain ?? "").slice(0, 2000),
      applyUrl: j.jobUrl,
      postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
      stipend: j.compensation?.compensationTierSummary ?? null,
      typeInternship: j.employmentType === "Intern",
    }));
}

async function smartrecruiters(b: Board): Promise<RawListing[]> {
  const out: RawListing[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const data = await getJson<J>(`https://api.smartrecruiters.com/v1/companies/${b.slug}/postings?country=pk&limit=100&offset=${offset}`);
    if (!data?.content) throw new Error("no board");
    for (const j of data.content as J[]) {
      out.push({
        source: "smartrecruiters",
        sourceId: j.id,
        title: j.name,
        company: j.company?.name ?? b.name ?? b.slug,
        location: [j.location?.fullLocation, j.location?.city, j.location?.country === "pk" ? "Pakistan" : j.location?.country]
          .filter(Boolean)
          .join(", "),
        remote: j.location?.remote === true,
        applyUrl: `https://jobs.smartrecruiters.com/${b.slug}/${j.id}`,
        postedAt: j.releasedDate ? new Date(j.releasedDate) : null,
        typeInternship: j.experienceLevel?.id === "internship" || /intern/i.test(j.typeOfEmployment?.label ?? ""),
      });
    }
    if (offset + 100 >= (data.totalFound ?? 0)) break;
  }
  return out;
}

async function workable(b: Board): Promise<RawListing[]> {
  // The widget feed returns every open job in one request (the paged v3 API trips Workable's rate limit).
  const data = await getJson<J>(`https://apply.workable.com/api/v1/widget/accounts/${b.slug}`, { gapMs: 3000 });
  if (!data?.jobs) throw new Error("no board");
  return (data.jobs as J[]).map((j) => {
    const locs = (j.locations?.length ? j.locations : [j]) as J[];
    return {
      source: "workable",
      sourceId: `${b.slug}:${j.shortcode}`,
      title: j.title,
      company: data.name ?? b.name ?? b.slug,
      location: locs.map((l) => [l.city, l.region ?? l.state, l.country].filter(Boolean).join(", ")).join("; "),
      remote: j.telecommuting === true,
      applyUrl: `https://apply.workable.com/${b.slug}/j/${j.shortcode}/`,
      postedAt: j.published_on ? new Date(j.published_on) : null,
      typeInternship: /intern/i.test(j.employment_type ?? ""),
    };
  });
}

async function breezy(b: Board): Promise<RawListing[]> {
  const data = await getJson<J[]>(`https://${b.slug}.breezy.hr/json`);
  if (!Array.isArray(data)) throw new Error("no board");
  return data.map((j) => ({
    source: "breezy",
    sourceId: `${b.slug}:${j.id}`,
    title: j.name,
    company: j.company?.name ?? b.name ?? b.slug,
    location: [j.location?.name, j.location?.city, j.location?.country?.name].filter(Boolean).join(", "),
    remote: j.location?.is_remote === true,
    applyUrl: j.url,
    postedAt: j.published_date ? new Date(j.published_date) : null,
    stipend: typeof j.salary === "string" && j.salary ? j.salary : null,
    typeInternship: /intern/i.test(j.type?.name ?? ""),
  }));
}

async function recruitee(b: Board): Promise<RawListing[]> {
  const data = await getJson<J>(`https://${b.slug}.recruitee.com/api/offers/`);
  if (!data?.offers) throw new Error("no board");
  return (data.offers as J[])
    .filter((j) => !j.status || j.status === "published")
    .map((j) => ({
      source: "recruitee",
      sourceId: `${b.slug}:${j.id}`,
      title: j.title,
      company: j.company_name ?? b.name ?? b.slug,
      location: [j.location, j.city, j.country].filter(Boolean).join(", "),
      remote: j.remote === true,
      description: htmlToText(j.description ?? "").slice(0, 2000),
      applyUrl: j.careers_url,
      postedAt: j.published_at ? new Date(j.published_at) : null,
      typeInternship: /intern/i.test(j.employment_type_code ?? ""),
    }));
}

async function pinpoint(b: Board): Promise<RawListing[]> {
  const data = await getJson<J>(`https://${b.slug}.pinpointhq.com/postings.json`);
  if (!data?.data) throw new Error("no board");
  return (data.data as J[]).map((j) => ({
    source: "pinpoint",
    sourceId: `${b.slug}:${j.id}`,
    title: j.title,
    company: b.name ?? b.slug,
    location: [j.location?.name, j.location?.city, j.location?.province].filter(Boolean).join(", "),
    remote: j.workplace_type === "remote",
    description: htmlToText(j.description ?? "").slice(0, 2000),
    applyUrl: j.url,
    deadline: j.deadline_at ? new Date(j.deadline_at) : null,
    stipend: j.compensation_visible && j.compensation ? String(j.compensation) : null,
    typeInternship: /intern/i.test(j.employment_type ?? ""),
  }));
}

async function jazzhr(b: Board): Promise<RawListing[]> {
  const { status, text } = await getText(`https://${b.slug}.applytojob.com/apply`);
  if (status !== 200) throw new Error(`HTTP ${status}`);
  const $ = cheerio.load(text);
  const out: RawListing[] = [];
  for (const el of $("li.list-group-item").toArray()) {
    const a = $(el).find("h3 a").first();
    const href = a.attr("href");
    const title = a.text().trim();
    const location = $(el).find(".fa-map-marker").parent().text().trim();
    if (!href || !worthDetail(title, location)) continue;
    const page = await getText(href);
    const [posting] = parseJobPostings(page.text, href, "jazzhr");
    out.push(
      posting
        ? { ...posting, company: posting.company || (b.name ?? b.slug), location: posting.location || location }
        : { source: "jazzhr", sourceId: href, title, company: b.name ?? b.slug, location, applyUrl: href },
    );
  }
  return out;
}

async function workday(b: Board): Promise<RawListing[]> {
  const [tenant, wd, site] = b.slug.split("/");
  const base = `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}`;
  const out: RawListing[] = [];
  for (const searchText of ["intern", "internship", "trainee"]) {
    const res = await politeFetch(`${base}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ limit: 20, offset: 0, searchText, appliedFacets: {} }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    for (const j of ((await res.json()) as J).jobPostings ?? []) {
      // "3 Locations" hides the cities until the detail call; let those through to it.
      const where = String(j.locationsText ?? "");
      if (!checkInternshipTitle(j.title).ok || out.some((o) => o.sourceId === j.externalPath)) continue;
      if (!/\d+ locations/i.test(where) && !checkPakistan(where).ok) continue;
      const d = (await getJson<J>(`${base}${j.externalPath}`))?.jobPostingInfo;
      if (!d) continue;
      out.push({
        source: "workday",
        sourceId: j.externalPath,
        title: d.title,
        company: b.name ?? tenant,
        location: [d.location, ...(d.additionalLocations ?? [])].filter(Boolean).join("; "),
        remote: /remote/i.test(d.remoteType ?? ""),
        description: htmlToText(d.jobDescription ?? "").slice(0, 2000),
        applyUrl: d.externalUrl,
        postedAt: d.startDate ? new Date(d.startDate) : null,
        closed: d.canApply === false,
        typeInternship: /intern/i.test(d.timeType ?? ""),
      });
    }
  }
  return out;
}

const FETCH: Record<Ats, (b: Board) => Promise<RawListing[]>> = {
  greenhouse,
  lever,
  ashby,
  smartrecruiters,
  workable,
  breezy,
  recruitee,
  pinpoint,
  jazzhr,
  workday,
};

export const atsSource: Source = {
  name: "ats",
  async run(): Promise<SourceResult> {
    const notes: string[] = [];
    const boards = new Map<string, Board>();
    for (const b of [...CURATED, ...discoveredBoards, ...(await discover(notes))]) if (!boards.has(key(b))) boards.set(key(b), b);
    console.log(`[ats] ${boards.size} boards to read`);
    const listings: RawListing[] = [];
    let ok = 0;
    for (const b of boards.values()) {
      try {
        const jobs = await FETCH[b.ats](b);
        listings.push(...jobs);
        ok++;
        console.log(`[ats] ${b.ats}/${b.slug}: ${jobs.length} jobs`);
      } catch (err) {
        notes.push(`${b.ats}/${b.slug}: ${err instanceof BlockedError ? "blocked" : (err as Error).message}`);
      }
    }
    notes.unshift(`${boards.size} boards (${CURATED.length} curated), ${ok} answered`);
    return { listings, notes };
  },
};
