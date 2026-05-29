"use client";

import { useState } from "react";
import type { ActivityDataPoint } from "@/types";

type Props = {
  activityData: ActivityDataPoint[];
};

type View = "daily" | "weekly";

function aggregateWeekly(data: ActivityDataPoint[]): ActivityDataPoint[] {
  const weeks: Record<string, ActivityDataPoint> = {};
  for (const point of data) {
    const date = new Date(point.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split("T")[0];
    if (!weeks[key]) {
      weeks[key] = { date: key, challenges_completed: 0, nodes_completed: 0 };
    }
    weeks[key].challenges_completed += point.challenges_completed;
    weeks[key].nodes_completed += point.nodes_completed;
  }
  return Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
}

export function ActivityChart({ activityData }: Props) {
  const [view, setView] = useState<View>("daily");

  const displayData = view === "weekly" ? aggregateWeekly(activityData) : activityData;

  const maxActivity = Math.max(
    ...displayData.map((d) => d.challenges_completed + d.nodes_completed),
    1
  );

  const chartH = 100;
  const barW = view === "daily" ? Math.max(8, Math.floor(560 / displayData.length) - 3) : 28;
  const gap = 3;
  const svgW = Math.max(560, displayData.length * (barW + gap));

  return (
    <div>
      {/* View toggle — pill style */}
      <div className="mb-5 inline-flex rounded-[9999px] border border-[#d3cec6] bg-[#f5f1ec] p-0.5">
        {(["daily", "weekly"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-[9999px] px-4 py-1.5 text-[12px] font-medium capitalize transition-colors ${
              view === v
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#626260] hover:text-[#111111]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* SVG chart */}
      <div className="overflow-x-auto">
        <svg
          width={svgW}
          height={chartH + 24}
          className="block"
          aria-label="Activity chart"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={svgW}
              y1={chartH - ratio * chartH}
              y2={chartH - ratio * chartH}
              stroke="#ebe7e1"
              strokeWidth={1}
            />
          ))}

          {/* Bars */}
          {displayData.map((point, i) => {
            const x = i * (barW + gap);
            const actTotal = point.challenges_completed + point.nodes_completed;
            const actH = Math.max(0, Math.round((actTotal / maxActivity) * chartH));
            const isEmpty = actH === 0;

            return (
              <g key={point.date}>
                {actH > 0 && (
                  <rect x={x} y={chartH - actH} width={barW} height={actH} fill="#111111" rx={2}>
                    <title>{point.date}: {actTotal} activities</title>
                  </rect>
                )}
                {isEmpty && (
                  <rect x={x} y={chartH - 2} width={barW} height={2} fill="#ebe7e1" rx={1} />
                )}
                {(view === "weekly" || i % 5 === 0) && (
                  <text
                    x={x + barW / 2}
                    y={chartH + 16}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#9c9fa5"
                    fontFamily="inherit"
                  >
                    {point.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-5 text-[12px] text-[#9c9fa5]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#111111]" />
          Challenges &amp; nodes completed
        </span>
      </div>
    </div>
  );
}
