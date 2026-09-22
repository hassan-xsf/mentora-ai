/**
 * Self-check for the blueprint DAG layout.
 * Run: npx tsx src/lib/blueprints/layout.test.ts
 */
import assert from "node:assert/strict";
import { layoutGraph, CARD_H, CARD_W } from "./layout";
import type { BlueprintGraph, BlueprintNode } from "./types";

const n = (key: string, lane = 0): BlueprintNode => ({
  key,
  label: key,
  detail: "",
  kind: "backend",
  lane,
  effort: "1h",
});

const graph = (nodes: BlueprintNode[], edges: { from: string; to: string }[]): BlueprintGraph => ({
  nodes,
  edges,
  phases: [],
  approaches: [],
  stretch: [],
  uniqueAngle: "",
});

// A dependency always lands strictly left of its dependant, even when the model
// hands us lane numbers that say otherwise — this is the invariant that keeps
// arrows pointing forwards.
{
  const g = graph(
    [n("a", 3), n("b", 0), n("c", 1)],
    [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ]
  );
  const { nodes } = layoutGraph(g);
  const at = (k: string) => nodes.find((p) => p.key === k)!;
  assert.equal(at("a").lane, 0);
  assert.equal(at("b").lane, 1);
  assert.equal(at("c").lane, 2);
  assert.ok(at("a").x < at("b").x && at("b").x < at("c").x);
}

// Cards in the same lane never overlap vertically.
{
  const g = graph([n("a"), n("b"), n("c"), n("d")], []);
  const { nodes, height } = layoutGraph(g);
  const ys = nodes.map((p) => p.y).sort((x, y) => x - y);
  for (let i = 1; i < ys.length; i++) {
    assert.ok(ys[i] - ys[i - 1] >= CARD_H, "lane cards overlap");
  }
  assert.ok(ys[ys.length - 1] + CARD_H <= height, "card escapes canvas height");
}

// Every node stays inside the reported canvas, so nothing renders clipped.
{
  const g = graph(
    [n("a"), n("b"), n("c"), n("d"), n("e")],
    [
      { from: "a", to: "c" },
      { from: "b", to: "c" },
      { from: "c", to: "d" },
      { from: "c", to: "e" },
    ]
  );
  const { nodes, width, height } = layoutGraph(g);
  for (const p of nodes) {
    assert.ok(p.x >= 0 && p.x + CARD_W <= width, `${p.key} outside width`);
    assert.ok(p.y >= 0 && p.y + CARD_H <= height, `${p.key} outside height`);
  }
}

// A cycle in a malformed AI response must still lay out instead of hanging.
{
  const g = graph(
    [n("a"), n("b")],
    [
      { from: "a", to: "b" },
      { from: "b", to: "a" },
    ]
  );
  const { nodes } = layoutGraph(g);
  assert.equal(nodes.length, 2);
}

// Edges whose endpoints do not exist are dropped rather than drawn dangling.
{
  const g = graph([n("a")], [{ from: "a", to: "ghost" }]);
  assert.equal(layoutGraph(g).edges.length, 0);
}

// Empty graph is a valid render, not a crash.
assert.equal(layoutGraph(graph([], [])).nodes.length, 0);

// ── Edge routing ────────────────────────────────────────────────────────────

/** Sample a "M x y C ..." cubic. */
function sampleCubic(d: string, t: number) {
  const v = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const [p0x, p0y, c1x, c1y, c2x, c2y, p3x, p3y] = v;
  const u = 1 - t;
  return {
    x: u * u * u * p0x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * p3x,
    y: u * u * u * p0y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * p3y,
  };
}

// On a realistically shaped graph (mostly adjacent-lane dependencies, which is
// what the generator prompt asks for) no edge may pass through a card it does
// not belong to — that was the reported "arrows behind the box" bug.
{
  const keys = [
    "scaffold", "schema", "ingest", "api", "auth",
    "uicore", "logic", "uidetail", "deploy", "polish",
  ];
  const deps: [string, string][] = [
    ["scaffold", "api"], ["schema", "api"], ["schema", "ingest"],
    ["api", "auth"], ["api", "uicore"], ["ingest", "logic"],
    ["auth", "uicore"], ["uicore", "uidetail"], ["uicore", "logic"],
    ["logic", "polish"], ["uidetail", "polish"], ["scaffold", "deploy"],
  ];
  const g = graph(
    keys.map((k) => n(k)),
    deps.map(([from, to]) => ({ from, to }))
  );
  const lay = layoutGraph(g);

  let crossings = 0;
  for (const e of lay.edges) {
    for (const card of lay.nodes) {
      if (card.key === e.from || card.key === e.to) continue;
      for (let t = 0; t <= 1; t += 0.02) {
        const { x, y } = sampleCubic(e.path, t);
        if (x > card.x && x < card.x + CARD_W && y > card.y && y < card.y + CARD_H) {
          crossings++;
          break;
        }
      }
    }
  }
  assert.equal(crossings, 0, `${crossings} edge(s) pass through a card`);
}

// Edges stop short of the cards, so an arrowhead never lands on a border.
{
  const g = graph([n("a"), n("b")], [{ from: "a", to: "b" }]);
  const { edges, nodes } = layoutGraph(g);
  const a = nodes.find((p) => p.key === "a")!;
  const b = nodes.find((p) => p.key === "b")!;
  const start = sampleCubic(edges[0].path, 0);
  const end = sampleCubic(edges[0].path, 1);
  assert.ok(start.x > a.x + CARD_W, "edge starts inside the source card");
  assert.ok(end.x < b.x, "edge ends inside the target card");
}

console.log("blueprint layout self-check passed");
