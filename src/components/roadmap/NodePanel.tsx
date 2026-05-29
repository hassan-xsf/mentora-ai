"use client";

import { useState, useTransition } from "react";
import { completeNodeTask } from "@/app/actions/complete-node-task";
import type { FullNode } from "@/lib/db/roadmaps";

function ResourceIcon({ type }: { type: string }) {
  if (type === "video") return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <polygon points="4,2 14,8 4,14" fill="currentColor" />
    </svg>
  );
  if (type === "article") return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="12" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 6h4M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  node: FullNode;
  onClose: () => void;
  roadmapId: string;
  onTaskToggle: (taskId: string, isCompleted: boolean, nodeIsCompleted: boolean) => void;
};

export function NodePanel({ node, onClose, roadmapId, onTaskToggle }: Props) {
  const [tasks, setTasks] = useState(node.tasks);
  const [, startTransition] = useTransition();

  function toggleTask(taskId: string, currentValue: boolean) {
    const newValue = !currentValue;
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, is_completed: newValue } : t
    );
    setTasks(updatedTasks);

    const allDone = updatedTasks.every((t) => t.is_completed);
    onTaskToggle(taskId, newValue, allDone);

    startTransition(async () => {
      await completeNodeTask(taskId, node.id, roadmapId, newValue);
    });
  }

  const doneTasks = tasks.filter((t) => t.is_completed).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white border-l border-[#d3cec6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f5f1ec] px-6 py-4">
          <h2 className="pr-4 text-[15px] font-medium text-[#111111] leading-snug">{node.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[#9c9fa5] hover:bg-[#f5f1ec] hover:text-[#111111] transition-colors"
            aria-label="Close panel"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          {node.description && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Overview</p>
              <p className="text-[13px] text-[#626260] leading-relaxed">{node.description}</p>
            </div>
          )}

          {/* Resources */}
          {node.resources.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Resources</p>
              <div className="space-y-2">
                {node.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-3.5 py-2.5"
                  >
                    <span className="shrink-0 text-[#9c9fa5]">
                      <ResourceIcon type={resource.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[13px] font-medium text-[#ff5600] hover:underline"
                        >
                          {resource.title}
                        </a>
                      ) : (
                        <p className="truncate text-[13px] font-medium text-[#111111]">{resource.title}</p>
                      )}
                      <span className="text-[11px] capitalize text-[#9c9fa5]">{resource.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
                Tasks — {doneTasks}/{tasks.length} done
              </p>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id, task.is_completed)}
                    className={`flex w-full items-center gap-3 rounded-[8px] border px-3.5 py-2.5 text-left transition-colors ${
                      task.is_completed
                        ? "border-[#0bdf50]/30 bg-[#0bdf50]/5"
                        : "border-[#d3cec6] bg-white hover:border-[#111111]"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        task.is_completed ? "border-[#0bdf50] bg-[#0bdf50]" : "border-[#d3cec6]"
                      }`}
                    >
                      {task.is_completed && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-[13px] ${task.is_completed ? "text-[#9c9fa5] line-through" : "text-[#111111]"}`}>
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
