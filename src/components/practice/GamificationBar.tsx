"use client";

import type { Badge } from "@/types";

const XP_MILESTONES = [100, 500, 1000, 2500, 5000];

function getNextMilestone(xp: number): number {
  return XP_MILESTONES.find((m) => m > xp) ?? XP_MILESTONES[XP_MILESTONES.length - 1];
}

function getPrevMilestone(xp: number): number {
  const idx = XP_MILESTONES.findIndex((m) => m > xp);
  return idx > 0 ? XP_MILESTONES[idx - 1] : 0;
}

type Props = {
  xpTotal: number;
  streakCount: number;
  badges: Badge[];
};

export function GamificationBar({ xpTotal, streakCount, badges }: Props) {
  const nextMilestone = getNextMilestone(xpTotal);
  const prevMilestone = getPrevMilestone(xpTotal);
  const progress = nextMilestone > prevMilestone
    ? ((xpTotal - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-6">
        {/* XP */}
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold text-gray-900">{xpTotal.toLocaleString()} XP</span>
            </div>
            <span className="text-xs text-gray-400">Next: {nextMilestone.toLocaleString()} XP</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-violet-500 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2">
          <span className="text-xl">🔥</span>
          <div>
            <p className="text-sm font-bold text-orange-600">{streakCount}</p>
            <p className="text-xs text-orange-400">day streak</p>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex shrink-0 items-center gap-1">
            {badges.slice(0, 5).map((badge) => (
              <span
                key={badge.id}
                title={badge.name}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-base"
              >
                {badge.icon}
              </span>
            ))}
            {badges.length > 5 && (
              <span className="text-xs text-gray-400">+{badges.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
