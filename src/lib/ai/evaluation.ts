// Pure aggregation for the admin AI evaluation dashboard and its CSV export.

export type EventRow = {
  feature: string;
  kind: "call" | "fallback";
  ok: boolean;
  latency_ms: number | null;
  prompt_chars: number | null;
  response_chars: number | null;
  created_at: string;
};
export type FeedbackRow = { feature: string; rating: number };
export type CreditRow = { reason: string; amount: number };

export type FeatureStats = {
  feature: string;
  calls: number;
  successRate: number | null; // 0–1 over calls
  fallbacks: number;
  fallbackRate: number | null; // fallbacks / calls (can exceed 1 if a feature falls back without calling)
  p50: number | null; // ms, successful calls only
  p95: number | null;
  avgPromptChars: number | null;
  avgResponseChars: number | null;
  feedbackCount: number;
  thumbsUpRate: number | null; // 0–1
  creditsSpent: number; // charges minus refunds
};

/** Nearest-rank percentile of an ascending-sorted list; null when empty. */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const ratio = (n: number, d: number) => (d ? n / d : null);

export function summarizeByFeature(
  events: EventRow[],
  feedback: FeedbackRow[],
  credits: CreditRow[]
): FeatureStats[] {
  const features = new Set<string>();
  events.forEach((e) => features.add(e.feature));
  feedback.forEach((f) => features.add(f.feature));

  return [...features].sort().map((feature) => {
    const calls = events.filter((e) => e.feature === feature && e.kind === "call");
    const okCalls = calls.filter((e) => e.ok);
    const fallbacks = events.filter((e) => e.feature === feature && e.kind === "fallback").length;
    const latencies = okCalls.map((e) => e.latency_ms).filter((n): n is number => n !== null).sort((a, b) => a - b);
    const fb = feedback.filter((f) => f.feature === feature);
    // Charges are stored negative and refunds ("refund:<feature>") positive, so net spend = -sum.
    const creditsSpent = credits.reduce(
      (sum, c) => (c.reason === feature || c.reason === `refund:${feature}` ? sum - c.amount : sum),
      0
    );

    return {
      feature,
      calls: calls.length,
      successRate: ratio(okCalls.length, calls.length),
      fallbacks,
      fallbackRate: ratio(fallbacks, calls.length),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      avgPromptChars: avg(calls.map((e) => e.prompt_chars).filter((n): n is number => n !== null)),
      avgResponseChars: avg(okCalls.map((e) => e.response_chars).filter((n): n is number => n !== null)),
      feedbackCount: fb.length,
      thumbsUpRate: ratio(fb.filter((f) => f.rating === 1).length, fb.length),
      creditsSpent,
    };
  });
}

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }); // YYYY-MM-DD

/** Calls per Asia/Karachi calendar day for the last `days` days (oldest first), zero-filled. */
export function dailyVolume(events: EventRow[], days: number, now = new Date()) {
  const buckets = new Map<string, { day: string; ok: number; failed: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayFmt.format(new Date(now.getTime() - i * 86_400_000));
    buckets.set(day, { day, ok: 0, failed: 0 });
  }
  for (const e of events) {
    if (e.kind !== "call") continue;
    const b = buckets.get(dayFmt.format(new Date(e.created_at)));
    if (b) b[e.ok ? "ok" : "failed"]++;
  }
  return [...buckets.values()];
}

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  // Quote when needed; prefix formula-looking text so spreadsheets don't execute it.
  const safe = /^[=+\-@]/.test(s) && typeof v === "string" ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const pct = (r: number | null) => (r === null ? null : Math.round(r * 1000) / 10);

export function statsToCsv(rows: FeatureStats[]): string {
  const header = [
    "feature", "calls", "success_pct", "fallbacks", "fallback_pct", "p50_ms", "p95_ms",
    "avg_prompt_chars", "avg_response_chars", "feedback_count", "thumbs_up_pct", "credits_spent",
  ];
  const lines = rows.map((r) =>
    [
      r.feature, r.calls, pct(r.successRate), r.fallbacks, pct(r.fallbackRate), r.p50, r.p95,
      r.avgPromptChars, r.avgResponseChars, r.feedbackCount, pct(r.thumbsUpRate), r.creditsSpent,
    ].map(csvCell).join(",")
  );
  return [header.join(","), ...lines].join("\n") + "\n";
}
