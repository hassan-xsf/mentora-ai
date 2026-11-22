import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import { classifyField } from "../../../scraper/internships/lib/filters";

export type Internship = Database["public"]["Tables"]["internships"]["Row"];
export type InternshipField = Internship["field"];

export const FIELD_LABELS: Record<InternshipField, string> = {
  software: "Software",
  data_ai: "Data & AI",
  design: "Design",
  marketing: "Marketing & Sales",
  finance: "Finance",
  hr: "HR",
  engineering: "Engineering",
  other: "Other",
};

export const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  jobzpk: "Jobz.pk",
  pintern: "Pintern.net",
  web: "Company site",
  greenhouse: "Company careers (Greenhouse)",
  lever: "Company careers (Lever)",
  ashby: "Company careers (Ashby)",
  smartrecruiters: "Company careers (SmartRecruiters)",
  workable: "Company careers (Workable)",
  breezy: "Company careers (Breezy)",
  recruitee: "Company careers (Recruitee)",
  pinpoint: "Company careers (Pinpoint)",
  jazzhr: "Company careers (JazzHR)",
  workday: "Company careers (Workday)",
};

export interface InternshipFilters {
  q?: string;
  city?: string;
  field?: string;
  remote?: boolean;
  paid?: boolean;
  withinDays?: number;
  ids?: string[];
}

const MISSING = new Set(["42P01", "PGRST205"]); // table not created yet (migration 013 not applied)
// The page ranks and paginates in memory, so fetch every active listing (182 today).
const LIMIT = 1000;

/** Active internships, newest first. `missing` = the table doesn't exist yet. */
export async function listInternships(f: InternshipFilters): Promise<{ rows: Internship[]; missing: boolean }> {
  const supabase = await createClient();
  let query = supabase.from("internships").select("*").eq("is_active", true);
  const q = f.q?.replace(/[%_,()*]/g, " ").trim();
  if (q) query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  if (f.ids) query = query.in("id", f.ids.length ? f.ids : ["00000000-0000-0000-0000-000000000000"]);
  if (f.city) query = query.eq("city", f.city);
  if (f.field && f.field in FIELD_LABELS) query = query.eq("field", f.field as InternshipField);
  if (f.remote) query = query.eq("is_remote", true);
  if (f.paid) query = query.eq("is_paid", true);
  if (f.withinDays) query = query.gte("posted_at", new Date(Date.now() - f.withinDays * 864e5).toISOString());
  const { data, error } = await query
    .order("posted_at", { ascending: false, nullsFirst: false })
    .order("first_seen_at", { ascending: false })
    .limit(LIMIT);
  if (error) {
    if (MISSING.has(error.code)) return { rows: [], missing: true };
    throw new Error(`internships: ${error.message}`);
  }
  return { rows: data ?? [], missing: false };
}

/** Cities that currently have listings, for the filter dropdown. */
export async function listInternshipCities(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("internships").select("city").eq("is_active", true).not("city", "is", null).limit(2000);
  if (error) return [];
  const counts = new Map<string, number>();
  for (const r of data ?? []) if (r.city) counts.set(r.city, (counts.get(r.city) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

export async function getSavedInternshipIds(studentId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("saved_internships").select("internship_id").eq("student_id", studentId);
  return new Set((data ?? []).map((r) => r.internship_id));
}

/** Career titles the student is working towards: roadmap titles + latest assessment suggestions. */
export async function getCareerTitles(studentId: string): Promise<string[]> {
  const supabase = await createClient();
  const [{ data: roadmaps }, { data: assessment }] = await Promise.all([
    supabase.from("roadmaps").select("title").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5),
    supabase.from("assessments").select("suggestions").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const suggested = Array.isArray(assessment?.suggestions)
    ? (assessment.suggestions as Json[]).map((s) => (s && typeof s === "object" && !Array.isArray(s) ? String(s.title ?? "") : "")).slice(0, 3)
    : [];
  return [...(roadmaps ?? []).map((r) => r.title), ...suggested].filter(Boolean);
}

const STOP = new Set(["roadmap", "career", "path", "the", "and", "for", "to", "of", "a", "an", "in", "intern", "internship", "junior", "senior", "specialist"]);

/**
 * Rank by fit with the student's careers: same field (from the career title) weighs most,
 * shared title words add to it, newer wins ties. Listings with no fit are dropped.
 */
export function rankForCareers(rows: Internship[], careers: string[]): Internship[] {
  if (!careers.length) return [];
  const fields = new Set<InternshipField>(careers.map((c) => classifyField(c)).filter((f) => f !== "other"));
  const words = new Set(
    careers.flatMap((c) => c.toLowerCase().split(/[^a-z0-9+#.]+/)).filter((w) => w.length > 1 && !STOP.has(w)),
  );
  return rows
    .map((r) => {
      const titleWords = r.title.toLowerCase().split(/[^a-z0-9+#.]+/);
      const score = (fields.has(r.field) ? 3 : 0) + titleWords.filter((w) => words.has(w)).length;
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.r.posted_at ?? "").localeCompare(a.r.posted_at ?? ""))
    .map((x) => x.r);
}
