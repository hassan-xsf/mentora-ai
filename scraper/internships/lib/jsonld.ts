import * as cheerio from "cheerio";
import type { RawListing } from "../types";
import { parseDate } from "./filters";

type Obj = Record<string, unknown>;

export function htmlToText(html: string): string {
  return cheerio.load(`<div>${html}</div>`)("div").first().text().replace(/\s+/g, " ").trim();
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const name = (v: unknown): string => (v && typeof v === "object" ? str((v as Obj).name) : str(v));
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v ? [v] : []);

function collect(node: unknown, out: Obj[]): void {
  for (const n of list(node)) {
    if (!n || typeof n !== "object") continue;
    const o = n as Obj;
    if (list(o["@type"]).includes("JobPosting")) out.push(o);
    if (o["@graph"]) collect(o["@graph"], out);
  }
}

function place(loc: unknown): string {
  const a = (loc && typeof loc === "object" ? (loc as Obj).address ?? loc : loc) as unknown;
  if (typeof a === "string") return a;
  if (!a || typeof a !== "object") return "";
  const o = a as Obj;
  return [str(o.addressLocality), str(o.addressRegion), name(o.addressCountry)].filter(Boolean).join(", ");
}

function salary(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Obj;
  const val = (o.value ?? {}) as Obj;
  const min = str(val.minValue) || str(val.value) || (typeof o.value !== "object" ? str(o.value) : "");
  const max = str(val.maxValue);
  if (!min || min === "0") return null;
  const unit = str(val.unitText).toLowerCase();
  return `${str(o.currency) || "PKR"} ${min}${max && max !== min ? ` - ${max}` : ""}${unit ? ` per ${unit}` : ""}`;
}

/** schema.org JobPosting blocks on a page -> raw listings. Pages without one yield nothing (precision over recall). */
export function parseJobPostings(html: string, pageUrl: string, source: string): RawListing[] {
  const $ = cheerio.load(html);
  const found: Obj[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      collect(JSON.parse($(el).text().replace(/[\u0000-\u001f]+/g, " ")), found);
    } catch {
      // malformed block; ignore
    }
  });
  return found.map((j) => {
    const remote = str(j.jobLocationType).toUpperCase() === "TELECOMMUTE";
    const applicant = list(j.applicantLocationRequirements).map(name).filter(Boolean).join(", ");
    const location = [list(j.jobLocation).map(place).filter(Boolean).join("; "), remote ? `Remote${applicant ? ` - ${applicant}` : ""}` : ""]
      .filter(Boolean)
      .join("; ");
    const id = j.identifier && typeof j.identifier === "object" ? str((j.identifier as Obj).value) : str(j.identifier);
    return {
      source,
      sourceId: id ? `${new URL(pageUrl).host}:${id}` : pageUrl,
      title: htmlToText(str(j.title)),
      company: name(j.hiringOrganization) || (j.identifier && typeof j.identifier === "object" ? str((j.identifier as Obj).name) : ""),
      location,
      remote,
      description: htmlToText(str(j.description)).slice(0, 2000),
      applyUrl: pageUrl,
      postedAt: str(j.datePosted) ? new Date(str(j.datePosted)) : null,
      deadline: str(j.validThrough) ? (parseDate(str(j.validThrough)) ?? new Date(str(j.validThrough))) : null,
      stipend: salary(j.baseSalary),
    };
  });
}
