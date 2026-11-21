import type { Internship, RawListing, Reject } from "../types";
import {
  canonicalUrl,
  checkInternshipTitle,
  checkPakistan,
  classifyField,
  dedupeKey,
  detectDeadline,
  detectPay,
} from "./filters";

export const MAX_AGE_DAYS = 45;

// When two sources carry the same internship, keep the one closest to the employer.
const PRIORITY = ["greenhouse", "lever", "ashby", "smartrecruiters", "workable", "breezy", "recruitee", "pinpoint", "jazzhr", "workday", "web", "linkedin", "indeed", "pintern", "jobzpk"];
const rank = (s: string) => (PRIORITY.indexOf(s) + 1 || PRIORITY.length + 1);

const karachiToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }); // YYYY-MM-DD

/** One raw listing -> a clean row, or the reason it was dropped. */
export function toInternship(l: RawListing, now = new Date()): Internship | Reject {
  const title = l.title.replace(/\s+/g, " ").trim();
  const company = l.company.replace(/\s+/g, " ").trim();
  const t = checkInternshipTitle(title);
  if (!title || !company || (!t.ok && !l.typeInternship)) return "not_internship";
  const pk = checkPakistan(l.location, l.remote);
  if (!pk.ok) return "not_pakistan";
  if (l.closed) return "closed";
  if (l.postedAt && !isNaN(l.postedAt.getTime()) && now.getTime() - l.postedAt.getTime() > MAX_AGE_DAYS * 864e5) return "stale";
  const description = l.description?.trim() ?? "";
  const deadline = l.deadline && !isNaN(l.deadline.getTime()) ? l.deadline : detectDeadline(description);
  const deadlineDay = deadline?.toISOString().slice(0, 10) ?? null;
  if (deadlineDay && deadlineDay < karachiToday()) return "expired";
  if (!/^https?:\/\//.test(l.applyUrl)) return "bad_url";
  const pay = detectPay(`${title} ${description}`, l.stipend);
  return {
    source: l.source,
    source_id: l.sourceId,
    title,
    company,
    city: pk.city,
    is_remote: pk.remote,
    is_trainee: t.trainee,
    field: classifyField(title, description),
    stipend: pay.stipend,
    is_paid: pay.isPaid,
    description: description ? description.slice(0, 300) + (description.length > 300 ? "…" : "") : null,
    apply_url: l.applyUrl,
    posted_at: l.postedAt && !isNaN(l.postedAt.getTime()) ? l.postedAt.toISOString() : null,
    deadline: deadlineDay,
    dedupe_key: dedupeKey(company, title, pk.city, pk.remote),
  };
}

/** Collapse duplicates by dedupe key and canonical URL; the higher-priority source wins, gaps are filled from the other. */
export function dedupe(rows: Internship[]): { kept: Internship[]; duplicates: Internship[] } {
  const byKey = new Map<string, Internship>();
  const byUrl = new Map<string, string>(); // canonical url -> dedupe key
  const duplicates: Internship[] = [];
  for (const row of rows) {
    const url = canonicalUrl(row.apply_url);
    const existingKey = byKey.has(row.dedupe_key) ? row.dedupe_key : byUrl.get(url);
    const prev = existingKey ? byKey.get(existingKey) : undefined;
    if (!prev) {
      byKey.set(row.dedupe_key, row);
      byUrl.set(url, row.dedupe_key);
      continue;
    }
    const [win, lose] = rank(row.source) < rank(prev.source) ? [row, prev] : [prev, row];
    const merged: Internship = {
      ...win,
      stipend: win.stipend ?? lose.stipend,
      is_paid: win.is_paid ?? lose.is_paid,
      description: win.description ?? lose.description,
      posted_at: win.posted_at ?? lose.posted_at,
      deadline: win.deadline ?? lose.deadline,
      dedupe_key: prev.dedupe_key,
    };
    byKey.set(prev.dedupe_key, merged);
    byUrl.set(url, prev.dedupe_key);
    byUrl.set(canonicalUrl(merged.apply_url), prev.dedupe_key);
    duplicates.push(lose);
  }
  return { kept: [...byKey.values()], duplicates };
}
