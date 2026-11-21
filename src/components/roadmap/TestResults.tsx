import Link from "next/link";
import { AIFeedback } from "@/components/ai/AIFeedback";
import { PASS_MARK } from "@/lib/adaptive/questions";
import type { AttemptDetail } from "@/lib/db/milestone-tests";

export type WeakTopic = { nodeId: string; title: string; reviewItemId: string | null };

type Props = {
  attempt: AttemptDetail;
  weakTopics: WeakTopic[];
};

export function TestResults({ attempt, weakTopics }: Props) {
  const { score, passed, practice, results } = attempt;
  const scoredPass = score >= PASS_MARK;
  const hasExplanations = results.some((r) => !r.is_correct && r.explanation);

  const headline = passed ? "Passed" : practice && scoredPass ? "Practice passed" : "Not quite";
  const detail = passed
    ? "The next section is unlocked. Keep going!"
    : practice
      ? "This was a practice attempt with generic questions, so it can't unlock the next section. Start a new attempt when the AI is back."
      : `You need ${PASS_MARK}% to pass. Revise the topics below, then try a fresh set of questions.`;

  return (
    <div className="space-y-5">
      {/* Score banner */}
      <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[20px] font-medium ${
              passed ? "bg-[#0bdf50]/15 text-[#0a8f36]" : "bg-[#ff5600]/10 text-[#ff5600]"
            }`}
          >
            {score}%
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
              Last attempt · {new Date(attempt.attempted_at).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}
            </p>
            <p className="mt-0.5 text-[20px] font-medium tracking-[-0.2px] text-[#111111]">{headline}</p>
            <p className="mt-0.5 text-[13px] text-[#626260]">{detail}</p>
          </div>
        </div>
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="rounded-[12px] border border-[#ff5600]/30 bg-[#fff7f2] p-5">
          <p className="text-[14px] font-medium text-[#111111]">Revise these before retrying</p>
          <p className="mt-0.5 text-[12.5px] text-[#626260]">
            Added to your review queue with a short lesson, a practice task and a quick check.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <li key={t.nodeId}>
                <Link
                  href={t.reviewItemId ? `/review/${t.reviewItemId}` : "/review"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d3cec6] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#111111] transition-colors hover:border-[#ff5600] hover:text-[#ff5600]"
                >
                  {t.title} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-medium text-[#111111]">Question breakdown</h3>
        {results.map((r, idx) => (
          <div key={r.question_id} className="rounded-[12px] border border-[#d3cec6] bg-white p-5">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                  r.is_correct ? "bg-[#0bdf50]" : "bg-[#c41c1c]"
                }`}
                aria-label={r.is_correct ? "Correct" : "Incorrect"}
              >
                {r.is_correct ? "✓" : "✕"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#ebe7e1] px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[#626260]">
                    {r.type === "mcq" ? "Multiple choice" : "Short answer"}
                  </span>
                  {r.type === "short" && (
                    <span className="text-[11.5px] text-[#9c9fa5]">{Math.round(r.score * 10)}/10</span>
                  )}
                </div>
                <p className="mt-1.5 text-[14px] font-medium text-[#111111]">
                  {idx + 1}. {r.question}
                </p>
                <p className="mt-2 whitespace-pre-line text-[12.5px] text-[#626260]">
                  Your answer: <span className="font-medium text-[#111111]">{r.student_answer || "(no answer)"}</span>
                </p>
                {!r.is_correct && r.correct_answer && (
                  <p className="mt-1 text-[12.5px] text-[#626260]">
                    {r.type === "mcq" ? "Correct answer" : "Model answer"}:{" "}
                    <span className="font-medium text-[#0a8f36]">{r.correct_answer}</span>
                  </p>
                )}
                {r.feedback && <p className="mt-2 text-[12.5px] text-[#626260]">{r.feedback}</p>}
                {!r.is_correct && r.explanation && (
                  <div className="mt-3 rounded-[8px] bg-[#f5f1ec] px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#ff5600]">Why this was wrong</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#111111]">{r.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasExplanations && (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#d3cec6] bg-white px-5 py-3">
          <p className="text-[12.5px] text-[#626260]">Were these explanations helpful?</p>
          <AIFeedback feature="explain_mistake" targetId={attempt.id} />
        </div>
      )}
    </div>
  );
}
