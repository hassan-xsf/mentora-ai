/**
 * Self-check for Pakistan-day bucketing used by the progress page.
 * Run: npx tsx src/components/progress/series.test.ts
 */
import assert from "node:assert/strict";
import { dailySeries, formatMinutes, pkDay, weekStart } from "./series";

// 20:00 UTC is already the next day in Karachi (UTC+5).
assert.equal(pkDay("2026-11-20T18:59:00Z"), "2026-11-20");
assert.equal(pkDay("2026-11-20T19:00:00Z"), "2026-11-21");

const now = new Date("2026-11-21T10:00:00Z");
const s = dailySeries(
  [
    { at: "2026-11-21T01:00:00Z", value: 2 },
    { at: "2026-11-20T20:00:00Z", value: 3 }, // Nov 21 in Karachi
    { at: "2026-11-20T10:00:00Z", value: 1 },
    { at: "2026-11-01T10:00:00Z", value: 99 }, // outside the window
  ],
  7,
  now
);
assert.equal(s.length, 7);
assert.equal(s[0].date, "2026-11-15");
assert.equal(s[6].date, "2026-11-21");
assert.equal(s[6].value, 5);
assert.equal(s[5].value, 1);
assert.equal(s.reduce((a, p) => a + p.value, 0), 6);

// Month boundary
assert.equal(dailySeries([], 3, new Date("2026-03-01T12:00:00Z"))[0].date, "2026-02-27");

assert.equal(weekStart("2026-11-21"), "2026-11-16"); // Saturday -> Monday
assert.equal(weekStart("2026-11-16"), "2026-11-16"); // Monday
assert.equal(weekStart("2026-11-22"), "2026-11-16"); // Sunday

assert.equal(formatMinutes(0), "0m");
assert.equal(formatMinutes(59), "59m");
assert.equal(formatMinutes(60), "1h");
assert.equal(formatMinutes(135), "2h 15m");

console.log("series: all checks passed");
