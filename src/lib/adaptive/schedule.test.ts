/**
 * Self-check for the spaced-repetition ladder.
 * Run: npx tsx src/lib/adaptive/schedule.test.ts
 */
import assert from "node:assert/strict";
import { addDays, isDue, nextReview } from "./schedule";

assert.equal(addDays("2026-01-31", 1), "2026-02-01");
assert.equal(addDays("2026-12-31", 30), "2027-01-30");

// Correct reviews climb 1 → 3 → 7 → 14 → 30 days, then stay at 30.
let stage = 0;
const gaps: number[] = [];
for (let i = 0; i < 6; i++) {
  const r = nextReview(stage, true, "2026-03-01");
  gaps.push((Date.parse(r.dueDate) - Date.parse("2026-03-01")) / 86_400_000);
  assert.equal(r.lapsed, false);
  stage = r.stage;
}
assert.deepEqual(gaps, [1, 3, 7, 14, 30, 30]);
assert.equal(stage, 4);

// A wrong answer resets to the bottom, due tomorrow.
assert.deepEqual(nextReview(4, false, "2026-03-01"), { stage: 0, dueDate: "2026-03-02", lapsed: true });

// Out-of-range stages are clamped.
assert.equal(nextReview(99, true, "2026-03-01").stage, 4);
assert.equal(nextReview(-3, true, "2026-03-01").stage, 1);

assert.equal(isDue("2026-03-01", "2026-03-01"), true);
assert.equal(isDue("2026-03-02", "2026-03-01"), false);

console.log("schedule: all checks passed");
