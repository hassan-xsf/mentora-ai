import type { BlueprintEdge, BlueprintGraph, BlueprintNode } from "./types";

/**
 * Layered DAG layout (Sugiyama, minus the expensive bits).
 *
 * 1. Lanes come from the model but are re-derived from the edges so a node can
 *    never sit left of something it depends on.
 * 2. Within a lane, nodes are ordered by the median position of their
 *    predecessors — one pass down, one back up. That is what stops the edges
 *    from crossing into spaghetti.
 *
 * ponytail: two sweeps, not iterate-to-convergence. Fine for the 10-14 node
 * graphs we generate; add more passes if graphs ever get much bigger.
 */

export const CARD_W = 208;
// Tall enough for the card's three stacked rows at their real line heights:
// title (2 lines clamped, ~15px each) + detail (2 lines, ~17px each) + the
// kind/effort badge row (~17px incl. its top padding), plus 12px padding top
// and bottom. The card itself is a flex column, so this is headroom rather
// than a value the content is balanced against by hand.
export const CARD_H = 126;
export const LANE_GAP = 108; // horizontal space between lane columns
export const ROW_GAP = 34; // vertical space between cards in a lane
export const PAD = 36;
/** Clear space between a card's border and the edge that touches it. */
export const EDGE_GAP = 7;

export type Placed = BlueprintNode & { x: number; y: number; row: number };

export type Layout = {
  nodes: Placed[];
  edges: (BlueprintEdge & { path: string; from_: Placed; to_: Placed })[];
  width: number;
  height: number;
  laneCount: number;
};

/** Longest-path layering: a node sits one lane right of its deepest dependency. */
function deriveLanes(nodes: BlueprintNode[], edges: BlueprintEdge[]): Map<string, number> {
  const preds = new Map<string, string[]>();
  for (const n of nodes) preds.set(n.key, []);
  for (const e of edges) preds.get(e.to)?.push(e.from);

  const lane = new Map<string, number>();
  const visiting = new Set<string>();

  function depth(key: string): number {
    const cached = lane.get(key);
    if (cached !== undefined) return cached;
    // Cycle guard: the model is told not to emit one, but a bad response
    // must not hang the render.
    if (visiting.has(key)) return 0;
    visiting.add(key);
    const parents = preds.get(key) ?? [];
    const d = parents.length === 0 ? 0 : Math.max(...parents.map((p) => depth(p) + 1));
    visiting.delete(key);
    lane.set(key, d);
    return d;
  }

  for (const n of nodes) depth(n.key);
  return lane;
}

function median(values: number[]): number {
  if (values.length === 0) return -1;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function layoutGraph(graph: BlueprintGraph): Layout {
  const { nodes, edges } = graph;
  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: PAD * 2, height: PAD * 2, laneCount: 0 };
  }

  const lane = deriveLanes(nodes, edges);
  const laneCount = Math.max(...nodes.map((n) => lane.get(n.key) ?? 0)) + 1;

  // Bucket nodes per lane, initial order = declaration order.
  const lanes: BlueprintNode[][] = Array.from({ length: laneCount }, () => []);
  for (const n of nodes) lanes[lane.get(n.key) ?? 0].push(n);

  const rowOf = new Map<string, number>();
  const reindex = () => lanes.forEach((l) => l.forEach((n, i) => rowOf.set(n.key, i)));
  reindex();

  const predsOf = new Map<string, string[]>();
  const succsOf = new Map<string, string[]>();
  for (const n of nodes) {
    predsOf.set(n.key, []);
    succsOf.set(n.key, []);
  }
  for (const e of edges) {
    predsOf.get(e.to)?.push(e.from);
    succsOf.get(e.from)?.push(e.to);
  }

  // Median heuristic: forward sweep orders each lane by its parents' rows,
  // backward sweep by its children's. Nodes with no neighbour keep their spot.
  const sweep = (relation: Map<string, string[]>, laneOrder: number[]) => {
    for (const li of laneOrder) {
      const keyed = lanes[li].map((n) => {
        const m = median((relation.get(n.key) ?? []).map((k) => rowOf.get(k) ?? 0));
        return { n, m: m === -1 ? (rowOf.get(n.key) ?? 0) : m };
      });
      keyed.sort((a, b) => a.m - b.m);
      lanes[li] = keyed.map((k) => k.n);
      reindex();
    }
  };

  sweep(predsOf, [...lanes.keys()].slice(1));
  sweep(succsOf, [...lanes.keys()].slice(0, -1).reverse());

  const tallest = Math.max(...lanes.map((l) => l.length));
  const height = PAD * 2 + tallest * CARD_H + (tallest - 1) * ROW_GAP;
  const width = PAD * 2 + laneCount * CARD_W + (laneCount - 1) * LANE_GAP;

  const placed: Placed[] = [];
  lanes.forEach((laneNodes, li) => {
    // Centre each lane vertically against the tallest one so the graph reads as
    // a balanced shape rather than everything jammed to the top.
    const laneH = laneNodes.length * CARD_H + (laneNodes.length - 1) * ROW_GAP;
    const top = PAD + (height - PAD * 2 - laneH) / 2;
    laneNodes.forEach((n, ri) => {
      placed.push({
        ...n,
        lane: li,
        row: ri,
        x: PAD + li * (CARD_W + LANE_GAP),
        y: top + ri * (CARD_H + ROW_GAP),
      });
    });
  });

  const byKey = new Map(placed.map((p) => [p.key, p]));

  const laidEdges = edges.flatMap((e) => {
    const from_ = byKey.get(e.from);
    const to_ = byKey.get(e.to);
    if (!from_ || !to_) return [];
    // Anchor on the card's right/left edge mid-height and bow horizontally, so
    // links leave and enter flat — the shape that reads as a flow diagram.
    // Leave a small gap either side so the line detaches from the border and
    // the arrowhead lands in clear space rather than on top of the card.
    const x1 = from_.x + CARD_W + EDGE_GAP;
    const y1 = from_.y + CARD_H / 2;
    const x2 = to_.x - EDGE_GAP;
    const y2 = to_.y + CARD_H / 2;
    const dx = Math.max(36, (x2 - x1) * 0.5);

    // A multi-lane edge would otherwise run straight through the cards between
    // its endpoints. Pick the smallest vertical bow that clears all of them.
    // ponytail: a few sampled candidate arcs, not true obstacle-avoiding
    // routing. Cheap, and good enough at ~10 nodes per graph.
    const blockers =
      to_.lane - from_.lane > 1
        ? placed.filter((p) => p.lane > from_.lane && p.lane < to_.lane)
        : [];

    /** Does the cubic with this bow stay clear of every blocking card? */
    const clears = (bow: number) => {
      for (let t = 0.04; t <= 0.96; t += 0.04) {
        const u = 1 - t;
        const bx =
          u * u * u * x1 + 3 * u * u * t * (x1 + dx) + 3 * u * t * t * (x2 - dx) + t * t * t * x2;
        const by =
          u * u * u * y1 +
          3 * u * u * t * (y1 + bow) +
          3 * u * t * t * (y2 + bow) +
          t * t * t * y2;
        for (const p of blockers) {
          if (
            bx > p.x - EDGE_GAP &&
            bx < p.x + CARD_W + EDGE_GAP &&
            by > p.y - EDGE_GAP &&
            by < p.y + CARD_H + EDGE_GAP
          ) {
            return false;
          }
        }
      }
      return true;
    };

    const step = CARD_H + ROW_GAP;
    let bow = 0;
    if (blockers.length > 0) {
      const candidates = [0, -step, step, -1.8 * step, 1.8 * step, -2.6 * step, 2.6 * step];
      // Falls back to the largest arc when nothing fully clears, which still
      // reads better than a line straight through a card.
      bow = candidates.find(clears) ?? candidates[candidates.length - 1];
    }

    const path = `M ${x1} ${y1} C ${x1 + dx} ${y1 + bow}, ${x2 - dx} ${y2 + bow}, ${x2} ${y2}`;
    return [{ ...e, path, from_, to_ }];
  });

  return { nodes: placed, edges: laidEdges, width, height, laneCount };
}
