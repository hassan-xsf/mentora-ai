"use client";

import { useState, useTransition } from "react";
import type { BankQuestion } from "@/lib/assessment/validate";
import { submitAssessment } from "@/app/actions/career-suggestions";
import { CREDIT_COSTS } from "@/lib/credits/config";

type Props = {
  /** Already sampled on the server, so SSR and hydration render the same set. */
  questions: BankQuestion[];
};

export default function AssessmentForm({ questions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const hasAnswer =
    currentAnswer !== undefined &&
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== "");

  function handleSingleChoice(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function handleMultiChoice(value: string) {
    setAnswers((prev) => {
      const existing = (prev[currentQuestion.id] as string[]) ?? [];
      const updated = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...prev, [currentQuestion.id]: updated };
    });
  }

  function handleScale(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function handleNext() {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      // Success redirects to the saved result; only failures return.
      const res = await submitAssessment(answers);
      if (res?.error) setError(res.error);
    });
  }

  const isLastStep = currentStep === totalSteps - 1;
  const pct = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-[11px] font-medium text-[#9c9fa5]">
          <span>Question {currentStep + 1} of {totalSteps}</span>
          <span className="text-[#ff5600] font-semibold">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#d3cec6]/30">
          <div
            className="h-1.5 rounded-full bg-[#ff5600] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question Card (Design 3 Pill Layout) */}
      <div className="rounded-[16px] border border-[#d3cec6] bg-white p-6 shadow-xs sm:p-8">
        <h2 className="mb-2 text-[18px] font-semibold leading-snug text-[#111111]">
          {currentQuestion.question}
        </h2>

        {/* Subtitle helper for multi_choice */}
        {currentQuestion.type === "multi_choice" && (
          <p className="mb-6 text-[12px] font-medium text-[#9c9fa5]">
            Select all options that apply
          </p>
        )}

        {/* Single choice (Pills Layout) */}
        {currentQuestion.type === "single_choice" && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {currentQuestion.options.map((option) => {
              const selected = currentAnswer === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleChoice(option)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-left text-[13px] font-medium transition-all ${
                    selected
                      ? "border-[#ff5600] bg-[#ff5600] text-white shadow-xs"
                      : "border-[#d3cec6] bg-white text-[#626260] hover:border-[#ff5600] hover:text-[#111111]"
                  }`}
                >
                  {selected && (
                    <svg className="h-3.5 w-3.5 shrink-0 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Multi choice (Pills/Tags Layout) */}
        {currentQuestion.type === "multi_choice" && (
          <div className="mt-2 flex flex-wrap gap-2.5">
            {currentQuestion.options.map((option) => {
              const selected = ((currentAnswer as string[]) ?? []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiChoice(option)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4.5 py-2.5 text-left text-[13px] font-medium transition-all ${
                    selected
                      ? "border-[#ff5600] bg-[#ff5600] text-white shadow-xs ring-2 ring-[#ff5600]/20"
                      : "border-[#d3cec6] bg-white text-[#626260] hover:border-[#ff5600] hover:text-[#111111]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      selected ? "border-white bg-white text-[#ff5600]" : "border-[#d3cec6]"
                    }`}
                  >
                    {selected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                        <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Scale (Numbered Badges / Pills) */}
        {currentQuestion.type === "scale" && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {currentQuestion.options.map((option, idx) => {
              const selected = currentAnswer === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleScale(option)}
                  className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-left text-[13px] font-medium transition-all ${
                    selected
                      ? "border-[#ff5600] bg-[#ff5600] text-white shadow-xs"
                      : "border-[#d3cec6] bg-white text-[#626260] hover:border-[#ff5600] hover:text-[#111111]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      selected ? "bg-white text-[#ff5600]" : "bg-[#f5f1ec] text-[#626260]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-3 py-2.5 text-[12px] text-[#c41c1c]">
          {error}
        </p>
      )}

      {/* Navigation Bar */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="rounded-xl border border-[#d3cec6] bg-white px-5 py-2.5 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111] disabled:opacity-40 disabled:pointer-events-none"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasAnswer || isPending}
            className="flex items-center gap-2 rounded-xl bg-[#ff5600] px-6 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#e04e00] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing…
              </>
            ) : (
              `See My Careers · ${CREDIT_COSTS.career_suggestions} credits →`
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnswer}
            className="rounded-xl bg-[#111111] px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-50 disabled:pointer-events-none"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}