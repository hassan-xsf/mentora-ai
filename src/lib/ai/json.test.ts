/**
 * Self-check for truncated-JSON recovery.
 * Run: npx tsx src/lib/ai/json.test.ts
 */
import assert from "node:assert/strict";
import { extractJSON, repairTruncatedJSON, parseJSONLoose } from "./json";

// Fences and prose are stripped.
assert.equal(extractJSON('```json\n{"a":1}\n```'), '{"a":1}');
assert.equal(extractJSON('Sure! {"a":1} hope that helps'), '{"a":1}');

// Valid JSON passes through untouched.
assert.equal(repairTruncatedJSON('{"a":[1,2]}'), '{"a":[1,2]}');

// Cut mid-string inside a nested array element: drop the partial element,
// close the array and the object. This is the real failure mode.
{
  const broken = '{"nodes":[{"key":"a","label":"A"},{"key":"b","lab';
  const fixed = repairTruncatedJSON(broken)!;
  const parsed = JSON.parse(fixed) as { nodes: { key: string }[] };
  assert.equal(parsed.nodes.length, 1);
  assert.equal(parsed.nodes[0].key, "a");
}

// Cut immediately after a complete element, before the comma.
{
  const fixed = repairTruncatedJSON('{"a":[{"x":1},{"y":2}')!;
  const parsed = JSON.parse(fixed) as { a: object[] };
  assert.equal(parsed.a.length, 2);
}

// A comma inside a half-written object is NOT a safe cut point: reconstructing
// {"key":"b"} there would invent an element whose other fields were lost.
{
  const fixed = repairTruncatedJSON('{"nodes":[{"key":"a","label":"A"},{"key":"b","lab')!;
  const parsed = JSON.parse(fixed) as { nodes: { key: string; label: string }[] };
  assert.equal(parsed.nodes.length, 1);
  assert.equal(parsed.nodes[0].label, "A");
}

// Deep nesting closes in the right order.
{
  const fixed = repairTruncatedJSON('{"g":{"n":[{"p":{"q":[1,2]},"r":"s"},{"bad')!;
  const parsed = JSON.parse(fixed) as { g: { n: { r: string }[] } };
  assert.equal(parsed.g.n.length, 1);
  assert.equal(parsed.g.n[0].r, "s");
}

// An escaped quote inside a string must not be read as the string's end.
{
  const fixed = repairTruncatedJSON('{"a":[{"t":"say \\"hi\\" now"},{"t":"cut')!;
  const parsed = JSON.parse(fixed) as { a: { t: string }[] };
  assert.equal(parsed.a[0].t, 'say "hi" now');
}

// A brace inside a string is not structure.
{
  const fixed = repairTruncatedJSON('{"a":[{"t":"a { brace ] here"},{"t":"cu')!;
  const parsed = JSON.parse(fixed) as { a: { t: string }[] };
  assert.equal(parsed.a.length, 1);
  assert.equal(parsed.a[0].t, "a { brace ] here");
}

// Nothing complete yet → null rather than a bogus document.
assert.equal(repairTruncatedJSON('{"nodes":[{"key":"par'), null);

// parseJSONLoose: clean input, and recovery through the fence stripper.
assert.deepEqual(parseJSONLoose('{"a":1}'), { a: 1 });
{
  const r = parseJSONLoose<{ n: number[] }>('```json\n{"n":[1,2,3],"m":[4,');
  assert.deepEqual(r.n, [1, 2, 3]);
}

// Genuinely unparseable input still throws.
assert.throws(() => parseJSONLoose("not json at all"));

console.log("ai json self-check passed");
