"use client";

import { useState } from "react";
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

function ResourceIcon({ type }: { type: string }) {
  if (type === "video") return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <polygon points="4,2 14,8 4,14" fill="currentColor" />
    </svg>
  );
  if (type === "article") return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="12" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  );
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 6h4M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
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

    // Keep the selected node in sync so the panel reflects the change too
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

  const SECTION_LABELS = ["Foundations", "Intermediate", "Advanced"];

  return (
    <div className="space-y-6">
      {sections.map(([sectionIndex, nodes], idx) => {
        const isUnlocked = unlockedSections.includes(sectionIndex);
        const test = milestoneTests.find((t) => t.section_index === sectionIndex);
        const completedNodes = nodes.filter((n) => n.is_completed).length;
        const label = SECTION_LABELS[idx] ?? `Section ${sectionIndex + 1}`;

        return (
          <div key={sectionIndex} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                isUnlocked ? "bg-[#111111] text-white" : "bg-[#d3cec6] text-[#9c9fa5]"
              }`}>
                {isUnlocked ? idx + 1 : (
                  <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
                    <rect x="1" y="5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">{label}</p>
                <p className="text-[11px] text-[#9c9fa5]">{completedNodes} of {nodes.length} completed</p>
              </div>
              {!isUnlocked && (
                <span className="ml-auto rounded-full border border-[#d3cec6] px-2.5 py-0.5 text-[10px] font-medium text-[#9c9fa5]">
                  Locked
                </span>
              )}
            </div>

            {/* Nodes grid */}
            {isUnlocked ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {nodes.map((node) => {
                  const tasksDone = node.tasks.filter((t) => t.is_completed).length;
                  const tasksTotal = node.tasks.length;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNode(node)}
                      className={`group rounded-[10px] border p-4 text-left transition-colors ${
                        node.is_completed
                          ? "border-[#0bdf50]/30 bg-[#0bdf50]/5 hover:border-[#0bdf50]/50"
                          : "border-[#d3cec6] bg-white hover:border-[#111111]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          node.is_completed
                            ? "border-[#0bdf50] bg-[#0bdf50]"
                            : "border-[#d3cec6] group-hover:border-[#111111]"
                        }`}>
                          {node.is_completed && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-[#111111] leading-tight">{node.title}</p>
                          <p className="mt-1 text-[11px] text-[#9c9fa5] line-clamp-2 leading-relaxed">
                            {node.description}
                          </p>
                          <div className="mt-2.5 flex items-center gap-3">
                            {node.resources.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-[#9c9fa5]">
                                {node.resources.slice(0, 3).map((r) => (
                                  <span key={r.id} className="flex items-center">
                                    <ResourceIcon type={r.type} />
                                  </span>
                                ))}
                                <span>{node.resources.length}</span>
                              </div>
                            )}
                            {tasksTotal > 0 && (
                              <span className="text-[11px] text-[#9c9fa5]">
                                {tasksDone}/{tasksTotal} tasks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[10px] border border-[#d3cec6] bg-[#f5f1ec] px-5 py-4 text-center">
                <p className="text-[13px] text-[#9c9fa5]">
                  Pass the {idx > 0 ? SECTION_LABELS[idx - 1] : "previous"} milestone test to unlock this section.
                </p>
              </div>
            )}

            {/* Milestone test CTA */}
            {test && isUnlocked && (
              <div className="flex items-center justify-between rounded-[10px] border border-[#d3cec6] bg-white px-5 py-3.5">
                <div>
                  <p className="text-[13px] font-medium text-[#111111]">{test.title}</p>
                  <p className="text-[11px] text-[#9c9fa5]">Pass with ≥70% to unlock the next section</p>
                </div>
                <Link
                  href={`/roadmap/${roadmapId}/test/${test.id}`}
                  className="shrink-0 rounded-[6px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
                >
                  Take Test →
                </Link>
              </div>
            )}
          </div>
        );
      })}

      {/* Node Panel */}
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
