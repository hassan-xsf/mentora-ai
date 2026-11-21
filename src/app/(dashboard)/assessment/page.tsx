import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRoadmapsByStudent } from "@/lib/db/roadmaps";
import { getAssessmentQuestions, listAssessments } from "@/lib/db/careers";
import type { BankQuestion } from "@/lib/assessment/validate";
import AssessmentForm from "./AssessmentForm";

// Submitting runs the career AI inside this route's server action.
export const maxDuration = 60;

/** Fisher-Yates on a copy; sampling keeps repeat assessments from feeling identical. */
function sample<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/** Every core question plus 6 sampled from the pool. */
function buildQuestions(bank: BankQuestion[]): BankQuestion[] {
  return [...bank.filter((q) => q.is_core), ...sample(bank.filter((q) => !q.is_core), 6)];
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

export default async function AssessmentPage() {
  const user = await requireUser();
  const [roadmaps, history, bank] = await Promise.all([
    getRoadmapsByStudent(user.id).catch(() => []),
    listAssessments(user.id).catch(() => []),
    getAssessmentQuestions(),
  ]);
  const questions = buildQuestions(bank);

  return (
    <div className="min-h-full bg-[#f5f1ec] antialiased selection:bg-[#ff5600] selection:text-white">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">

        {/* Existing roadmaps */}
        {roadmaps.length > 0 && (
          <div className="mb-10">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#ff5600]">
              Your Roadmaps
            </p>
            <h2 className="mb-4 text-[22px] font-medium tracking-[-0.4px] text-[#111111]">
              Continue where you left off
            </h2>
            <div className="space-y-2.5">
              {roadmaps.map((roadmap) => (
                <Link
                  key={roadmap.id}
                  href={`/roadmap/${roadmap.id}`}
                  className="group flex items-center justify-between rounded-[12px] border border-[#d3cec6] bg-white px-5 py-4 transition-all hover:border-[#ff5600] hover:shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[#111111] transition-colors group-hover:text-[#ff5600]">
                      {roadmap.title}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1 flex-1 max-w-32 overflow-hidden rounded-full bg-[#f5f1ec]">
                        <div
                          className="h-1 rounded-full bg-[#ff5600] transition-all duration-300"
                          style={{ width: `${roadmap.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[#9c9fa5]">
                        {roadmap.completion_percentage}%
                      </span>
                    </div>
                  </div>
                  <svg
                    className="ml-4 shrink-0 text-[#9c9fa5] transition-colors group-hover:text-[#ff5600]"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past assessments */}
        {history.length > 0 && (
          <div className="mb-10">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#ff5600]">
              Past Assessments
            </p>
            <h2 className="mb-4 text-[22px] font-medium tracking-[-0.4px] text-[#111111]">
              Your saved results
            </h2>
            <div className="divide-y divide-[#ebe7e1] overflow-hidden rounded-[12px] border border-[#d3cec6] bg-white">
              {history.map((a) => (
                <Link
                  key={a.id}
                  href={`/assessment/results/${a.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[#f5f1ec]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[#111111] group-hover:text-[#ff5600]">
                      {a.top_career ?? "Career matches"}
                    </p>
                    <p className="text-[12px] text-[#9c9fa5]">
                      {dateFmt.format(new Date(a.created_at))}
                      {a.used_fallback && " · generic fallback"}
                    </p>
                  </div>
                  <span aria-hidden className="text-[#9c9fa5] group-hover:text-[#ff5600]">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* New assessment */}
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#ff5600]">
            {roadmaps.length > 0 ? "New Assessment" : "Career Discovery"}
          </p>
          <h1 className="mb-1 text-[28px] font-medium leading-[1.15] tracking-[-0.6px] text-[#111111]">
            {roadmaps.length > 0 ? "Discover another path" : "Find your ideal career"}
          </h1>
          <p className="mb-6 text-[14px] text-[#626260]">
            Answer {questions.length} questions and get personalized career recommendations with a full learning roadmap.
          </p>

          <AssessmentForm questions={questions} />
        </div>

      </div>
    </div>
  );
}