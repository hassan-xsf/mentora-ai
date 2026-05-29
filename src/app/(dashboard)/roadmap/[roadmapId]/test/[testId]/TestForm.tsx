"use client";

import { useState, useTransition } from "react";
import { submitMilestoneTest } from "@/app/actions/submit-milestone-test";
import type { MilestoneTest, MilestoneQuestion } from "@/types";
import { TestResults } from "@/components/roadmap/TestResults";

type Props = {
  test: MilestoneTest;
  questions: MilestoneQuestion[];
  roadmapId: string;
};

type AttemptResult = {
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  questions: MilestoneQuestion[];
};

export default function TestForm({ test, questions, roadmapId }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function handleSubmit() {
    startTransition(async () => {
      const response = await submitMilestoneTest(test.id, answers, roadmapId);
      setResult({ ...response, answers, questions });
    });
  }

  if (result) {
    return (
      <TestResults
        score={result.score}
        passed={result.passed}
        questions={result.questions}
        answers={result.answers}
        roadmapId={roadmapId}
        testId={test.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, qIdx) => (
        <div
          key={question.id}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <p className="mb-4 font-medium text-gray-900">
            {qIdx + 1}. {question.question}
          </p>

          {/* MCQ */}
          {question.type === "mcq" && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    answers[question.id] === option
                      ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                      : "border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs ${
                      answers[question.id] === option
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[question.id] === option && "•"}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Q&A */}
          {question.type === "qa" && (
            <textarea
              value={answers[question.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
              }
              rows={4}
              placeholder="Type your answer..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none"
            />
          )}

          {/* Coding */}
          {question.type === "coding" && (
            <div>
              {question.starter_code && (
                <pre className="mb-3 rounded-lg bg-gray-900 p-4 text-xs text-green-400 overflow-x-auto">
                  {question.starter_code}
                </pre>
              )}
              <textarea
                value={answers[question.id] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                rows={8}
                placeholder="Write your code here..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none"
              />
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isPending}
        className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Test"}
      </button>
    </div>
  );
}
