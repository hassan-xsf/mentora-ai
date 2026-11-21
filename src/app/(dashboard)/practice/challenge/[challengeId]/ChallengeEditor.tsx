"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CodeEditor } from "@/components/practice/CodeEditor";
import { EvaluationResults } from "@/components/practice/EvaluationResults";
import { CREDIT_COSTS } from "@/lib/credits/config";
import type { EvaluationResult } from "@/types";

type Props = {
  challengeId: string;
  starterCode: string;
  language: string;
  existingResult: EvaluationResult | null;
  /** Code from the last submit, so a reload doesn't lose work. */
  lastSubmission: string | null;
};

type Mode = "run" | "submit";

const STEPS: Record<Mode, string[]> = {
  run: ["Compiling…", "Running examples…"],
  submit: ["Compiling…", "Running all tests…", "Reviewing code style…", "Writing feedback…"],
};

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ChallengeEditor({ challengeId, starterCode, language, existingResult, lastSubmission }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(lastSubmission ?? starterCode);
  const [result, setResult] = useState<EvaluationResult | null>(existingResult);
  const [resultMode, setResultMode] = useState<Mode>("submit");
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(!!existingResult);

  function evaluate(mode: Mode) {
    setError(null);
    setStepIdx(0);
    setActiveMode(mode);
    const interval = setInterval(() => setStepIdx((i) => Math.min(i + 1, STEPS[mode].length - 1)), 2500);

    startTransition(async () => {
      try {
        const res = await fetch("/api/practice/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId, code, mode }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          result?: EvaluationResult;
          xp_earned?: number;
          new_badges?: string[];
        };
        if (!res.ok || !data.result) throw new Error(data.error ?? "Evaluation failed");

        setResult(data.result);
        setResultMode(mode);
        setXpEarned(data.xp_earned ?? 0);
        setNewBadges(data.new_badges ?? []);
        setShowResults(true);
        if (mode === "submit") router.refresh(); // server-rendered credits badge + "Solved" pill
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to evaluate code");
      } finally {
        clearInterval(interval);
        setActiveMode(null);
      }
    });
  }

  return (
    <div className="flex h-[55%] w-full flex-col md:h-full md:w-1/2" style={{ background: "#1e1e1e" }}>
      {/* Editor toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid #2d2d2d" }}>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[11px] font-medium text-[#888]">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          {isPending && activeMode && (
            <span className="flex items-center gap-1.5 text-[11px] text-[#aaa]" aria-live="polite">
              <Spinner />
              {STEPS[activeMode][stepIdx]}
            </span>
          )}
          <button
            type="button"
            onClick={() => evaluate("run")}
            disabled={isPending}
            title="Run against the example tests (free)"
            className="flex items-center gap-1.5 rounded-[6px] border border-[#444] px-3 py-1.5 text-[12px] font-medium text-[#ddd] transition-colors hover:border-[#888] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <polygon points="2,1 11,6 2,11" fill="currentColor" />
            </svg>
            Run
          </button>
          <button
            type="button"
            onClick={() => evaluate("submit")}
            disabled={isPending}
            title="Run every test, including hidden ones, and get a code review"
            className="flex items-center gap-1.5 rounded-[6px] bg-[#ff5600] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#e04e00] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit
            <span className="text-[10px] font-normal opacity-75">{CREDIT_COSTS.evaluate_submission} cr</span>
          </button>
        </div>
      </div>

      {/* CodeMirror editor */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      {error && (
        <div role="alert" className="shrink-0 px-4 py-2.5 text-[12px] text-[#ff8a80]" style={{ background: "#3b1a1a", borderTop: "1px solid #5a1a1a" }}>
          {error}
        </div>
      )}

      {result && showResults && (
        <div className="shrink-0 overflow-y-auto" style={{ maxHeight: "50%", borderTop: "1px solid #2d2d2d", background: "#252526" }}>
          <EvaluationResults
            result={result}
            mode={resultMode}
            challengeId={challengeId}
            xpEarned={xpEarned}
            newBadges={newBadges}
            onClose={() => setShowResults(false)}
          />
        </div>
      )}

      {result && !showResults && (
        <button
          type="button"
          onClick={() => setShowResults(true)}
          className="shrink-0 px-4 py-2 text-left text-[11px] font-medium text-[#888] transition-colors hover:text-white"
          style={{ borderTop: "1px solid #2d2d2d" }}
        >
          Show last results ↑
        </button>
      )}
    </div>
  );
}
