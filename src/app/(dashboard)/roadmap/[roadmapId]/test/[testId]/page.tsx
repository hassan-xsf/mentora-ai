import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMilestoneTestById } from "@/lib/db/milestone-tests";
import { generateMilestoneTest } from "@/app/actions/generate-milestone-test";
import TestForm from "./TestForm";
import type { MilestoneQuestion } from "@/types";

type Props = {
  params: Promise<{ roadmapId: string; testId: string }>;
};

export default async function TestPage({ params }: Props) {
  const { roadmapId, testId } = await params;
  await requireUser();

  let test = await getMilestoneTestById(testId);
  if (!test) notFound();

  // If no questions yet, generate them
  if (!test.questions || test.questions.length === 0) {
    await generateMilestoneTest(testId, roadmapId, test.title);
    test = await getMilestoneTestById(testId);
    if (!test) notFound();
  }

  const questions = (test.questions ?? []) as MilestoneQuestion[];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/roadmap/${roadmapId}`}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            ← Back to Roadmap
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-sm text-gray-500">Score ≥70% to unlock the next section</p>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">No questions available for this test yet.</p>
            <p className="mt-2 text-sm text-gray-400">Please try refreshing the page.</p>
          </div>
        ) : (
          <TestForm
            test={test}
            questions={questions}
            roadmapId={roadmapId}
          />
        )}
      </div>
    </div>
  );
}
