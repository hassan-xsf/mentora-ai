/**
 * Self-check for the dashboard's next-best-action.
 * Run: npx tsx "src/app/(dashboard)/dashboard/next-action.test.ts"
 */
import assert from "node:assert/strict";
import { pickNextAction } from "./next-action";

const rm = { id: "r1", title: "Frontend Developer", completion_percentage: 40 };
const node = (title: string, section_index: number, position: number, is_completed: boolean, parent_id: string | null = null) => ({
  id: title,
  parent_id,
  title,
  section_index,
  position,
  is_completed,
});

assert.equal(pickNextAction([], null).href, "/assessment");
assert.equal(pickNextAction([{ ...rm, completion_percentage: 100 }], null).href, "/practice");

// Earliest incomplete topic in an unlocked section.
{
  const a = pickNextAction([rm], {
    roadmap: rm,
    nodes: [node("CSS", 0, 1, false), node("HTML", 0, 0, true), node("JS", 0, 2, false)],
    unlocked: [0],
  });
  assert.equal(a.title, "Continue with CSS");
  assert.equal(a.href, "/roadmap/r1");
}

// A trunk comes before its children, children before the next trunk.
{
  const a = pickNextAction([rm], {
    roadmap: rm,
    nodes: [node("Hooks", 0, 0, false, "State"), node("State", 0, 1, false), node("Props", 0, 0, true), node("Keys", 0, 0, true, "Props")],
    unlocked: [0],
  });
  assert.equal(a.title, "Continue with State");
}

// Section 0 done, section 1 locked -> take the Foundations test.
{
  const a = pickNextAction([rm], {
    roadmap: rm,
    nodes: [node("HTML", 0, 0, true), node("React", 1, 0, false)],
    unlocked: [0],
  });
  assert.equal(a.title, "Take the Foundations milestone test");
}

// Everything done but not 100% -> final test.
{
  const a = pickNextAction([rm], { roadmap: rm, nodes: [node("HTML", 0, 0, true)], unlocked: [0] });
  assert.equal(a.title, "Take your final milestone test");
}

console.log("next-action: ok");
