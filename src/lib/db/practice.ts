import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TestCase } from "@/lib/runner/piston";
import type { CodingChallenge, Badge, Student } from "@/types";

/** Inserts the challenge and its server-only tests. Caller has authenticated `student_id`. */
export async function createChallenge(data: {
  student_id: string;
  language: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  problem_statement: string;
  starter_code: string;
  used_fallback: boolean;
  validated: boolean;
  tests: TestCase[];
  reference_solution: string | null;
}): Promise<string> {
  const admin = createAdminClient();
  const { tests, reference_solution, ...row } = data;
  const examples = tests.filter((t) => !t.hidden).map((t) => ({ input: t.input, output: t.output }));

  const { data: challenge, error } = await admin
    .from("coding_challenges")
    .insert({ ...row, examples })
    .select("id")
    .single();
  if (error || !challenge) throw new Error("Failed to create challenge");

  const { error: secretError } = await admin
    .from("coding_challenge_secrets")
    .insert({ challenge_id: challenge.id, tests, reference_solution });
  if (secretError) {
    await admin.from("coding_challenges").delete().eq("id", challenge.id);
    throw new Error("Failed to save challenge tests");
  }
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

/** Server-only: every test (visible + hidden). Never pass the result to a client component. */
export async function getChallengeTests(challengeId: string): Promise<TestCase[] | null> {
  const { data } = await createAdminClient()
    .from("coding_challenge_secrets")
    .select("tests")
    .eq("challenge_id", challengeId)
    .maybeSingle();
  return (data?.tests as TestCase[] | undefined) ?? null;
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

export type ChallengeHistoryItem = Pick<
  CodingChallenge,
  "id" | "title" | "language" | "topic" | "difficulty" | "status" | "xp_awarded" | "first_passed_at" | "created_at"
> & { attempts: number; best_correctness: number | null };

/** Recent challenges with submit count and best correctness. */
export async function getChallengeHistory(
  studentId: string,
  limit = 20
): Promise<ChallengeHistoryItem[]> {
  const supabase = await createClient();
  const { data: challenges } = await supabase
    .from("coding_challenges")
    .select("id, title, language, topic, difficulty, status, xp_awarded, first_passed_at, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!challenges?.length) return [];

  const { data: subs } = await supabase
    .from("coding_submissions")
    .select("challenge_id, correctness")
    .eq("student_id", studentId)
    .eq("kind", "submit")
    .in("challenge_id", challenges.map((c) => c.id));

  return challenges.map((c) => {
    const mine = (subs ?? []).filter((s) => s.challenge_id === c.id);
    return {
      ...c,
      attempts: mine.length,
      best_correctness: mine.length ? Math.max(...mine.map((s) => s.correctness)) : null,
    } as ChallengeHistoryItem;
  });
}
