import { createAdminClient } from "@/lib/supabase/admin";
import {
  summarizeByFeature,
  dailyVolume,
  type CreditRow,
  type EventRow,
  type FeedbackRow,
} from "@/lib/ai/evaluation";

export const WINDOW_DAYS = 30;
export const CHART_DAYS = 14;
// shortcut: aggregates in JS over at most MAX_ROWS rows of the window; move to a SQL view/RPC if traffic outgrows it.
const MAX_ROWS = 20_000;
const PAGE = 1000; // PostgREST max rows per request

type Admin = ReturnType<typeof createAdminClient>;

/** Pages through a query; returns [] (not an error) when the table doesn't exist yet. */
async function fetchAll<T>(
  run: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<{ rows: T[]; missing: boolean }> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await run(from, from + PAGE - 1);
    if (error) return { rows, missing: rows.length === 0 };
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows, missing: false };
}

async function count(admin: Admin, table: "students" | "roadmaps" | "certificates" | "coding_challenges" | "milestone_test_attempts", filter?: [string, unknown]) {
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1] as never);
  const { count: n, error } = await q;
  return error ? null : n;
}

export async function loadEvaluation() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  const [events, feedback, credits, failures, negative, totals] = await Promise.all([
    fetchAll<EventRow>((a, b) =>
      admin
        .from("ai_events")
        .select("feature, kind, ok, latency_ms, prompt_chars, response_chars, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(a, b)
    ),
    fetchAll<FeedbackRow>((a, b) =>
      admin.from("ai_feedback").select("feature, rating").gte("created_at", since).range(a, b)
    ),
    fetchAll<CreditRow>((a, b) =>
      admin
        .from("credit_transactions")
        .select("reason, amount")
        .gte("created_at", since)
        .range(a, b)
    ),
    admin
      .from("ai_events")
      .select("id, feature, kind, error, latency_ms, created_at")
      .eq("ok", false)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("ai_feedback")
      .select("id, feature, target_id, comment, created_at")
      .eq("rating", -1)
      .order("created_at", { ascending: false })
      .limit(15),
    Promise.all([
      count(admin, "students"),
      count(admin, "roadmaps"),
      count(admin, "coding_challenges", ["status", "evaluated"]),
      count(admin, "milestone_test_attempts", ["passed", true]),
      count(admin, "certificates"),
    ]),
  ]);

  return {
    tablesMissing: events.missing || feedback.missing,
    truncated: events.rows.length >= MAX_ROWS,
    eventCount: events.rows.length,
    features: summarizeByFeature(events.rows, feedback.rows, credits.rows),
    daily: dailyVolume(events.rows, CHART_DAYS),
    failures: failures.data ?? [],
    negative: negative.data ?? [],
    totals: {
      students: totals[0],
      roadmaps: totals[1],
      challengesEvaluated: totals[2],
      testsPassed: totals[3],
      certificates: totals[4],
    },
  };
}
