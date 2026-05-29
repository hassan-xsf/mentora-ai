import { createClient } from "@/lib/supabase/server";
import type { CodingChallenge, Badge, EvaluationResult, Student } from "@/types";

export async function createChallenge(data: {
  student_id: string;
  language: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  problem_statement: string;
  starter_code: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data: challenge, error } = await supabase
    .from("coding_challenges")
    .insert(data)
    .select("id")
    .single();

  if (error || !challenge) throw new Error("Failed to create challenge");
  return challenge.id;
}

export async function getChallengeById(
  id: string,
  studentId: string
): Promise<CodingChallenge | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_challenges")
    .select("*")
    .eq("id", id)
    .eq("student_id", studentId)
    .single();

  if (error || !data) return null;
  return data as CodingChallenge;
}

export async function saveEvaluation(
  challengeId: string,
  result: EvaluationResult,
  xpAwarded: number
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("coding_challenges")
    .update({
      evaluation_result: result,
      status: "evaluated",
      xp_awarded: xpAwarded,
      student_submission: null, // stored separately
    })
    .eq("id", challengeId);
}

export async function getStudentXP(studentId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("xp_total")
    .eq("id", studentId)
    .single();

  return data?.xp_total ?? 0;
}

export async function getStudentProfile(studentId: string): Promise<Pick<Student, "xp_total" | "streak_count" | "full_name">> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("xp_total, streak_count, full_name")
    .eq("id", studentId)
    .single();

  return {
    xp_total: data?.xp_total ?? 0,
    streak_count: data?.streak_count ?? 0,
    full_name: data?.full_name ?? null,
  };
}

export async function getStudentBadges(studentId: string): Promise<Badge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("*")
    .eq("student_id", studentId)
    .order("awarded_at", { ascending: false });

  return (data ?? []) as Badge[];
}

export async function getChallengeHistory(
  studentId: string,
  limit = 20
): Promise<CodingChallenge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coding_challenges")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as CodingChallenge[];
}
