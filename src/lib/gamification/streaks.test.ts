/**
 * Self-check for streak day logic (Asia/Karachi = UTC+5, no DST).
 * Run: npx tsx src/lib/gamification/streaks.test.ts
 */
import assert from "node:assert/strict";
import { karachiDay, nextStreak } from "./streaks";

// 00:00–05:00 PKT is still the previous day in UTC — must count as the PKT day.
assert.equal(karachiDay(new Date("2026-03-01T19:00:00Z")), "2026-03-02"); // 00:00 PKT
assert.equal(karachiDay(new Date("2026-03-01T23:59:00Z")), "2026-03-02"); // 04:59 PKT
assert.equal(karachiDay(new Date("2026-03-01T18:59:59Z")), "2026-03-01"); // 23:59 PKT
assert.equal(karachiDay(new Date("2026-12-31T19:30:00Z")), "2027-01-01"); // year rollover

assert.equal(nextStreak(null, 0, "2026-03-02"), 1);
assert.equal(nextStreak("2026-03-02", 4, "2026-03-02"), null); // same day: no-op
assert.equal(nextStreak("2026-03-01", 4, "2026-03-02"), 5); // consecutive
assert.equal(nextStreak("2026-02-28", 4, "2026-03-01"), 5); // month boundary
assert.equal(nextStreak("2028-02-28", 4, "2028-03-01"), 1); // leap year: 29th was skipped
assert.equal(nextStreak("2026-02-27", 4, "2026-03-02"), 1); // gap resets

// Study at 23:30 PKT then at 01:00 PKT the next night = consecutive days,
// even though both instants fall on the same UTC date.
const late = karachiDay(new Date("2026-03-01T18:30:00Z"));
const early = karachiDay(new Date("2026-03-01T20:00:00Z"));
assert.equal(nextStreak(late, 1, early), 2);

console.log("streaks: all assertions passed");
