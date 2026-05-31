import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getRoadmapById } from "@/lib/db/roadmaps";
import { getMilestoneTestsForRoadmap, getUnlockedSections } from "@/lib/db/milestone-tests";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import RoadmapView from "./RoadmapView";

type Props = {
  params: Promise<{ roadmapId: string }>;
};

export default async function RoadmapPage({ params }: Props) {
  const { roadmapId } = await params;
  const user = await requireUser();

  const [roadmap, milestoneTests, unlockedSections] = await Promise.all([
    getRoadmapById(roadmapId, user.id),
    getMilestoneTestsForRoadmap(roadmapId),
    getUnlockedSections(user.id, roadmapId),
  ]);

  if (!roadmap) notFound();

  // Group nodes by section_index
  const sections: Map<number, typeof roadmap.nodes> = new Map();
  for (const node of roadmap.nodes) {
    if (!sections.has(node.section_index)) {
      sections.set(node.section_index, []);
    }
    sections.get(node.section_index)!.push(node);
  }

  const sortedSections = Array.from(sections.entries()).sort(([a], [b]) => a - b);
  const totalNodes = roadmap.nodes.length;
  const completedNodes = roadmap.nodes.filter((n) => n.is_completed).length;

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9c9fa5] hover:text-[#111111] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header card */}
        <div className="mb-8 rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Learning Roadmap</p>
              <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">
                {roadmap.title}
              </h1>
            </div>
            {roadmap.used_fallback && (
              <AIFallbackBadge compact label="Fallback" />
            )}
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] text-[#626260]">Overall progress</span>
              <span className="text-[13px] font-medium text-[#111111]">
                {completedNodes}/{totalNodes} nodes · {roadmap.completion_percentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f1ec]">
              <div
                className="h-2 rounded-full bg-[#111111] transition-all duration-500"
                style={{ width: `${roadmap.completion_percentage}%` }}
              />
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-5 flex gap-6 border-t border-[#f5f1ec] pt-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Sections</p>
              <p className="mt-0.5 text-[20px] font-medium text-[#111111]">{sortedSections.length}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Topics</p>
              <p className="mt-0.5 text-[20px] font-medium text-[#111111]">{totalNodes}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Completed</p>
              <p className="mt-0.5 text-[20px] font-medium text-[#111111]">{completedNodes}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Tests</p>
              <p className="mt-0.5 text-[20px] font-medium text-[#111111]">{milestoneTests.length}</p>
            </div>
          </div>
        </div>

        {totalNodes === 0 ? (
          <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-[#111111]">No content yet</p>
            <p className="mt-1 text-[13px] text-[#9c9fa5]">
              This roadmap is still being generated. Try refreshing in a moment.
            </p>
          </div>
        ) : (
          <RoadmapView
            sections={sortedSections}
            milestoneTests={milestoneTests}
            unlockedSections={unlockedSections}
            roadmapId={roadmapId}
            studentId={user.id}
          />
        )}
      </div>
    </div>
  );
}
