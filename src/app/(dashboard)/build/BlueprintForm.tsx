"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateBlueprint } from "@/app/actions/generate-blueprint";
import type { BlueprintInputs } from "@/lib/blueprints/types";

/**
 * Six inputs, one per step. Stack and interests are free-text + suggestion
 * chips; the rest are single-choice, because a fixed vocabulary gives the model
 * a far better signal than prose ("4 weeks" beats "a while").
 */

const STACK_CHIPS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "Django", "FastAPI",
  "Java", "Spring", "C#/.NET", "Go", "Rust", "Flutter", "React Native",
  "PostgreSQL", "MongoDB", "Supabase", "Firebase", "Docker", "AWS",
];

const INTEREST_CHIPS = [
  "Health", "Finance", "Games", "Music", "Climate", "Education", "Sports",
  "Maps & travel", "Security", "Developer tools", "Robotics", "Social",
];

const EXPERIENCE = [
  "Beginner — I follow tutorials and adapt them",
  "Junior — I have finished a project or two alone",
  "Intermediate — comfortable across a full stack",
  "Advanced — I have shipped production systems",
];

const TIME = [
  "A weekend",
  "1 week",
  "2-4 weeks",
  "A full semester (3 months)",
];

const GOAL = [
  "A portfolio piece that gets me interviews",
  "A university / final-year project to be graded",
  "Learn one new technology properly",
  "Something I could actually launch to users",
  "A hackathon entry I can demo in minutes",
];

const TEAM = ["Solo", "Pair", "Team of 3-5"];

type Step = {
  key: keyof BlueprintInputs;
  label: string;
  hint: string;
  options?: string[];
  chips?: string[];
  placeholder?: string;
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    key: "stack",
    label: "What do you already know?",
    hint: "Languages, frameworks, tools. Tap the ones that apply or type your own.",
    chips: STACK_CHIPS,
    placeholder: "e.g. React, TypeScript, a bit of Python",
  },
  {
    key: "experience",
    label: "How much have you actually built?",
    hint: "Be honest — this sets how ambitious the project gets.",
    options: EXPERIENCE,
  },
  {
    key: "time",
    label: "How long do you have?",
    hint: "The plan is scoped to finish inside this window.",
    options: TIME,
  },
  {
    key: "goal",
    label: "What is the project for?",
    hint: "A graded project and a hackathon demo need different shapes.",
    options: GOAL,
  },
  {
    key: "interests",
    label: "Which subjects interest you?",
    hint: "The idea gets built around a domain you will not get bored of.",
    chips: INTEREST_CHIPS,
    placeholder: "e.g. music, public transport data",
    optional: true,
  },
  {
    key: "teamSize",
    label: "Working alone or with others?",
    hint: "Team projects get work split into parallel tracks.",
    options: TEAM,
  },
  {
    key: "constraints",
    label: "Anything that must be true?",
    hint: "Required tech, a module brief, no paid APIs, offline only… Skip if none.",
    placeholder: "e.g. must use Java and a SQL database, no paid services",
    optional: true,
  },
];

const EMPTY: BlueprintInputs = {
  stack: "",
  experience: "",
  time: "",
  goal: "",
  interests: "",
  teamSize: "",
  constraints: "",
};

/** Toggle a chip inside the comma-separated free-text value. */
function toggleChip(value: string, chip: string): string {
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  const idx = parts.findIndex((p) => p.toLowerCase() === chip.toLowerCase());
  if (idx >= 0) parts.splice(idx, 1);
  else parts.push(chip);
  return parts.join(", ");
}

export default function BlueprintForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<BlueprintInputs>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];
  const value = inputs[current.key];
  const filled = current.optional || value.trim().length > 0;
  const isLast = step === STEPS.length - 1;
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  function set(key: keyof BlueprintInputs, v: string) {
    setInputs((prev) => ({ ...prev, [key]: v }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const { blueprintId } = await generateBlueprint(inputs);
        router.push(`/build/${blueprintId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not generate a blueprint.");
      }
    });
  }

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-[11px] font-medium text-[#9c9fa5]">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="font-semibold text-[#ff5600]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#d3cec6]/30">
          <div
            className="h-1.5 rounded-full bg-[#ff5600] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-[16px] border border-[#d3cec6] bg-white p-6 shadow-xs sm:p-8">
        <h2 className="text-[18px] font-semibold leading-snug text-[#111111]">
          {current.label}
          {current.optional && (
            <span className="ml-2 align-middle text-[11px] font-medium text-[#9c9fa5]">
              optional
            </span>
          )}
        </h2>
        <p className="mb-5 mt-1 text-[12.5px] text-[#8a8d93]">{current.hint}</p>

        {current.options && (
          <div className="flex flex-wrap gap-2.5">
            {current.options.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set(current.key, opt)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-left text-[13px] font-medium transition-all ${
                    selected
                      ? "border-[#ff5600] bg-[#ff5600] text-white shadow-xs"
                      : "border-[#d3cec6] bg-white text-[#626260] hover:border-[#ff5600] hover:text-[#111111]"
                  }`}
                >
                  {selected && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 stroke-current"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="3"
                      aria-hidden
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {!current.options && (
          <>
            {current.chips && (
              <div className="mb-4 flex flex-wrap gap-2">
                {current.chips.map((chip) => {
                  const selected = value
                    .split(",")
                    .map((p) => p.trim().toLowerCase())
                    .includes(chip.toLowerCase());
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => set(current.key, toggleChip(value, chip))}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${
                        selected
                          ? "border-[#ff5600] bg-[#ff5600] text-white"
                          : "border-[#d3cec6] bg-white text-[#626260] hover:border-[#ff5600] hover:text-[#111111]"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}
            <textarea
              value={value}
              onChange={(e) => set(current.key, e.target.value)}
              placeholder={current.placeholder}
              rows={3}
              className="w-full resize-none rounded-[12px] border border-[#d3cec6] bg-[#faf8f4] px-4 py-3 text-[13.5px] text-[#111111] outline-none transition-colors placeholder:text-[#b3ada3] focus:border-[#ff5600] focus:bg-white"
            />
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-[10px] border border-[#ff5600]/30 bg-[#ff5600]/5 px-4 py-3 text-[12.5px] text-[#111111]">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isPending}
          className="rounded-xl border border-[#d3cec6] bg-white px-5 py-2.5 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111] disabled:pointer-events-none disabled:opacity-40"
        >
          Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-[#ff5600] px-6 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#e04e00] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Designing your project…
              </>
            ) : (
              "Design My Project →"
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!filled}
            className="rounded-xl bg-[#111111] px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-50"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
