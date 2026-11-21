import { createClient } from "@/lib/supabase/server";
import { dailySeries, pkDay, weekStart, type DayPoint } from "@/components/progress/series";
import { isStudyKind, type StudyKind } from "@/components/progress/study-kind";
import type { Difficulty, EvaluationResult } from "@/types";

export type ProgressStats = {
  study: {
    todayMinutes: number;
    weekMinutes: number;
    totalMinutes: number;
    daily: DayPoint[];
    weekByKind: Partial<Record<StudyKind, number>>;
  };
  xp: { daily: DayPoint[]; last30: number };
  roadmapsCompleted: number;
  nodesCompleted: number;
  tests: { attempts: number; passed: number; avgScore: number | null };
  coding: {
    solved: number;
    passed: number;
    byDifficulty: Record<Difficulty, number>;
    avgCorrectness: number | null;
  };
};

const STUDY_DAYS = 14;
const XP_DAYS = 30;

/** Live progress numbers, read with the user's own session (RLS: own rows). */
export async function getProgressStats(studentId: string): Promise<ProgressStats> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 31 * 86_400_000).toISOString();

  const [study, xp, roadmaps, nodes, attempts, challenges] = await Promise.all([
    // One row per day and kind, so this is small.
    // shortcut: totals cap at the latest 1000 rows (~200+ study days); sum in SQL if that's ever reached.
    supabase
      .from("study_time_events")
      .select("minutes, kind, day")
      .eq("student_id", studentId)
      .not("day", "is", null)
      .order("day", { ascending: false })
      .limit(1000),
    supabase.from("xp_events").select("amount, created_at").eq("student_id", studentId).gte("created_at", since),
    supabase
      .from("roadmaps")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("completion_percentage", 100),
    supabase
      .from("node_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_completed", true),
    supabase.from("milestone_test_attempts").select("test_id, score, passed").eq("student_id", studentId),
    supabase
      .from("coding_challenges")
      .select("difficulty, evaluation_result")
      .eq("student_id", studentId)
      .eq("status", "evaluated"),
  ]);

  const studyRows = study.data ?? [];
  const today = pkDay(new Date());
  const monday = weekStart(today);
  let todayMinutes = 0;
  let weekMinutes = 0;
  const weekByKind: Partial<Record<StudyKind, number>> = {};
  let totalMinutes = 0;
  for (const r of studyRows) {
    const day = r.day as string;
    totalMinutes += r.minutes;
    if (day === today) todayMinutes += r.minutes;
    if (day >= monday) {
      weekMinutes += r.minutes;
      if (isStudyKind(r.kind)) weekByKind[r.kind] = (weekByKind[r.kind] ?? 0) + r.minutes;
    }
  }

  const xpDaily = dailySeries(
    (xp.data ?? []).map((e) => ({ at: e.created_at, value: e.amount })),
    XP_DAYS
  );

  const testRows = attempts.data ?? [];
  const challengeRows = challenges.data ?? [];
  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  let codingPassed = 0;
  let correctnessSum = 0;
  let correctnessN = 0;
  for (const c of challengeRows) {
    byDifficulty[c.difficulty as Difficulty] += 1;
    const result = c.evaluation_result as EvaluationResult | null;
    if (result?.passed) codingPassed += 1;
    if (typeof result?.correctness_score === "number") {
      correctnessSum += result.correctness_score;
      correctnessN += 1;
    }
  }

  return {
    study: {
      todayMinutes,
      weekMinutes,
      totalMinutes,
      daily: dailySeries(
        studyRows.map((r) => ({ at: `${r.day}T12:00:00+05:00`, value: r.minutes })),
        STUDY_DAYS
      ),
      weekByKind,
    },
    xp: { daily: xpDaily, last30: xpDaily.reduce((a, d) => a + d.value, 0) },
    roadmapsCompleted: roadmaps.count ?? 0,
    nodesCompleted: nodes.count ?? 0,
    tests: {
      attempts: testRows.length,
      // A test retaken until passed counts once.
      passed: new Set(testRows.filter((t) => t.passed).map((t) => t.test_id)).size,
      avgScore: testRows.length
        ? Math.round(testRows.reduce((a, t) => a + t.score, 0) / testRows.length)
        : null,
    },
    coding: {
      solved: challengeRows.length,
      passed: codingPassed,
      byDifficulty,
      avgCorrectness: correctnessN ? Math.round(correctnessSum / correctnessN) : null,
    },
  };
}
