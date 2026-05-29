import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getChallengeById } from "@/lib/db/practice";
import ChallengeEditor from "./ChallengeEditor";

type Props = {
  params: Promise<{ challengeId: string }>;
};

const DIFF_STYLE = {
  easy:   { label: "Easy",   cls: "border-[#0bdf50]/40 bg-[#0bdf50]/10 text-[#047a2b]" },
  medium: { label: "Medium", cls: "border-[#ff5600]/40 bg-[#ff5600]/10 text-[#b83d00]" },
  hard:   { label: "Hard",   cls: "border-[#c41c1c]/40 bg-[#c41c1c]/10 text-[#c41c1c]" },
};

const XP_MAP = { easy: 10, medium: 25, hard: 50 };

export default async function ChallengePage({ params }: Props) {
  const { challengeId } = await params;
  const user = await requireUser();

  const challenge = await getChallengeById(challengeId, user.id);
  if (!challenge) notFound();

  const diff = DIFF_STYLE[challenge.difficulty] ?? DIFF_STYLE.easy;
  const xp = XP_MAP[challenge.difficulty] ?? 10;

  // Split problem statement into paragraphs for better rendering
  const paragraphs = challenge.problem_statement.split(/\n\n+/).filter(Boolean);

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden bg-[#f5f1ec] md:flex-row">

      {/* ── Problem panel ── */}
      <div className="flex h-[45%] w-full flex-col overflow-hidden border-b border-[#d3cec6] bg-white md:h-full md:w-1/2 md:border-b-0 md:border-r">

        {/* Problem header */}
        <div className="shrink-0 border-b border-[#f5f1ec] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${diff.cls}`}>
                {diff.label}
              </span>
              <span className="rounded-full border border-[#d3cec6] bg-[#f5f1ec] px-2.5 py-0.5 text-[11px] font-medium text-[#626260]">
                {challenge.language}
              </span>
              <span className="rounded-full border border-[#d3cec6] bg-[#f5f1ec] px-2.5 py-0.5 text-[11px] font-medium text-[#626260]">
                {challenge.topic}
              </span>
            </div>
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#9c9fa5]">
              <span>⚡</span>
              {xp} XP
            </span>
          </div>
        </div>

        {/* Problem content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {paragraphs.map((para, i) => {
              // Detect example blocks (lines starting with Input: / Output: / Example)
              const isExample = /^(example|input:|output:|>>>|#)/i.test(para.trim());
              if (isExample) {
                return (
                  <pre key={i} className="overflow-x-auto rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-4 py-3 font-mono text-[12px] leading-relaxed text-[#626260] whitespace-pre-wrap">
                    {para}
                  </pre>
                );
              }
              return (
                <p key={i} className="text-[14px] leading-relaxed text-[#626260]">
                  {para}
                </p>
              );
            })}
          </div>

          {/* Previous evaluation note */}
          {challenge.evaluation_result && (
            <div className="mt-6 rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] p-4">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Previous result</p>
              <p className="text-[13px] text-[#626260]">{challenge.evaluation_result.feedback}</p>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="shrink-0 border-t border-[#f5f1ec] px-6 py-3">
          <Link
            href="/practice"
            className="text-[12px] text-[#9c9fa5] hover:text-[#111111] transition-colors"
          >
            ← New challenge
          </Link>
        </div>
      </div>

      {/* ── Code editor panel ── */}
      <ChallengeEditor
        challengeId={challengeId}
        starterCode={challenge.starter_code}
        language={challenge.language}
        status={challenge.status}
        existingResult={challenge.evaluation_result}
      />
    </div>
  );
}
