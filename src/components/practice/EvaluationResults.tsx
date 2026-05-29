"use client";

import { AILabel } from "@/components/ui/AILabel";
import type { EvaluationResult } from "@/types";

type Props = {
  result: EvaluationResult;
  xpEarned: number;
  newBadges?: string[];
};

export function EvaluationResults({ result, xpEarned, newBadges = [] }: Props) {
  return (
    <div className="p-4 space-y-3">
      {/* Pass/Fail */}
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
          result.passed
            ? "bg-green-900/40 text-green-300"
            : "bg-red-900/40 text-red-300"
        }`}
      >
        <span>{result.passed ? "✅" : "❌"}</span>
        <span>{result.passed ? "Tests Passed!" : "Not Passing Yet"}</span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-700 p-2.5">
          <p className="text-xs text-gray-400">Correctness</p>
          <p className="text-lg font-bold text-white">{result.correctness_score}%</p>
        </div>
        <div className="rounded-lg bg-gray-700 p-2.5">
          <p className="text-xs text-gray-400">Code Style</p>
          <p className="text-lg font-bold text-white">{result.style_score}%</p>
        </div>
      </div>

      {/* Feedback */}
      <div className="rounded-lg bg-gray-700 p-3">
        <div className="mb-1 flex items-center gap-1.5">
          <p className="text-xs font-medium text-gray-300">AI Feedback</p>
          <AILabel compact />
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{result.feedback}</p>
      </div>

      {/* XP Banner */}
      {xpEarned > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-violet-900/40 px-3 py-2">
          <span className="text-base">⚡</span>
          <p className="text-sm font-semibold text-violet-300">+{xpEarned} XP earned!</p>
        </div>
      )}

      {/* Badge notifications */}
      {newBadges.length > 0 && (
        <div className="space-y-1">
          {newBadges.map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 rounded-lg bg-yellow-900/30 px-3 py-2"
            >
              <span className="text-base">🏅</span>
              <p className="text-sm font-medium text-yellow-300">
                New badge: {badge}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
