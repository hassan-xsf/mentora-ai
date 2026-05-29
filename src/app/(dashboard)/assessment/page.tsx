import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRoadmapsByStudent } from "@/lib/db/roadmaps";
import AssessmentForm from "./AssessmentForm";

export default async function AssessmentPage() {
  const user = await requireUser();
  const roadmaps = await getRoadmapsByStudent(user.id).catch(() => []);

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">

        {/* Existing roadmaps */}
        {roadmaps.length > 0 && (
          <div className="mb-10">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
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
                  className="flex items-center justify-between rounded-[10px] border border-[#d3cec6] bg-white px-5 py-4 transition-colors hover:border-[#111111] group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[#111111]">{roadmap.title}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1 flex-1 max-w-30 overflow-hidden rounded-full bg-[#f5f1ec]">
                        <div
                          className="h-1 rounded-full bg-[#111111]"
                          style={{ width: `${roadmap.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[#9c9fa5]">{roadmap.completion_percentage}%</span>
                    </div>
                  </div>
                  <svg className="ml-4 shrink-0 text-[#9c9fa5] group-hover:text-[#111111] transition-colors" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* New assessment */}
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
            {roadmaps.length > 0 ? "New Assessment" : "Career Discovery"}
          </p>
          <h1 className="mb-1 text-[28px] font-medium leading-[1.15] tracking-[-0.6px] text-[#111111]">
            {roadmaps.length > 0 ? "Discover another path" : "Find your ideal career"}
          </h1>
          <p className="mb-6 text-[14px] text-[#626260]">
            Answer 10 questions and get personalized career recommendations with a full learning roadmap.
          </p>

          <AssessmentForm />
        </div>

      </div>
    </div>
  );
}
