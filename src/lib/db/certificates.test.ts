/**
 * Self-check for certificate level bucketing, code format and issue gating.
 * Run: npx tsx src/lib/db/certificates.test.ts
 *
 * levelForSections decides what's printed on the certificate, so an off-by-one
 * here mislabels a real credential.
 */
import assert from "node:assert/strict";
import {
  levelForSections,
  generateCode,
  normalizeCode,
  isCertificateEarned,
} from "./certificates";

// A roadmap with no sections yet still has to render something.
assert.equal(levelForSections(0), "Beginner");
assert.equal(levelForSections(1), "Beginner");
assert.equal(levelForSections(2), "Beginner");
assert.equal(levelForSections(3), "Intermediate");
assert.equal(levelForSections(4), "Advanced");
assert.equal(levelForSections(9), "Advanced");

// Codes: right shape, no ambiguous characters, round-trip through normalizeCode.
const codes = new Set<string>();
for (let i = 0; i < 500; i++) {
  const c = generateCode();
  assert.match(c, /^MNT-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(normalizeCode(c), c);
  codes.add(c);
}
assert.ok(codes.size > 495, "codes should practically never repeat");

assert.equal(normalizeCode("  mnt-7f3k-9qb2 "), "MNT-7F3K-9QB2");
assert.equal(normalizeCode("MNT 7F3K 9QB2"), "MNT-7F3K-9QB2");
assert.equal(normalizeCode("7f3k9qb2"), "MNT-7F3K-9QB2");
assert.equal(normalizeCode("MNT-7F3K-9QB"), null); // too short
assert.equal(normalizeCode("mnt-demo-2x9k"), "MNT-DEMO-2X9K"); // legacy codes still verify
assert.equal(normalizeCode("' or 1=1 --"), null);
assert.equal(normalizeCode(""), null);

// Gating: all nodes AND all milestone tests.
const nodes = ["n1", "n2"];
const tests = ["t1", "t2"];
assert.equal(isCertificateEarned(nodes, new Set(nodes), tests, new Set(tests)), true);
assert.equal(isCertificateEarned(nodes, new Set(["n1"]), tests, new Set(tests)), false);
assert.equal(isCertificateEarned(nodes, new Set(nodes), tests, new Set(["t1"])), false);
assert.equal(isCertificateEarned(nodes, new Set(nodes), [], new Set()), true); // no tests generated
assert.equal(isCertificateEarned([], new Set(), [], new Set()), false); // empty roadmap

console.log("certificates: all assertions passed");
