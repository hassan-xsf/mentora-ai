"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateChallenge } from "@/app/actions/generate-challenge";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"];
const TOPICS = ["Arrays", "Strings", "Recursion", "Trees", "Sorting", "Dynamic Programming", "OOP", "APIs"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const XP_MAP = { easy: 10, medium: 25, hard: 50 };
const DIFF_STYLE = {
  easy:   { active: "border-[#0bdf50] bg-[#0bdf50]/10 text-[#047a2b]",   label: "Easy" },
  medium: { active: "border-[#ff5600] bg-[#ff5600]/10 text-[#b83d00]",   label: "Medium" },
  hard:   { active: "border-[#c41c1c] bg-[#c41c1c]/10 text-[#c41c1c]",  label: "Hard" },
};

const STEPS = [
  "Crafting your challenge…",
  "Writing the problem statement…",
  "Building starter code…",
  "Almost ready…",
];

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const [language, setLanguage] = useState("Python");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [isPending, startTransition] = useTransition();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    setStepIdx(0);

    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 3000);

    startTransition(async () => {
      try {
        const { challengeId } = await generateChallenge(language, topic, difficulty);
        clearInterval(interval);
        router.push(`/practice/challenge/${challengeId}`);
      } catch (e) {
        clearInterval(interval);
        setError(e instanceof Error ? e.message : "Failed to generate challenge. Please try again.");
      }
    });
  }

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Practice</p>
          <h1 className="mt-1 text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
            Coding Challenges
          </h1>
          <p className="mt-1.5 text-[15px] text-[#626260]">
            Pick your preferences and get an AI-generated problem to solve.
          </p>
        </div>

        <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 space-y-7">

          {/* Language */}
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
              Language
            </p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  disabled={isPending}
                  className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:pointer-events-none ${
                    language === lang
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
              Topic
            </p>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  disabled={isPending}
                  className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:pointer-events-none ${
                    topic === t
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
              Difficulty
            </p>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  disabled={isPending}
                  className={`flex-1 rounded-[8px] border py-2.5 text-[13px] font-medium capitalize transition-colors disabled:pointer-events-none ${
                    difficulty === d
                      ? DIFF_STYLE[d].active
                      : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
                  }`}
                >
                  {DIFF_STYLE[d].label}
                </button>
              ))}
            </div>
          </div>

          {/* XP badge */}
          <div className="flex items-center gap-2.5 rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-4 py-3">
            <span className="text-[18px]" aria-hidden>⚡</span>
            <p className="text-[13px] text-[#626260]">
              Complete this challenge to earn{" "}
              <span className="font-medium text-[#111111]">{XP_MAP[difficulty]} XP</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-4 py-3 text-[13px] text-[#c41c1c]">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[8px] bg-[#111111] text-[15px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isPending ? (
              <>
                <Spinner />
                <span>{STEPS[stepIdx]}</span>
              </>
            ) : (
              <>
                <span>Generate Challenge</span>
                <span aria-hidden>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
