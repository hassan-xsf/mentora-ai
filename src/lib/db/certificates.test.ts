/**
 * Self-check for certificate level bucketing.
 * Run: npx tsx src/lib/db/certificates.test.ts
 *
 * levelForSections decides what's printed on the certificate, so an off-by-one
 * here mislabels a real credential.
 */
import assert from "node:assert/strict";
import { levelForSections } from "./certificates";

// A roadmap with no sections yet still has to render something.
assert.equal(levelForSections(0), "Beginner");
assert.equal(levelForSections(1), "Beginner");
assert.equal(levelForSections(2), "Beginner");
assert.equal(levelForSections(3), "Intermediate");
assert.equal(levelForSections(4), "Advanced");
assert.equal(levelForSections(9), "Advanced");

console.log("certificates: all assertions passed");
