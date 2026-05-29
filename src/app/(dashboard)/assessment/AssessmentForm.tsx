"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentQuestion, AssessmentAnswer } from "@/types";

const STATIC_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    question: "What type of work excites you most?",
    type: "single_choice",
    options: ["Building and creating new things", "Analyzing data to find patterns", "Designing intuitive user experiences", "Solving security and infrastructure challenges"],
  },
  {
    id: "q2",
    question: "Which subjects do you enjoy most?",
    type: "multi_choice",
    options: ["Mathematics and Statistics", "Computer Science and Programming", "Design and Visual Arts", "Psychology and Human Behavior", "Business and Strategy"],
  },
  {
    id: "q3",
    question: "How comfortable are you with programming?",
    type: "scale",
    options: ["Complete beginner", "Some basics", "Intermediate", "Advanced", "Expert"],
  },
  {
    id: "q4",
    question: "What is your preferred working style?",
    type: "single_choice",
    options: ["Working independently on deep technical problems", "Collaborating closely with a team", "A mix of solo and team work", "Leading and coordinating others"],
  },
  {
    id: "q5",
    question: "Which best describes your career goal?",
    type: "single_choice",
    options: ["High salary and financial stability", "Making a creative impact", "Solving challenging technical problems", "Building products people love", "Advancing cutting-edge technology"],
  },
  {
    id: "q6",
    question: "How do you feel about working with data?",
    type: "scale",
    options: ["Dislike it", "Neutral", "Enjoy basic analysis", "Love working with data", "Passionate about data science"],
  },
  {
    id: "q7",
    question: "What size company would you prefer?",
    type: "single_choice",
    options: ["Startup (1-50 people)", "Mid-size company (50-500)", "Large corporation (500+)", "Remote/freelance", "No preference"],
  },
  {
    id: "q8",
    question: "Which technical area interests you most?",
    type: "single_choice",
    options: ["Frontend web development", "Backend systems and APIs", "Machine learning and AI", "Security and networking", "Cloud and infrastructure", "Mobile development"],
  },
  {
    id: "q9",
    question: "How important is work-life balance to you?",
    type: "scale",
    options: ["Not important - I want to go all in", "Somewhat important", "Moderately important", "Very important", "Critical - it is my top priority"],
  },
  {
    id: "q10",
    question: "What best describes your problem-solving approach?",
    type: "single_choice",
    options: ["Systematic and methodical - I follow a process", "Creative and experimental - I try new things", "Collaborative - I prefer to think with others", "Research-driven - I study before acting"],
  },
];

type Props = {
  questions?: AssessmentQuestion[];
};

export default function AssessmentForm({ questions = STATIC_QUESTIONS }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const hasAnswer = currentAnswer !== undefined && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== "");

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
    startTransition(() => {
      const assessmentAnswers: AssessmentAnswer[] = Object.entries(answers).map(
        ([question_id, answer]) => ({ question_id, answer })
      );
      const params = new URLSearchParams();
      params.set("answers", JSON.stringify(assessmentAnswers));
      router.push(`/assessment/results?${params.toString()}`);
    });
  }

  const isLastStep = currentStep === totalSteps - 1;
  const pct = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-[11px] text-[#9c9fa5]">
          <span>Question {currentStep + 1} of {totalSteps}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f5f1ec]">
          <div
            className="h-1.5 rounded-full bg-[#111111] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
        <h2 className="mb-5 text-[16px] font-medium leading-snug text-[#111111]">
          {currentQuestion.question}
        </h2>

        {/* Single choice */}
        {currentQuestion.type === "single_choice" && (
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSingleChoice(option)}
                className={`rounded-[8px] border px-4 py-3 text-left text-[13px] transition-colors ${
                  currentAnswer === option
                    ? "border-[#111111] bg-[#111111] text-white font-medium"
                    : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Multi choice */}
        {currentQuestion.type === "multi_choice" && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-[11px] text-[#9c9fa5]">Select all that apply</p>
            {currentQuestion.options.map((option) => {
              const selected = ((currentAnswer as string[]) ?? []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiChoice(option)}
                  className={`flex items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-[13px] transition-colors ${
                    selected
                      ? "border-[#111111] bg-[#111111] text-white font-medium"
                      : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                      selected ? "border-white bg-white text-[#111111]" : "border-[#d3cec6]"
                    }`}
                  >
                    {selected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                        <path d="M1 3l2 2 4-4" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Scale */}
        {currentQuestion.type === "scale" && (
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={option}
                type="button"
                onClick={() => handleScale(option)}
                className={`flex items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-[13px] transition-colors ${
                  currentAnswer === option
                    ? "border-[#111111] bg-[#111111] text-white font-medium"
                    : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                  currentAnswer === option ? "bg-white text-[#111111]" : "bg-[#d3cec6] text-[#626260]"
                }`}>
                  {idx + 1}
                </span>
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="rounded-[8px] border border-[#d3cec6] bg-white px-5 py-2.5 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111] disabled:opacity-40 disabled:pointer-events-none"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasAnswer || isPending}
            className="flex items-center gap-2 rounded-[8px] bg-[#ff5600] px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#e04e00] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing…
              </>
            ) : "See My Careers →"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnswer}
            className="rounded-[8px] bg-[#111111] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:opacity-50 disabled:pointer-events-none"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
