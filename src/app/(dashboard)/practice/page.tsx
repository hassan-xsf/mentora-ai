"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateChallenge } from "@/app/actions/generate-challenge";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"];
const TOPICS = ["Arrays", "Strings", "Recursion", "Trees", "Sorting", "Dynamic Programming", "OOP", "APIs"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const XP_MAP: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };
const DIFF_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

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

// ==========================================
// PAGE
// ==========================================
export default function PracticePage() {
  const router = useRouter();

  const [language, setLanguage] = useState("Python");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const [isPending, startTransition] = useTransition();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    setStepIdx(0);

    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1000);

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
    <div className="min-h-screen bg-[#f5f1ec] font-sans text-[#111111]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">

          {/* Info Box */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-10 border border-[#d3cec6] flex flex-col justify-between">
            <div>
              <span className="text-[14px] font-medium text-[#ff5600]">Mentora AI Engine</span>
              <h1 className="mt-4 text-[40px] font-medium leading-[1.05] tracking-[-0.8px] text-[#111111]">
                Practice Makes Perfect.
              </h1>
              <p className="mt-5 text-[16px] leading-relaxed text-[#626260]">
                Our AI creates challenges based on real-world scenarios and your current skill level.
                Complete them to earn verified XP and advance your profile.
              </p>
            </div>
            <div className="mt-12 space-y-3">
              <p className="text-[13px] font-medium text-[#111111]">Verify Your Rewards</p>
              <XpBadge xp={XP_MAP[difficulty]} />
            </div>
          </div>

          {/* Setup Box — light surface, orange reserved for accents (per DESIGN.md) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-10 border border-[#d3cec6] space-y-8">
            <SelectionGroup
              label="Programming Language"
              items={LANGUAGES}
              state={language}
              setState={setLanguage}
              disabled={isPending}
            />
            <SelectionGroup
              label="Subject Matter"
              items={TOPICS}
              state={topic}
              setState={setTopic}
              disabled={isPending}
            />

            <div>
              <p className="mb-3 text-[13px] font-medium text-[#626260]">Skill Level</p>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    disabled={isPending}
                    className={`rounded-lg border py-4 text-[14px] font-semibold transition-all ${
                      difficulty === d
                        ? "border-[#ff5600] bg-[#ff5600]/10 text-[#ff5600]"
                        : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#ff5600]/50 hover:text-[#111111]"
                    }`}
                  >
                    {DIFF_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#ebe7e1]">
              {error && <p className="mb-5 text-[13px] text-[#c41c1c]">{error}</p>}
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#ff5600] text-[15px] font-semibold text-white transition-transform active:scale-[0.98] hover:bg-[#e84e00] disabled:opacity-80"
              >
                {isPending ? (
                  <>
                    <Spinner />
                    <span>{STEPS[stepIdx]}</span>
                  </>
                ) : (
                  <span>Generate Challenge</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPERS
// ==========================================

type SelectionGroupProps = {
  label: string;
  items: string[];
  state: string;
  setState: (v: string) => void;
  disabled: boolean;
};

function SelectionGroup({ label, items, state, setState, disabled }: SelectionGroupProps) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-[#626260]">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => setState(item)}
            disabled={disabled}
            className={`rounded-md border px-4 py-1.5 text-[13px] font-medium transition-all ${
              state === item
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260] hover:border-[#111111] hover:text-[#111111]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function XpBadge({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-[#fffcf9] border border-[#ff5600]/20 px-4 py-3">
      <span className="text-[17px] text-[#ff5600]" aria-hidden>⚡</span>
      <p className="text-[13px] text-[#626260]">
        Complete challenge to earn <strong className="text-[#111111] font-semibold">{xp} XP</strong>
      </p>
    </div>
  );
}
