"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReviewCheck, type ReviewCheckResult } from "../actions";

type Props = {
  itemId: string;
  questions: { id: string; question: string; options: string[] }[];
  due: boolean;
  dueDate: string;
};

export default function QuickCheck({ itemId, questions, due, dueDate }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReviewCheckResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const done = !!result && !result.error;
  const allAnswered = questions.every((q) => answers[q.id]);

  function submit() {
    startTransition(async () => setResult(await submitReviewCheck(itemId, answers)));
  }

  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Quick check</p>
      {!due && (
        <p className="mt-1 text-[12.5px] text-[#9c9fa5]">
          Not due until {dueDate}. You can still practise; your schedule won&apos;t change.
        </p>
      )}

      <div className="mt-3 space-y-5">
        {questions.map((q, qi) => {
          const r = result?.results?.[qi];
          return (
            <fieldset key={q.id}>
              <legend className="mb-2 text-[14px] font-medium text-[#111111]">
                {qi + 1}. {q.question}
              </legend>
              <div className="space-y-2">
                {q.options.map((o) => {
                  const selected = answers[q.id] === o;
                  const isAnswer = done && r?.correctAnswer === o;
                  const isWrongPick = done && selected && !r?.correct;
                  return (
                    <label
                      key={o}
                      className={`flex cursor-pointer items-center gap-3 rounded-[8px] border px-4 py-2.5 text-[13.5px] transition-colors ${
                        isAnswer
                          ? "border-[#0bdf50] bg-[#0bdf50]/10"
                          : isWrongPick
                            ? "border-[#c41c1c] bg-[#c41c1c]/5"
                            : selected
                              ? "border-[#111111] bg-[#f5f1ec]"
                              : "border-[#d3cec6] hover:border-[#111111]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={o}
                        checked={selected}
                        disabled={done || isPending}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                        className="accent-[#111111]"
                      />
                      {o}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {result?.error && (
        <p role="alert" className="mt-4 text-[13px] text-[#c41c1c]">
          {result.error}
        </p>
      )}

      {done ? (
        <div className="mt-5 rounded-[8px] bg-[#f5f1ec] px-4 py-3" aria-live="polite">
          <p className="text-[14px] font-medium text-[#111111]">
            {result.correct ? "Nice — you've got it." : "Not yet. Read the lesson again and do the practice task."}
          </p>
          <p className="mt-0.5 text-[12.5px] text-[#626260]">
            {result.nextDue ? `Next review: ${result.nextDue}.` : "Schedule unchanged (this review wasn't due yet)."}
          </p>
          <Link href="/review" className="mt-2 inline-block text-[13px] font-medium text-[#ff5600] hover:underline">
            Back to the queue →
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered || isPending}
          className="mt-5 w-full rounded-[8px] bg-[#111111] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
        >
          {isPending ? "Checking…" : "Check answers"}
        </button>
      )}
    </div>
  );
}
