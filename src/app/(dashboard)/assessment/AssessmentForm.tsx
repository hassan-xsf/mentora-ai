"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentQuestion, AssessmentAnswer } from "@/types";

/**
 * Core questions always asked (skill level, constraints, direction) plus a pool
 * sampled per attempt, so a second assessment isn't the same 10 prompts again.
 * Each question is written to produce a signal the career model can act on —
 * evidence of what the student has actually done, not just what sounds appealing.
 */
const CORE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "coding_level",
    question: "What is the most complex thing you have personally built with code?",
    type: "single_choice",
    options: [
      "Nothing yet — I have not written code outside a tutorial",
      "Small scripts or exercises that solve one problem",
      "A working app or site I finished on my own",
      "A multi-part project with a database, users, or an API",
      "Something used by real people, or work I was paid for",
    ],
  },
  {
    id: "math_comfort",
    question: "How far did you get with maths, and how did it feel?",
    type: "single_choice",
    options: [
      "I avoid maths and want a path with as little as possible",
      "I can handle it when it has a clear practical purpose",
      "Comfortable with statistics and probability",
      "Comfortable with calculus and linear algebra",
      "Maths is a strength — proofs and theory are enjoyable",
    ],
  },
  {
    id: "energy_source",
    question: "Which of these tasks would you happily do for a whole day?",
    type: "multi_choice",
    options: [
      "Chasing down why something is broken until it works",
      "Making an interface look and feel exactly right",
      "Digging through a messy dataset for the real story",
      "Designing how parts of a large system fit together",
      "Automating a boring manual process away",
      "Talking to users and turning their needs into a plan",
      "Breaking into something to prove it is not secure",
      "Explaining a hard concept so others finally get it",
    ],
  },
  {
    id: "drain_source",
    question: "Which of these would drain you fastest?",
    type: "multi_choice",
    options: [
      "Long meetings and stakeholder alignment",
      "Pixel-level visual polish",
      "Heavy maths and statistics",
      "Being on call for production incidents",
      "Reading dense documentation and specifications",
      "Repetitive, well-defined tasks with no ambiguity",
      "Presenting and persuading in front of a group",
    ],
  },
  {
    id: "time_commitment",
    question: "Realistically, how many hours a week can you study?",
    type: "single_choice",
    options: [
      "Under 5 — I need a slow, steady path",
      "5-10 hours alongside other commitments",
      "10-20 hours, this is a serious focus",
      "20+ hours, I am going at this full time",
    ],
  },
  {
    id: "horizon",
    question: "When do you need to be job-ready?",
    type: "single_choice",
    options: [
      "Within 6 months — fastest route to employable",
      "About a year",
      "2+ years, I am still studying",
      "No deadline — depth matters more than speed",
    ],
  },
  {
    id: "learning_style",
    question: "How do you actually learn best?",
    type: "single_choice",
    options: [
      "Building projects and looking things up as I hit them",
      "Structured courses worked through in order",
      "Reading documentation and books first, then applying",
      "Video walkthroughs I can follow along with",
      "Working through problem sets and challenges",
    ],
  },
  {
    id: "motivation",
    question: "What would make a job feel worth it five years in?",
    type: "single_choice",
    options: [
      "Strong pay and financial security",
      "Deep technical mastery and respect for the craft",
      "Building products that people visibly use",
      "Autonomy and flexibility over my time",
      "Work that has a social or scientific impact",
      "Leading teams and shaping direction",
    ],
  },
];

const POOL_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "ambiguity",
    question: "You are handed a vague problem with no clear right answer. That feels…",
    type: "scale",
    options: [
      "Stressful — I want clear requirements",
      "Uncomfortable but manageable",
      "Fine, I will find a direction",
      "Good — this is where I do my best work",
      "Ideal — ambiguity is the interesting part",
    ],
  },
  {
    id: "debug_patience",
    question: "A bug has resisted you for three hours. What is your honest reaction?",
    type: "single_choice",
    options: [
      "Frustrated — I would want to hand it off",
      "I push on but it wears me down",
      "I take a break and come back methodically",
      "I get more stubborn the longer it takes",
    ],
  },
  {
    id: "visual_sense",
    question: "How strong is your eye for visual detail and layout?",
    type: "scale",
    options: [
      "Weak — I cannot tell why something looks off",
      "Below average",
      "Average — I notice obvious problems",
      "Strong — bad spacing bothers me",
      "Very strong — I redesign things in my head",
    ],
  },
  {
    id: "people_facing",
    question: "How much of your week do you want spent with other people?",
    type: "scale",
    options: [
      "Almost none — deep solo focus",
      "Mostly solo with occasional check-ins",
      "An even split",
      "Mostly collaborative",
      "Constant contact — people are the job",
    ],
  },
  {
    id: "risk_tolerance",
    question: "Which first job would you take?",
    type: "single_choice",
    options: [
      "Stable large employer, clear ladder, predictable work",
      "Established mid-size company with room to move",
      "Early startup — more chaos, more ownership",
      "Freelance or contract work I source myself",
      "Research, academia, or an open-source funded role",
    ],
  },
  {
    id: "domain_pull",
    question: "Which of these problem spaces genuinely interests you?",
    type: "multi_choice",
    options: [
      "Health and medicine",
      "Finance and markets",
      "Games and entertainment",
      "Climate and energy",
      "Education",
      "Robotics and hardware",
      "Security and privacy",
      "Developer tools and infrastructure",
      "No strong preference — the work matters more",
    ],
  },
  {
    id: "writing",
    question: "How do you feel about writing — docs, explanations, proposals?",
    type: "scale",
    options: [
      "I avoid it",
      "I can do it but would rather not",
      "Neutral",
      "I am comfortable and reasonably good at it",
      "It is one of my strengths",
    ],
  },
  {
    id: "tools_touched",
    question: "Which of these have you actually used, even briefly?",
    type: "multi_choice",
    options: [
      "Git and GitHub",
      "A terminal or command line",
      "HTML and CSS",
      "Python",
      "JavaScript or TypeScript",
      "SQL or a database",
      "A spreadsheet for real analysis",
      "Figma or another design tool",
      "Cloud services (AWS, GCP, Azure)",
      "None of these yet",
    ],
  },
  {
    id: "feedback_loop",
    question: "What kind of progress keeps you going?",
    type: "single_choice",
    options: [
      "Seeing something visible change immediately",
      "A test suite going green",
      "A number improving — speed, accuracy, cost",
      "Someone telling me the thing helped them",
      "Finally understanding a concept that was opaque",
    ],
  },
  {
    id: "credential_path",
    question: "What is your situation with formal credentials?",
    type: "single_choice",
    options: [
      "In a computing or engineering degree now",
      "In a degree in a different field",
      "Degree finished, changing direction",
      "No degree — self-taught route",
      "Bootcamp or certificate route",
    ],
  },
];

/** Fisher-Yates on a copy; sampling keeps repeat assessments from feeling identical. */
function sample<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function buildQuestions(): AssessmentQuestion[] {
  // 8 core + 6 sampled = 14, inside the requested 10-20 band.
  return [...CORE_QUESTIONS, ...sample(POOL_QUESTIONS, 6)];
}

type Props = {
  questions?: AssessmentQuestion[];
};

export default function AssessmentForm({ questions: provided }: Props) {
  // Built once per mount, and only on the client so the sample does not mismatch SSR.
  const [questions] = useState<AssessmentQuestion[]>(() => provided ?? buildQuestions());
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
    startTransition(() => {
      const assessmentAnswers: AssessmentAnswer[] = questions
        .filter((q) => answers[q.id] !== undefined)
        .map((q) => ({
          question_id: q.id,
          question: q.question,
          answer: answers[q.id],
        }));
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
              "See My Careers →"
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