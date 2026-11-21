"use client";

import { AIFeedback } from "@/components/ai/AIFeedback";
import type { ClientTestResult } from "@/lib/runner/grading";
import type { EvaluationResult } from "@/types";

type Props = {
  result: EvaluationResult;
  mode: "run" | "submit";
  challengeId: string;
  xpEarned: number;
  newBadges?: string[];
  onClose: () => void;
};

const STATUS_LABEL: Record<ClientTestResult["status"], string> = {
  passed: "Passed",
  wrong_answer: "Wrong answer",
  runtime_error: "Runtime error",
  timeout: "Time limit",
  memory_limit: "Memory limit",
  output_limit: "Output too large",
  compile_error: "Compile error",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] px-3 py-2" style={{ background: "#1e1e1e" }}>
      <p className="text-[10px] uppercase tracking-widest text-[#777]">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-white">{value}</p>
    </div>
  );
}

function Mono({ text }: { text: string | undefined }) {
  return (
    <pre className="max-h-24 max-w-[220px] overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-[#ccc]">
      {text === undefined || text === "" ? <span className="text-[#555]">(empty)</span> : text}
    </pre>
  );
}

export function EvaluationResults({ result, mode, challengeId, xpEarned, newBadges = [], onClose }: Props) {
  const total = result.tests_total ?? 0;
  const passedCount = result.tests_passed ?? 0;
  const tests = result.results ?? [];
  const headline = result.compile_error
    ? "Compilation failed"
    : result.passed
      ? `All ${total} ${mode === "run" ? "example " : ""}tests passed`
      : `${passedCount}/${total} ${mode === "run" ? "example " : ""}tests passed`;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #2d2d2d" }}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              result.passed ? "bg-[#0bdf50]/20 text-[#0bdf50]" : "bg-[#c41c1c]/20 text-[#ff6b6b]"
            }`}
            aria-hidden
          >
            {result.passed ? "✓" : "✗"}
          </span>
          <span className="text-[12px] font-medium text-white">{headline}</span>
          {mode === "run" && (
            <span className="rounded-full bg-[#2d2d2d] px-2 py-0.5 text-[10px] text-[#aaa]">Run · examples only</span>
          )}
          {xpEarned > 0 && (
            <span className="rounded-full bg-[#ff5600]/20 px-2 py-0.5 text-[11px] font-medium text-[#ff5600]">
              +{xpEarned} XP
            </span>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-[#555] transition-colors hover:text-[#888]" aria-label="Close results">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Correctness" value={`${result.correctness_score}%`} />
          <Metric label="Code style" value={result.style_score == null ? "—" : `${result.style_score}%`} />
          <Metric label="Max runtime" value={result.runtime_ms == null ? "—" : `${result.runtime_ms} ms`} />
          <Metric
            label="Max memory"
            value={result.memory_kb == null ? "—" : `${(result.memory_kb / 1024).toFixed(1)} MB`}
          />
        </div>

        {result.compile_error && (
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-[#ff8a80]">Compiler output</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[6px] p-3 font-mono text-[11px] text-[#ffb4ab]" style={{ background: "#2a1515" }}>
              {result.compile_error}
            </pre>
          </div>
        )}

        {!result.compile_error && tests.length > 0 && (
          <div className="overflow-x-auto rounded-[6px]" style={{ background: "#1e1e1e" }}>
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[#777]" style={{ borderBottom: "1px solid #2d2d2d" }}>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium">Input</th>
                  <th className="px-3 py-2 font-medium">Expected</th>
                  <th className="px-3 py-2 font-medium">Your output</th>
                  <th className="px-3 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t.index} className="align-top" style={{ borderTop: "1px solid #2a2a2a" }}>
                    <td className="px-3 py-2 text-[#888]">{t.index + 1}</td>
                    <td className={`whitespace-nowrap px-3 py-2 font-medium ${t.passed ? "text-[#0bdf50]" : "text-[#ff6b6b]"}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </td>
                    {t.hidden ? (
                      <td colSpan={3} className="px-3 py-2 italic text-[#666]">
                        Hidden test
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2"><Mono text={t.input} /></td>
                        <td className="px-3 py-2"><Mono text={t.expected} /></td>
                        <td className="px-3 py-2">
                          <Mono text={t.actual} />
                          {t.stderr && (
                            <pre className="mt-1 max-h-24 max-w-[220px] overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-[#ff8a80]">
                              {t.stderr}
                            </pre>
                          )}
                        </td>
                      </>
                    )}
                    <td className="whitespace-nowrap px-3 py-2 text-[#888]">{t.timeMs == null ? "—" : `${t.timeMs} ms`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mode === "submit" && result.feedback && (
          <div className="rounded-[6px] p-3" style={{ background: "#1e1e1e" }}>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-[#777]">AI review (style only — tests decide correctness)</p>
            <p className="text-[12px] leading-relaxed text-[#ccc]">{result.feedback}</p>
            {!result.used_fallback && (
              <div className="mt-2.5 inline-block rounded-[6px] bg-[#f5f1ec] px-2 py-1.5">
                <AIFeedback feature="evaluate_submission" targetId={challengeId} />
              </div>
            )}
          </div>
        )}

        {newBadges.length > 0 && (
          <div className="space-y-1.5">
            {newBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-2 rounded-[6px] bg-[#2a2000] px-3 py-2 text-[12px] font-medium text-[#fbbf24]">
                <span aria-hidden>🏅</span> New badge: {badge}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
