import { createClient } from "@/lib/supabase/server";
import type { Career } from "@/types";
import type { BankQuestion, ValidAnswer } from "@/lib/assessment/validate";
import type { SkillProfile } from "@/lib/assessment/profile";
import type { CareerSuggestionResult } from "@/app/actions/career-suggestions";

/** The current question bank (rows seeded by migration 009; legacy rows have no slug). */
export async function getAssessmentQuestions(): Promise<BankQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("id, slug, question, type, options, is_core")
    .not("slug", "is", null)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BankQuestion[];
}

export type SavedAssessment = {
  id: string;
  student_id: string;
  answers: ValidAnswer[];
  skill_profile: SkillProfile;
  suggestions: CareerSuggestionResult[];
  used_fallback: boolean;
  created_at: string;
};

/** One assessment, only if it belongs to `studentId` (RLS enforces the same). */
export async function getAssessment(id: string, studentId: string): Promise<SavedAssessment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .eq("student_id", studentId)
    .maybeSingle();
  return (data as SavedAssessment | null) ?? null;
}

export type AssessmentSummary = {
  id: string;
  created_at: string;
  used_fallback: boolean;
  top_career: string | null;
};

export async function listAssessments(studentId: string, limit = 10): Promise<AssessmentSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("id, created_at, used_fallback, suggestions")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    used_fallback: r.used_fallback,
    top_career: (r.suggestions as CareerSuggestionResult[] | null)?.[0]?.title ?? null,
  }));
}

export async function getCareers(): Promise<Career[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Career[];
}

export async function getCareerById(id: string): Promise<Career | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Career;
}
