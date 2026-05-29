import { createClient } from "@/lib/supabase/server";
import type { MilestoneTest, MilestoneTestAttempt } from "@/types";

export async function getMilestoneTestsForRoadmap(
  roadmapId: string
): Promise<MilestoneTest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestone_tests")
    .select("*")
    .eq("roadmap_id", roadmapId)
    .order("section_index", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MilestoneTest[];
}

export async function getMilestoneTestById(
  testId: string
): Promise<MilestoneTest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestone_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (error || !data) return null;
  return data as MilestoneTest;
}

export async function getUnlockedSections(
  studentId: string,
  roadmapId: string
): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unlocked_sections")
    .select("section_index")
    .eq("student_id", studentId)
    .eq("roadmap_id", roadmapId);

  if (error) return [0];
  return (data ?? []).map((row) => row.section_index);
}

export async function saveTestAttempt(attempt: {
  test_id: string;
  student_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  roadmap_id: string;
  next_section_index: number;
}): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestone_test_attempts")
    .insert({
      test_id: attempt.test_id,
      student_id: attempt.student_id,
      score: attempt.score,
      passed: attempt.passed,
      answers: attempt.answers,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to save test attempt");

  if (attempt.passed) {
    await supabase
      .from("unlocked_sections")
      .upsert({
        student_id: attempt.student_id,
        roadmap_id: attempt.roadmap_id,
        section_index: attempt.next_section_index,
      });
  }

  return data.id;
}

export async function getTestAttempts(
  studentId: string,
  testId: string
): Promise<MilestoneTestAttempt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestone_test_attempts")
    .select("*")
    .eq("student_id", studentId)
    .eq("test_id", testId)
    .order("attempted_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as MilestoneTestAttempt[];
}
