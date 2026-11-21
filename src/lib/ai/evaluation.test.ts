/**
 * Self-check for AI evaluation aggregation + retry classification.
 * Run: npx tsx src/lib/ai/evaluation.test.ts
 */
import assert from "node:assert/strict";
import { percentile, summarizeByFeature, dailyVolume, statsToCsv, type EventRow } from "./evaluation";
import { isRetryable, AIHttpError, AITimeoutError } from "./client";

// Nearest-rank percentile.
assert.equal(percentile([], 50), null);
assert.equal(percentile([7], 95), 7);
assert.equal(percentile([1, 2, 3, 4], 50), 2);
assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95), 10);
assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90), 9);
assert.equal(percentile([10, 20, 30], 0), 10);

// Retry: timeouts, network errors and 5xx yes; 4xx and parse errors no.
assert.equal(isRetryable(new AITimeoutError(1000)), true);
assert.equal(isRetryable(new TypeError("fetch failed")), true);
assert.equal(isRetryable(new AIHttpError(502, "bad gateway")), true);
assert.equal(isRetryable(new AIHttpError(500, "x")), true);
assert.equal(isRetryable(new AIHttpError(429, "rate")), false);
assert.equal(isRetryable(new AIHttpError(401, "auth")), false);
assert.equal(isRetryable(new SyntaxError("Unexpected token")), false);
assert.equal(isRetryable("weird"), false);

const ev = (o: Partial<EventRow>): EventRow => ({
  feature: "chat_message", kind: "call", ok: true, latency_ms: 100, prompt_chars: 50,
  response_chars: 200, created_at: "2026-11-20T10:00:00Z", ...o,
});

{
  const events = [
    ev({ latency_ms: 100 }),
    ev({ latency_ms: 300 }),
    ev({ ok: false, latency_ms: 9000, response_chars: 0 }), // failed: excluded from latency + response size
    ev({ kind: "fallback", ok: false, latency_ms: null, prompt_chars: null }),
    ev({ feature: "generate_roadmap", latency_ms: 5000 }),
  ];
  const feedback = [
    { feature: "chat_message", rating: 1 },
    { feature: "chat_message", rating: -1 },
    { feature: "chat_message", rating: 1 },
    { feature: "grade_answer", rating: -1 }, // feedback-only feature still listed
  ];
  const credits = [
    { reason: "chat_message", amount: -5 },
    { reason: "chat_message", amount: -5 },
    { reason: "chat_message", amount: -5 },
    { reason: "refund:chat_message", amount: 5 },
    { reason: "signup_bonus", amount: 1000 },
  ];
  const rows = summarizeByFeature(events, feedback, credits);
  assert.deepEqual(rows.map((r) => r.feature), ["chat_message", "generate_roadmap", "grade_answer"]);
  const chat = rows[0];
  assert.equal(chat.calls, 3);
  assert.equal(chat.successRate, 2 / 3);
  assert.equal(chat.fallbacks, 1);
  assert.equal(chat.fallbackRate, 1 / 3);
  assert.equal(chat.p50, 100);
  assert.equal(chat.p95, 300);
  assert.equal(chat.avgPromptChars, 50);
  assert.equal(chat.avgResponseChars, 200);
  assert.equal(chat.feedbackCount, 3);
  assert.equal(chat.thumbsUpRate, 2 / 3);
  assert.equal(chat.creditsSpent, 10);
  const grade = rows[2];
  assert.equal(grade.calls, 0);
  assert.equal(grade.successRate, null);
  assert.equal(grade.p50, null);
  assert.equal(grade.thumbsUpRate, 0);

  const csv = statsToCsv(rows).trim().split("\n");
  assert.equal(csv.length, 4);
  assert.ok(csv[0].startsWith("feature,calls,success_pct"));
  assert.ok(csv[1].startsWith("chat_message,3,66.7,1,33.3,100,300,50,200,3,66.7,10"));
  assert.ok(csv[3].startsWith("grade_answer,0,,0,,,,,,1,0,0"));
}

// CSV escaping: quotes, commas and formula prefixes.
{
  const [, line] = statsToCsv([
    { ...summarizeByFeature([ev({})], [], [])[0], feature: '=cmd,"x"' },
  ]).split("\n");
  assert.ok(line.startsWith(`"'=cmd,""x"""`));
}

// Daily volume: Asia/Karachi day boundaries (UTC+5), zero-filled, oldest first.
{
  const now = new Date("2026-11-21T12:00:00Z");
  const days = dailyVolume(
    [
      ev({ created_at: "2026-11-20T20:00:00Z" }), // 01:00 on the 21st in Karachi
      ev({ created_at: "2026-11-20T18:00:00Z", ok: false }), // 23:00 on the 20th
      ev({ created_at: "2026-11-20T18:00:00Z", kind: "fallback" }), // not a call
      ev({ created_at: "2026-10-01T00:00:00Z" }), // outside the window
    ],
    3,
    now
  );
  assert.deepEqual(days, [
    { day: "2026-11-19", ok: 0, failed: 0 },
    { day: "2026-11-20", ok: 0, failed: 1 },
    { day: "2026-11-21", ok: 1, failed: 0 },
  ]);
}

// aiQuery retry loop with a stubbed fetch: one retry on 503, none on 401.
void (async () => {
  process.env.AI_API_URL = "https://ai.invalid/ai";
  process.env.AI_SECRET_TOKEN = "t";
  const { aiQuery } = await import("./client");
  const realFetch = globalThis.fetch;
  let calls = 0;
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  try {
    globalThis.fetch = (async () => (++calls === 1 ? reply(503, "down") : reply(200, { response: "hi" }))) as typeof fetch;
    assert.equal(await aiQuery("q", { feature: "test" }), "hi");
    assert.equal(calls, 2);

    calls = 0;
    globalThis.fetch = (async () => (++calls, reply(401, "no"))) as typeof fetch;
    await assert.rejects(aiQuery("q"), (e: unknown) => e instanceof AIHttpError && e.status === 401);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = realFetch;
  }
  console.log("ai evaluation self-check passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
