"use client";

import { useState } from "react";
import type { ActivityDataPoint } from "@/types";
import { DailyBars } from "./DailyBars";

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
      <DailyBars
        data={displayData.map((d) => ({ date: d.date, value: d.challenges_completed + d.nodes_completed }))}
        format={(v) => `${v} ${v === 1 ? "activity" : "activities"}`}
        label={`Activity per ${view === "daily" ? "day" : "week"}`}
      />

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
