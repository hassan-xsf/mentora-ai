/**
 * Self-check for credits config invariants.
 * Run: npx tsx src/lib/credits/config.test.ts  (or node --experimental-strip-types)
 */
import assert from "node:assert/strict";
import {
  CREDIT_COSTS,
  CREDIT_ACTION_LABELS,
  CREDIT_PACKS,
  SIGNUP_BONUS_CREDITS,
  getPack,
  packTotal,
  formatPrice,
} from "./config";

// Every cost has a label, and vice versa — a missing label renders as a raw key in the UI.
assert.deepEqual(
  Object.keys(CREDIT_COSTS).sort(),
  Object.keys(CREDIT_ACTION_LABELS).sort()
);

// Costs must be positive ints, else spend_credits would grant credits.
for (const [action, cost] of Object.entries(CREDIT_COSTS)) {
  assert.ok(Number.isInteger(cost) && cost > 0, `${action} cost must be a positive integer`);
}

// The free grant must cover at least one of every action, or a new user is stuck.
for (const [action, cost] of Object.entries(CREDIT_COSTS)) {
  assert.ok(SIGNUP_BONUS_CREDITS >= cost, `signup bonus cannot afford ${action}`);
}

// Pack ids unique and resolvable.
const ids = CREDIT_PACKS.map((p) => p.id);
assert.equal(new Set(ids).size, ids.length, "pack ids must be unique");
for (const id of ids) assert.ok(getPack(id), `getPack failed for ${id}`);
assert.equal(getPack("nope"), undefined);

// Bigger packs must never cost more per credit — otherwise the "bonus" is a lie.
const byPrice = [...CREDIT_PACKS].sort((a, b) => a.priceCents - b.priceCents);
for (let i = 1; i < byPrice.length; i++) {
  const prev = byPrice[i - 1].priceCents / packTotal(byPrice[i - 1]);
  const cur = byPrice[i].priceCents / packTotal(byPrice[i]);
  assert.ok(cur <= prev, `${byPrice[i].id} has worse value than ${byPrice[i - 1].id}`);
}

// At most one pack flagged popular.
assert.ok(CREDIT_PACKS.filter((p) => p.popular).length <= 1);

assert.equal(formatPrice(500), "$5.00");
assert.equal(formatPrice(2000), "$20.00");
assert.equal(packTotal({ id: "x", name: "x", credits: 100, priceCents: 1, bonus: 20 }), 120);

console.log("credits config: all checks passed");
