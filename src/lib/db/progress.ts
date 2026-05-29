import { createClient } from "@/lib/supabase/server";
import type { ProgressRecord, ActivityDataPoint } from "@/types";

export async function getProgressRecord(studentId: string): Promise<ProgressRecord> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("progress_records")
    .select("*")
    .eq("student_id", studentId)
    .single();

  if (data) return data as ProgressRecord;

  // Create default record
  const { data: created } = await supabase
    .from("progress_records")
    .insert({ student_id: studentId })
    .select()
    .single();

  return (created ?? {
    student_id: studentId,
    roadmaps_completed: 0,
    nodes_completed: 0,
    milestone_tests_taken: 0,
    milestone_tests_avg_score: 0,
    coding_challenges_completed: 0,
    updated_at: new Date().toISOString(),
  }) as ProgressRecord;
}

export async function getActivityData(
  studentId: string,
  days: number
): Promise<ActivityDataPoint[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const [challengeResult, nodeResult] = await Promise.all([
    supabase
      .from("coding_challenges")
      .select("created_at")
      .eq("student_id", studentId)
      .eq("status", "evaluated")
      .gte("created_at", sinceStr),
    supabase
      .from("node_completions")
      .select("completed_at")
      .eq("student_id", studentId)
      .eq("is_completed", true)
      .gte("completed_at", sinceStr),
  ]);

  // Build map of date -> aggregated data
  const dataMap: Record<string, ActivityDataPoint> = {};

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    dataMap[dateStr] = {
      date: dateStr,
      challenges_completed: 0,
      nodes_completed: 0,
    };
  }

  // Aggregate challenges
  for (const challenge of challengeResult.data ?? []) {
    const date = challenge.created_at.split("T")[0];
    if (dataMap[date]) {
      dataMap[date].challenges_completed += 1;
    }
  }

  // Aggregate node completions
  for (const completion of nodeResult.data ?? []) {
    if (!completion.completed_at) continue;
    const date = completion.completed_at.split("T")[0];
    if (dataMap[date]) {
      dataMap[date].nodes_completed += 1;
    }
  }

  return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
}

export async function updateProgressRecord(studentId: string): Promise<void> {
  const supabase = await createClient();

  const [roadmapsResult, nodesResult, testsResult, challengesResult] =
    await Promise.all([
      supabase
        .from("roadmaps")
        .select("completion_percentage")
        .eq("student_id", studentId)
        .eq("completion_percentage", 100),
      supabase
        .from("node_completions")
        .select("id", { count: "exact" })
        .eq("student_id", studentId)
        .eq("is_completed", true),
      supabase
        .from("milestone_test_attempts")
        .select("score")
        .eq("student_id", studentId),
      supabase
        .from("coding_challenges")
        .select("id", { count: "exact" })
        .eq("student_id", studentId)
        .eq("status", "evaluated"),
    ]);

  const roadmapsCompleted = roadmapsResult.data?.length ?? 0;
  const nodesCompleted = nodesResult.count ?? 0;
  const testAttempts = testsResult.data ?? [];
  const testsAvg =
    testAttempts.length > 0
      ? testAttempts.reduce((sum, t) => sum + t.score, 0) / testAttempts.length
      : 0;
  const challengesCompleted = challengesResult.count ?? 0;

  await supabase.from("progress_records").upsert({
    student_id: studentId,
    roadmaps_completed: roadmapsCompleted,
    nodes_completed: nodesCompleted,
    milestone_tests_taken: testAttempts.length,
    milestone_tests_avg_score: testsAvg,
    coding_challenges_completed: challengesCompleted,
    updated_at: new Date().toISOString(),
  });
}
