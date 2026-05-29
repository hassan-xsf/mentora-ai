"use client";

import Link from "next/link";
import type { MilestoneQuestion } from "@/types";

type Props = {
  score: number;
  passed: boolean;
  questions: MilestoneQuestion[];
  answers: Record<string, string>;
  roadmapId: string;
  testId: string;
};

export function TestResults({ score, passed, questions, answers, roadmapId, testId }: Props) {
  return (
    <div className="space-y-6">
      {/* Score Banner */}
      <div
        className={`rounded-2xl p-6 text-center ${
          passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}
      >
        <div className={`text-4xl font-bold mb-2 ${passed ? "text-green-600" : "text-red-600"}`}>
          {score}%
        </div>
        <div
          className={`text-lg font-semibold mb-1 ${passed ? "text-green-700" : "text-red-700"}`}
        >
          {passed ? "Passed!" : "Not quite"}
        </div>
        <p className={`text-sm ${passed ? "text-green-600" : "text-red-500"}`}>
          {passed
            ? "You've unlocked the next section. Keep going!"
            : `You need 70% to pass. You scored ${score}%. Try again!`}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Question Breakdown</h3>
        {questions.map((question, idx) => {
          const studentAnswer = answers[question.id];
          const isCorrect =
            question.type === "mcq"
              ? studentAnswer === question.correct_answer
              : true; // Non-MCQ shown as informational

          return (
            <div
              key={question.id}
              className={`rounded-xl border p-4 ${
                isCorrect ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-base">{isCorrect ? "✅" : "❌"}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {idx + 1}. {question.question}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Your answer:{" "}
                    <span className="font-medium">{studentAnswer || "(no answer)"}</span>
                  </p>
                  {question.type === "mcq" && !isCorrect && question.correct_answer && (
                    <p className="mt-0.5 text-xs text-green-600">
                      Correct answer:{" "}
                      <span className="font-medium">{question.correct_answer}</span>
                    </p>
                  )}
                  {question.type === "mcq" && !isCorrect && (
                    <p className="mt-1 text-xs text-gray-500">
                      Review this topic to strengthen your understanding.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        {passed ? (
          <Link
            href={`/roadmap/${roadmapId}`}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            Continue to Next Section →
          </Link>
        ) : (
          <Link
            href={`/roadmap/${roadmapId}/test/${testId}`}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            Retry Test
          </Link>
        )}
        <Link
          href={`/roadmap/${roadmapId}`}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Back to Roadmap
        </Link>
      </div>
    </div>
  );
}
