"use client";

import { useState, useTransition } from "react";
import { CodeEditor } from "@/components/practice/CodeEditor";
import type { EvaluationResult } from "@/types";

type Props = {
  challengeId: string;
  starterCode: string;
  language: string;
  status: string;
  existingResult: EvaluationResult | null;
};

const STEPS = [
  "Reading your code…",
  "Running test cases…",
  "Checking code style…",
  "Writing feedback…",
];

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? "#0bdf50" : score >= 50 ? "#ff5600" : "#c41c1c";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-[#9c9fa5]">{label}</span>
        <span className="font-medium text-[#111111]">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2d2d2d]">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function ChallengeEditor({
  challengeId,
  starterCode,
  language,
  existingResult,
}: Props) {
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState<EvaluationResult | null>(existingResult);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(!!existingResult);

  function handleSubmit() {
    setError(null);
    setStepIdx(0);

    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 2500);

    startTransition(async () => {
      try {
        const res = await fetch("/api/practice/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId, code }),
        });

        clearInterval(interval);

        if (!res.ok) {
          const data = await res.json() as { queued?: boolean; error?: string };
          if (data.queued) {
            setError("Evaluation queued — check back in a moment.");
            return;
          }
          throw new Error(data.error ?? "Evaluation failed");
        }

        const data = await res.json() as {
          result: EvaluationResult;
          xp_earned: number;
          new_badges: string[];
        };
        setResult(data.result);
        setXpEarned(data.xp_earned);
        setNewBadges(data.new_badges ?? []);
        setShowResults(true);
      } catch (e) {
        clearInterval(interval);
        setError(e instanceof Error ? e.message : "Failed to evaluate code");
      }
    });
  }

  return (
    <div className="flex h-[55%] w-full flex-col md:h-full md:w-1/2" style={{ background: "#1e1e1e" }}>
      {/* Editor toolbar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #2d2d2d" }}>
        <div className="flex items-center gap-2">
          {/* Traffic-light dots */}
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[11px] font-medium text-[#888]">{language}</span>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 rounded-[6px] bg-[#ff5600] px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#e04e00] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Spinner />
              <span>{STEPS[stepIdx]}</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <polygon points="2,1 11,6 2,11" fill="currentColor" />
              </svg>
              Run & Submit
            </>
          )}
        </button>
      </div>

      {/* CodeMirror editor */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      {/* Error bar */}
      {error && (
        <div className="shrink-0 px-4 py-2.5 text-[12px] text-[#ff8a80]" style={{ background: "#3b1a1a", borderTop: "1px solid #5a1a1a" }}>
          {error}
        </div>
      )}

      {/* Results panel */}
      {result && showResults && (
        <div className="shrink-0 overflow-y-auto" style={{ maxHeight: "260px", borderTop: "1px solid #2d2d2d", background: "#252526" }}>
          {/* Results header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #2d2d2d" }}>
            <div className="flex items-center gap-2.5">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${result.passed ? "bg-[#0bdf50]/20 text-[#0bdf50]" : "bg-[#c41c1c]/20 text-[#ff6b6b]"}`}>
                {result.passed ? "✓" : "✗"}
              </span>
              <span className="text-[12px] font-medium text-white">
                {result.passed ? "All tests passed" : "Not passing yet"}
              </span>
              {xpEarned > 0 && (
                <span className="rounded-full bg-[#ff5600]/20 px-2 py-0.5 text-[11px] font-medium text-[#ff5600]">
                  +{xpEarned} XP
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowResults(false)}
              className="text-[#555] hover:text-[#888] transition-colors"
              aria-label="Close results"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Scores + feedback */}
          <div className="space-y-3 px-4 py-3">
            {result.used_fallback && (
              <div className="flex items-start gap-2 rounded-[6px] border border-[#ff5600]/40 bg-[#ff5600]/10 px-3 py-2 text-[11px] text-[#ffa472]">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0">
                  <path d="M8 2v5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>Fallback evaluation — the AI evaluator was unavailable. Scores are placeholders. Resubmit to get real feedback.</span>
              </div>
            )}
            <ScoreBar label="Correctness" score={result.correctness_score} />
            <ScoreBar label="Code Style" score={result.style_score} />

            <div className="rounded-[6px] p-3" style={{ background: "#1e1e1e" }}>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-[#555]">AI Feedback</p>
              <p className="text-[12px] leading-relaxed text-[#ccc]">{result.feedback}</p>
            </div>

            {newBadges.length > 0 && (
              <div className="space-y-1.5">
                {newBadges.map((badge) => (
                  <div key={badge} className="flex items-center gap-2 rounded-[6px] bg-[#2a2000] px-3 py-2 text-[12px] font-medium text-[#fbbf24]">
                    <span>🏅</span> New badge: {badge}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Re-open results button if closed */}
      {result && !showResults && (
        <button
          type="button"
          onClick={() => setShowResults(true)}
          className="shrink-0 px-4 py-2 text-[11px] font-medium text-[#888] hover:text-white transition-colors text-left"
          style={{ borderTop: "1px solid #2d2d2d" }}
        >
          Show last results ↑
        </button>
      )}
    </div>
  );
}
