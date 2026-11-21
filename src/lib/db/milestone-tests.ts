import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import type { MilestoneTest } from "@/types";
import type { StoredQuestion } from "@/lib/adaptive/questions";

/**
 * Test metadata for the roadmap view. `milestone_tests` is server-only, so this
 * reads with the admin client after checking the roadmap belongs to the caller,
 * and never returns questions.
 */
export async function getMilestoneTestsForRoadmap(roadmapId: string): Promise<MilestoneTest[]> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: roadmap } = await admin
    .from("roadmaps")
    .select("id")
    .eq("id", roadmapId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!roadmap) return [];

  const { data, error } = await admin
    .from("milestone_tests")
    .select("id, roadmap_id, section_index, type, title, used_fallback, created_at")
    .eq("roadmap_id", roadmapId)
    .order("section_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((t) => ({ ...t, questions: [] })) as MilestoneTest[];
}

export async function getUnlockedSections(studentId: string, roadmapId: string): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unlocked_sections")
    .select("section_index")
    .eq("student_id", studentId)
    .eq("roadmap_id", roadmapId);

  if (error) return [0];
  return (data ?? []).map((row) => row.section_index);
}

export type OwnedTest = {
  id: string;
  roadmap_id: string;
  roadmap_title: string;
  section_index: number;
  title: string;
  /** The section this test belongs to is open to the student. */
  unlocked: boolean;
};

/** A test, only if its roadmap belongs to `studentId`. Admin read (server-only table). */
export async function getOwnedTest(testId: string, studentId: string): Promise<OwnedTest | null> {
  const admin = createAdminClient();
  const { data: test } = await admin
    .from("milestone_tests")
    .select("id, roadmap_id, section_index, title")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return null;

  const [{ data: roadmap }, { data: unlocked }] = await Promise.all([
    admin.from("roadmaps").select("title").eq("id", test.roadmap_id).eq("student_id", studentId).maybeSingle(),
    admin
      .from("unlocked_sections")
      .select("section_index")
      .eq("student_id", studentId)
      .eq("roadmap_id", test.roadmap_id)
      .eq("section_index", test.section_index)
      .maybeSingle(),
  ]);
  if (!roadmap) return null;
  return { ...test, roadmap_title: roadmap.title, unlocked: test.section_index === 0 || !!unlocked };
}

export type TestSession = {
  id: string;
  test_id: string;
  questions: StoredQuestion[];
  used_fallback: boolean;
  created_at: string;
};

/** The student's unsubmitted question set for a test, if any. Contains answers — server use only. */
export async function getOpenSession(testId: string, studentId: string): Promise<TestSession | null> {
  const { data } = await createAdminClient()
    .from("milestone_test_sessions")
    .select("id, test_id, questions, used_fallback, created_at")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .is("submitted_at", null)
    .maybeSingle();
  return data ? ({ ...data, questions: data.questions as unknown as StoredQuestion[] }) : null;
}

export type QuestionResult = {
  question_id: string;
  position: number;
  node_id: string | null;
  type: "mcq" | "short";
  question: string;
  options: string[] | null;
  student_answer: string;
  correct_answer: string | null;
  is_correct: boolean;
  score: number;
  feedback: string | null;
  explanation: string | null;
};

export type AttemptDetail = {
  id: string;
  score: number;
  passed: boolean;
  practice: boolean;
  attempted_at: string;
  results: QuestionResult[];
};

/** Latest submitted attempt with its per-question results (select-own RLS). */
export async function getLatestAttempt(testId: string, studentId: string): Promise<AttemptDetail | null> {
  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("milestone_test_attempts")
    .select("id, score, passed, practice, attempted_at")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!attempt) return null;

  const { data: results } = await supabase
    .from("milestone_question_results")
    .select(
      "question_id, position, node_id, type, question, options, student_answer, correct_answer, is_correct, score, feedback, explanation"
    )
    .eq("attempt_id", attempt.id)
    .order("position", { ascending: true });
  return {
    ...attempt,
    practice: attempt.practice ?? false,
    results: (results ?? []).map((r) => ({ ...r, options: r.options as string[] | null, score: Number(r.score) })),
  };
}

export async function hasPassedTest(testId: string, studentId: string): Promise<boolean> {
  const { count } = await createAdminClient()
    .from("milestone_test_attempts")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .eq("passed", true);
  return (count ?? 0) > 0;
}
