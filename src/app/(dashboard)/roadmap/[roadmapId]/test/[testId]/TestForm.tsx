"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitMilestoneTest } from "@/app/actions/submit-milestone-test";
import { MAX_SHORT_ANSWER, type PublicQuestion } from "@/lib/adaptive/questions";

type Props = {
  sessionId: string;
  questions: PublicQuestion[];
};

export default function TestForm({ sessionId, questions }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => (answers[q.id] ?? "").trim().length > 0);
  const set = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await submitMilestoneTest(sessionId, answers);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <fieldset key={q.id} className="rounded-[12px] border border-[#d3cec6] bg-white p-5 sm:p-6">
          <legend className="sr-only">Question {idx + 1}</legend>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#ebe7e1] px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[#626260]">
              {q.type === "mcq" ? "Multiple choice" : "Short answer"}
            </span>
            <span className="text-[11.5px] text-[#9c9fa5]">{q.topic}</span>
          </div>
          <p className="mb-4 text-[15px] font-medium leading-snug text-[#111111]">
            {idx + 1}. {q.question}
          </p>

          {q.type === "mcq" && q.options && (
            <div className="space-y-2" role="radiogroup">
              {q.options.map((option) => {
                const selected = answers[q.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={isPending}
                    onClick={() => set(q.id, option)}
                    className={`flex w-full items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-[13.5px] transition-colors ${
                      selected
                        ? "border-[#111111] bg-[#f5f1ec] font-medium text-[#111111]"
                        : "border-[#d3cec6] bg-white text-[#313130] hover:border-[#111111]"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 shrink-0 rounded-full border ${
                        selected ? "border-[#111111] bg-[#111111] shadow-[inset_0_0_0_3px_#f5f1ec]" : "border-[#9c9fa5]"
                      }`}
                    />
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "short" && (
            <div>
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
                disabled={isPending}
                rows={5}
                maxLength={MAX_SHORT_ANSWER}
                aria-label={`Answer to question ${idx + 1}`}
                placeholder="Explain in your own words (2–5 sentences)…"
                className="w-full resize-y rounded-[8px] border border-[#d3cec6] px-3 py-2.5 text-[13.5px] text-[#111111] outline-none focus:border-[#111111]"
              />
              <p className="mt-1 text-right text-[11px] text-[#9c9fa5]">
                {(answers[q.id] ?? "").length}/{MAX_SHORT_ANSWER}
              </p>
            </div>
          )}
        </fieldset>
      ))}

      {error && (
        <p role="alert" className="rounded-[8px] border border-[#c41c1c]/30 bg-[#c41c1c]/5 px-4 py-2.5 text-[13px] text-[#c41c1c]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isPending}
        className="w-full rounded-[8px] bg-[#111111] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
      >
        {isPending ? "Grading your answers…" : "Submit test"}
      </button>
    </div>
  );
}
