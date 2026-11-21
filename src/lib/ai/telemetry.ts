import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AIEvent = {
  feature: string;
  kind: "call" | "fallback";
  ok: boolean;
  latencyMs: number | null;
  promptChars: number | null;
  responseChars: number | null;
  error: string | null;
  studentId: string | null;
};

// When the table is missing (migration 010 not applied yet) stop trying for a
// while instead of paying a failed round-trip on every AI call.
let pausedUntil = 0;
const PAUSE_MS = 10 * 60_000;

async function insertEvent(e: AIEvent): Promise<void> {
  if (Date.now() < pausedUntil) return;
  try {
    const { error } = await createAdminClient().from("ai_events").insert({
      feature: e.feature.slice(0, 64),
      kind: e.kind,
      ok: e.ok,
      latency_ms: e.latencyMs,
      prompt_chars: e.promptChars,
      response_chars: e.responseChars,
      error: e.error?.slice(0, 500) ?? null,
      student_id: e.studentId,
    });
    if (error) {
      // 42P01 = undefined_table (Postgres), PGRST205 = table not in PostgREST schema cache
      if (error.code === "42P01" || error.code === "PGRST205") pausedUntil = Date.now() + PAUSE_MS;
      else console.warn("[ai-telemetry] insert failed:", error.message);
    }
  } catch (err) {
    console.warn("[ai-telemetry] insert failed:", err instanceof Error ? err.message : err);
  }
}

/**
 * Fire-and-forget: never throws, never delays the caller. Inside a request it
 * uses next/server `after()` so serverless platforms keep the insert alive
 * past the response; outside one (scripts) it just floats the promise.
 */
export function logAICall(e: AIEvent): void {
  try {
    after(() => insertEvent(e));
  } catch {
    void insertEvent(e);
  }
}

/** Record that a feature served canned/fallback content instead of AI output. Never throws. */
export async function reportFallback(feature: string, reason: string): Promise<void> {
  logAICall({
    feature,
    kind: "fallback",
    ok: false,
    latencyMs: null,
    promptChars: null,
    responseChars: null,
    error: reason,
    studentId: null,
  });
}
