"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MilestoneTest } from "@/types";
import type { FullNode } from "@/lib/db/roadmaps";
import { NodePanel } from "@/components/roadmap/NodePanel";

type Props = {
  sections: [number, FullNode[]][];
  milestoneTests: MilestoneTest[];
  unlockedSections: number[];
  roadmapId: string;
  studentId: string;
};

/* ------------------------------------------------------------------ */
/*  State model                                                        */
/* ------------------------------------------------------------------ */

type NodeState = "completed" | "current" | "available" | "locked";

const STATE = {
  completed: {
    border: "border-[#0bdf50]/50",
    bg: "bg-gradient-to-br from-[#0bdf50]/12 to-[#0bdf50]/[0.03]",
    hover: "hover:border-[#0bdf50]/80 hover:shadow-[0_10px_30px_-10px_rgba(11,223,80,0.4)]",
    title: "text-[#0a7d30]",
    stroke: "#0bdf50",
    dotBg: "bg-[#0bdf50]",
    dotBorder: "border-[#0bdf50]",
  },
  current: {
    border: "border-[#ff5600]",
    bg: "bg-gradient-to-br from-[#ff5600]/12 to-[#ff5600]/[0.02]",
    hover: "hover:shadow-[0_14px_40px_-10px_rgba(255,86,0,0.55)]",
    title: "text-[#111111]",
    stroke: "#ff5600",
    dotBg: "bg-[#ff5600]",
    dotBorder: "border-[#ff5600]",
  },
  available: {
    border: "border-[#d3cec6]",
    bg: "bg-white",
    hover: "hover:border-[#111111] hover:shadow-[0_10px_30px_-12px_rgba(17,17,17,0.28)]",
    title: "text-[#111111]",
    stroke: "#c9c3ba",
    dotBg: "bg-white",
    dotBorder: "border-[#111111]",
  },
  locked: {
    border: "border-[#e2ddd5]",
    bg: "bg-[#faf8f4]",
    hover: "",
    title: "text-[#b3ada3]",
    stroke: "#e2ddd5",
    dotBg: "bg-[#eee9e1]",
    dotBorder: "border-[#d3cec6]",
  },
} as const satisfies Record<NodeState, unknown>;

const SECTION_LABELS = ["Foundations", "Intermediate", "Advanced"];

/* ------------------------------------------------------------------ */
/*  Tree grouping                                                      */
/* ------------------------------------------------------------------ */

type TreeNode = { node: FullNode; children: FullNode[] };

/** Split a flat section into trunk nodes (parent_id null) + their children. */
function buildTree(nodes: FullNode[]): TreeNode[] {
  const trunks = nodes
    .filter((n) => n.parent_id === null)
    .sort((a, b) => a.position - b.position);
  const childrenByParent = new Map<string, FullNode[]>();
  for (const n of nodes) {
    if (n.parent_id === null) continue;
    const arr = childrenByParent.get(n.parent_id) ?? [];
    arr.push(n);
    childrenByParent.set(n.parent_id, arr);
  }
  return trunks.map((node) => ({
    node,
    children: (childrenByParent.get(node.id) ?? []).sort((a, b) => a.position - b.position),
  }));
}

export default function RoadmapView({
  sections: initialSections,
  milestoneTests,
  unlockedSections,
  roadmapId,
}: Props) {
  const [sections, setSections] = useState(initialSections);
  const [selectedNode, setSelectedNode] = useState<FullNode | null>(null);

  function handleTaskToggle(taskId: string, isCompleted: boolean, nodeIsCompleted: boolean) {
    setSections((prev) =>
      prev.map(([sectionIndex, nodes]) => [
        sectionIndex,
        nodes.map((node) => {
          if (!node.tasks.some((t) => t.id === taskId)) return node;
          return {
            ...node,
            is_completed: nodeIsCompleted,
            tasks: node.tasks.map((t) =>
              t.id === taskId ? { ...t, is_completed: isCompleted } : t
            ),
          };
        }),
      ])
    );

    setSelectedNode((prev) => {
      if (!prev || !prev.tasks.some((t) => t.id === taskId)) return prev;
      return {
        ...prev,
        is_completed: nodeIsCompleted,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: isCompleted } : t
        ),
      };
    });
  }

  // Current node = first incomplete node (trunk or child, document order) in the
  // first unlocked section that still has work.
  const currentNodeId = useMemo(() => {
    for (const [sectionIndex, nodes] of sections) {
      if (!unlockedSections.includes(sectionIndex)) continue;
      const ordered = [...nodes].sort((a, b) => {
        // trunk before its own children, trunks by position
        const ap = a.parent_id === null ? a.position * 100 : a.position * 100 + 50;
        const bp = b.parent_id === null ? b.position * 100 : b.position * 100 + 50;
        return ap - bp;
      });
      const next = ordered.find((n) => !n.is_completed);
      if (next) return next.id;
    }
    return null;
  }, [sections, unlockedSections]);

  function stateOf(node: FullNode, isUnlocked: boolean): NodeState {
    if (!isUnlocked) return "locked";
    if (node.is_completed) return "completed";
    if (node.id === currentNodeId) return "current";
    return "available";
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[12px] border border-[#e2ddd5] bg-white/70 px-5 py-3 backdrop-blur">
        <LegendDot color="#0bdf50" label="Completed" />
        <LegendDot color="#ff5600" label="In progress" ring />
        <LegendDot color="#111111" label="Available" hollow />
        <LegendDot color="#c9c3ba" label="Locked" lock />
      </div>

      <div className="space-y-10">
        {sections.map(([sectionIndex, nodes], idx) => {
          const isUnlocked = unlockedSections.includes(sectionIndex);
          const test = milestoneTests.find((t) => t.section_index === sectionIndex);
          const completedNodes = nodes.filter((n) => n.is_completed).length;
          const allDone = completedNodes === nodes.length && nodes.length > 0;
          const label = SECTION_LABELS[idx] ?? `Section ${sectionIndex + 1}`;
          const tree = buildTree(nodes);

          return (
            <section key={sectionIndex}>
              {/* Section banner */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold shadow-sm ring-1 ${
                    allDone
                      ? "bg-[#0bdf50] text-white ring-[#0bdf50]/30"
                      : isUnlocked
                      ? "bg-[#111111] text-white ring-[#111111]/20"
                      : "bg-[#eee9e1] text-[#b3ada3] ring-[#d3cec6]"
                  }`}
                >
                  {!isUnlocked ? <LockIcon /> : allDone ? <CheckIcon /> : idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold tracking-[-0.2px] text-[#111111]">{label}</p>
                  <p className="text-[11px] text-[#9c9fa5]">
                    {completedNodes} of {nodes.length} completed
                  </p>
                </div>
                {!isUnlocked && (
                  <span className="rounded-full border border-[#d3cec6] bg-[#faf8f4] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#9c9fa5]">
                    Locked
                  </span>
                )}
                {allDone && (
                  <span className="rounded-full border border-[#0bdf50]/30 bg-[#0bdf50]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0a7d30]">
                    Done
                  </span>
                )}
              </div>

              {isUnlocked ? (
                <TreeCanvas
                  tree={tree}
                  stateOf={(n) => stateOf(n, true)}
                  onSelect={setSelectedNode}
                />
              ) : (
                <div className="rounded-[14px] border border-dashed border-[#d3cec6] bg-[#faf8f4] px-5 py-8 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#eee9e1] text-[#b3ada3]">
                    <LockIcon />
                  </div>
                  <p className="text-[12.5px] font-medium text-[#8a8d93]">
                    Pass the {idx > 0 ? SECTION_LABELS[idx - 1] : "previous"} milestone test to unlock this section.
                  </p>
                </div>
              )}

              {/* Milestone gate */}
              {test && isUnlocked && (
                <div className="mt-5 flex items-center justify-between gap-4 rounded-[14px] border p-4"
                  style={{
                    borderColor: allDone ? "rgba(255,86,0,0.4)" : "#d3cec6",
                    background: allDone
                      ? "linear-gradient(to right, rgba(255,86,0,0.06), transparent)"
                      : "#fff",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        allDone ? "bg-[#ff5600] text-white" : "bg-[#f0ece5] text-[#9c9fa5]"
                      }`}
                    >
                      <TestIcon />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#111111]">{test.title}</p>
                      <p className="text-[11px] text-[#9c9fa5]">
                        {allDone
                          ? "Ready — pass with ≥70% to unlock the next section"
                          : "Complete the topics above, then take this test"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/roadmap/${roadmapId}/test/${test.id}`}
                    className={`shrink-0 rounded-[8px] px-4 py-2 text-[13px] font-medium text-white transition-colors ${
                      allDone ? "bg-[#ff5600] hover:bg-[#e04e00]" : "bg-[#111111] hover:bg-black"
                    }`}
                  >
                    Take Test →
                  </Link>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {selectedNode && (
        <NodePanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          roadmapId={roadmapId}
          onTaskToggle={handleTaskToggle}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree canvas — central trunk + left/right branches with SVG curves  */
/* ------------------------------------------------------------------ */

const CARD_W = 232;
const TRUNK_GAP = 40; // gap between the center spine and a branch card
const TOP_PAD = 20; // padding above the first trunk node
const ROW_PAD = 48; // vertical breathing room added to each trunk row
const TRUNK_CARD_H = 96; // approx rendered height of a trunk card
const CHILD_CARD_H = 60; // approx rendered height of a branch card
const CHILD_STEP = 66; // vertical distance between stacked branch cards

function TreeCanvas({
  tree,
  stateOf,
  onSelect,
}: {
  tree: TreeNode[];
  stateOf: (n: FullNode) => NodeState;
  onSelect: (n: FullNode) => void;
}) {
  // Fixed numeric coordinate space. preserveAspectRatio="none" stretches this
  // viewBox to the container width, so CX always lands at the visual center and
  // ±px offsets stay pixel-accurate against the HTML card layer's calc().
  const VB_W = 760;
  const CX = VB_W / 2;

  // Pre-compute each trunk node's center-Y. Rows with more children need more
  // vertical room so the fanned-out cluster doesn't overlap the next trunk node.
  const rows = useMemo(() => {
    return tree.reduce<
      { t: TreeNode; cy: number; branchSide: "left" | "right"; bottom: number }[]
    >((acc, t, i) => {
      const childCount = t.children.length;
      // Height this row occupies: enough for the trunk card, and for its
      // children cluster (each child ~CHILD_STEP tall, centered on the trunk).
      const clusterH = childCount > 0 ? (childCount - 1) * CHILD_STEP + CHILD_CARD_H : 0;
      const rowH = Math.max(TRUNK_CARD_H, clusterH) + ROW_PAD;
      const prevBottom = acc.length > 0 ? acc[acc.length - 1].bottom : TOP_PAD;
      const cy = prevBottom + rowH / 2;
      // Children alternate sides per trunk row so the tree stays balanced.
      const branchSide: "left" | "right" = i % 2 === 0 ? "right" : "left";
      acc.push({ t, cy, branchSide, bottom: prevBottom + rowH });
      return acc;
    }, [] as { t: TreeNode; cy: number; branchSide: "left" | "right"; bottom: number }[]);
  }, [tree]);

  const height =
    rows.length > 0 ? rows[rows.length - 1].cy + TRUNK_CARD_H / 2 + TOP_PAD : TOP_PAD * 2;

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="relative mx-auto" style={{ minWidth: VB_W, height }}>
        {/* SVG connector layer */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VB_W} ${height}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Central trunk line */}
          <line x1={CX} y1={rows[0]?.cy ?? 0} x2={CX} y2={rows[rows.length - 1]?.cy ?? height} stroke="#d3cec6" strokeWidth="2.5" />

          {rows.map(({ t, cy, branchSide }) => {
            const st = stateOf(t.node);
            const dir = branchSide === "right" ? 1 : -1;
            const total = t.children.length;
            return (
              <g key={t.node.id}>
                {/* Branch connectors — curve from trunk out to each child */}
                {t.children.map((child, ci) => {
                  const cst = stateOf(child);
                  const targetY = cy + (ci - (total - 1) / 2) * CHILD_STEP;
                  const startX = CX + dir * 4;
                  const ctrlX = CX + dir * 34;
                  const endX = CX + dir * (TRUNK_GAP + 4);
                  return (
                    <path
                      key={child.id}
                      d={`M ${startX} ${cy} C ${ctrlX} ${cy}, ${ctrlX} ${targetY}, ${endX} ${targetY}`}
                      stroke={STATE[cst].stroke}
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={cst === "locked" ? "4 5" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
                {/* Station dot on the centered trunk */}
                <circle cx={CX} cy={cy} r="7" fill="#fff" stroke={STATE[st].stroke} strokeWidth="3" vectorEffect="non-scaling-stroke" />
                {st === "completed" && <circle cx={CX} cy={cy} r="3.2" fill={STATE[st].stroke} />}
              </g>
            );
          })}
        </svg>

        {/* Node cards layer — mirrors the SVG layer's geometry */}
        {rows.map(({ t, cy, branchSide }) => {
          const total = t.children.length;
          return (
            <div key={t.node.id}>
              {/* Trunk card — centered on the spine */}
              <div
                className="absolute left-1/2"
                style={{ top: cy, transform: "translate(-50%, -50%)", width: CARD_W }}
              >
                <NodeCard node={t.node} state={stateOf(t.node)} trunk onSelect={onSelect} />
              </div>

              {/* Branch cards — clustered on one side of the trunk */}
              {t.children.map((child, ci) => {
                const offsetY = (ci - (total - 1) / 2) * CHILD_STEP;
                return (
                  <div
                    key={child.id}
                    className="absolute"
                    style={{
                      top: cy + offsetY,
                      transform: "translateY(-50%)",
                      ...(branchSide === "left"
                        ? { right: `calc(50% + ${TRUNK_GAP + 6}px)` }
                        : { left: `calc(50% + ${TRUNK_GAP + 6}px)` }),
                      width: CARD_W - 28,
                    }}
                  >
                    <NodeCard node={child} state={stateOf(child)} onSelect={onSelect} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Node card                                                          */
/* ------------------------------------------------------------------ */

function NodeCard({
  node,
  state,
  trunk,
  onSelect,
}: {
  node: FullNode;
  state: NodeState;
  trunk?: boolean;
  onSelect: (n: FullNode) => void;
}) {
  const s = STATE[state];
  const tasksDone = node.tasks.filter((t) => t.is_completed).length;
  const tasksTotal = node.tasks.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className={`group w-full rounded-[13px] border text-left transition-all duration-200 ${s.border} ${s.bg} ${s.hover} ${
        trunk ? "p-3.5" : "p-3"
      } ${state === "current" ? "roadmap-pulse shadow-[0_10px_34px_-10px_rgba(255,86,0,0.5)]" : ""} ${
        state === "locked" ? "opacity-70" : ""
      }`}
    >
      {state === "current" && (
        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#ff5600] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          <span className="h-1 w-1 rounded-full bg-white" />
          You are here
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className={`${trunk ? "text-[13.5px]" : "text-[12px]"} font-semibold leading-tight ${s.title}`}>
          {node.title}
        </p>
        {state === "completed" && (
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0bdf50] text-white">
            <CheckIcon small />
          </span>
        )}
      </div>
      {trunk && node.description && (
        <p className={`mt-1 line-clamp-2 text-[11px] leading-relaxed ${state === "locked" ? "text-[#c9c3ba]" : "text-[#8a8d93]"}`}>
          {node.description}
        </p>
      )}
      {(tasksTotal > 0 || node.resources.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tasksTotal > 0 && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                tasksDone === tasksTotal ? "bg-[#0bdf50]/10 text-[#0a7d30]" : "bg-[#f0ece5] text-[#8a8d93]"
              }`}
            >
              <TaskRing done={tasksDone} total={tasksTotal} />
              {tasksDone}/{tasksTotal}
            </span>
          )}
          {node.resources.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0ece5] px-1.5 py-0.5 text-[10px] text-[#8a8d93]">
              <ResourceGlyph type={node.resources[0].type} />
              {node.resources.length}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Small SVG helpers                                                  */
/* ------------------------------------------------------------------ */

function LegendDot({
  color,
  label,
  ring,
  hollow,
  lock,
}: {
  color: string;
  label: string;
  ring?: boolean;
  hollow?: boolean;
  lock?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#626260]">
      <span
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2"
        style={{
          borderColor: color,
          background: hollow || lock ? "transparent" : color,
          boxShadow: ring ? `0 0 0 2.5px ${color}33` : undefined,
        }}
      />
      {label}
    </span>
  );
}

function TaskRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total;
  const r = 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r={r} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 7 7)"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

function ResourceGlyph({ type }: { type: string }) {
  if (type === "video")
    return (
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
        <polygon points="4,2 14,8 4,14" fill="currentColor" />
      </svg>
    );
  if (type === "article")
    return (
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="2" width="12" height="2" rx="1" fill="currentColor" />
        <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
        <rect x="2" y="12" width="8" height="2" rx="1" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function CheckIcon({ small }: { small?: boolean }) {
  return (
    <svg width={small ? 8 : 14} height={small ? 6 : 11} viewBox="0 0 8 6" fill="none" aria-hidden>
      <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1" y="5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 3h9l3 3v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M6.5 10.5l2 2 4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
