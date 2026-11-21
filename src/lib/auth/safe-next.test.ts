/**
 * Self-check for the post-auth redirect guard.
 * Run: npx tsx src/lib/auth/safe-next.test.ts
 */
import assert from "node:assert/strict";
import { safeNextPath } from "./safe-next";

assert.equal(safeNextPath("/reset-password"), "/reset-password");
assert.equal(safeNextPath("/roadmap/abc?x=1"), "/roadmap/abc?x=1");
assert.equal(safeNextPath(null), "/dashboard");
assert.equal(safeNextPath(""), "/dashboard");
assert.equal(safeNextPath("//evil.com"), "/dashboard");
assert.equal(safeNextPath("/\\evil.com"), "/dashboard");
assert.equal(safeNextPath("https://evil.com"), "/dashboard");
assert.equal(safeNextPath("evil.com"), "/dashboard");
console.log("safe-next: ok");
