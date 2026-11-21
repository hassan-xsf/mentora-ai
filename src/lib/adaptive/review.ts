import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { karachiDay } from "@/lib/gamification/streaks";
import type { Json } from "@/types/database";
import { generateRemedialPlan, type RemedialPlan } from "./ai";
import { buildFallbackQuestions, type TopicNode } from "./questions";

export const today = () => karachiDay(new Date());

/**
 * Missed topics from a test attempt go into the review queue, due today so the
 * student can revise before retrying. A topic already in the queue lapses back
 * to the bottom of the ladder.
 */
export async function recordWeakTopics(
  studentId: string,
  roadmapId: string,
  attemptId: string,
  nodeIds: string[]
): Promise<void> {
  const ids = [...new Set(nodeIds)];
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("review_items")
    .select("node_id, lapses")
    .eq("student_id", studentId)
    .in("node_id", ids);
  const lapses = new Map((existing ?? []).map((r) => [r.node_id, r.lapses]));

  const { error } = await admin.from("review_items").upsert(
    ids.map((node_id) => ({
      student_id: studentId,
      node_id,
      roadmap_id: roadmapId,
      stage: 0,
      due_date: today(),
      lapses: lapses.has(node_id) ? (lapses.get(node_id) ?? 0) + 1 : 0,
      source_attempt_id: attemptId,
    })),
    { onConflict: "student_id,node_id" }
  );
  if (error) console.error("[adaptive] review upsert failed:", error.message);
}

export type ReviewItemView = {
  id: string;
  node_id: string;
  roadmap_id: string;
  stage: number;
  due_date: string;
  lapses: number;
  node_title: string;
  roadmap_title: string;
};

/** The student's queue (select-own RLS), soonest first, with titles attached. */
export async function getReviewQueue(studentId: string): Promise<ReviewItemView[]> {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("review_items")
    .select("id, node_id, roadmap_id, stage, due_date, lapses")
    .eq("student_id", studentId)
    .order("due_date", { ascending: true })
    .limit(200);
  if (!items?.length) return [];

  const [{ data: nodes }, { data: roadmaps }] = await Promise.all([
    supabase.from("nodes").select("id, title").in("id", [...new Set(items.map((i) => i.node_id))]),
    supabase.from("roadmaps").select("id, title").in("id", [...new Set(items.map((i) => i.roadmap_id))]),
  ]);
  const nodeTitle = new Map((nodes ?? []).map((n) => [n.id, n.title]));
  const roadmapTitle = new Map((roadmaps ?? []).map((r) => [r.id, r.title]));
  return items.map((i) => ({
    ...i,
    node_title: nodeTitle.get(i.node_id) ?? "Topic",
    roadmap_title: roadmapTitle.get(i.roadmap_id) ?? "Roadmap",
  }));
}

export async function countDueReviews(studentId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("review_items")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .lte("due_date", today());
  return count ?? 0;
}

export type OwnedReviewItem = {
  id: string;
  stage: number;
  due_date: string;
  lapses: number;
  node: TopicNode;
  roadmap_id: string;
  roadmap_title: string;
};

/** A review item, only if it belongs to `studentId`. */
export async function getOwnedReviewItem(itemId: string, studentId: string): Promise<OwnedReviewItem | null> {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("review_items")
    .select("id, stage, due_date, lapses, node_id, roadmap_id")
    .eq("id", itemId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!item) return null;
  const [{ data: node }, { data: roadmap }] = await Promise.all([
    admin.from("nodes").select("id, title, description").eq("id", item.node_id).maybeSingle(),
    admin.from("roadmaps").select("title").eq("id", item.roadmap_id).eq("student_id", studentId).maybeSingle(),
  ]);
  if (!node || !roadmap) return null;
  return { ...item, node, roadmap_title: roadmap.title };
}

export type StoredPlan = RemedialPlan & { used_fallback: boolean };

/** Cached plan for a node (server-only table: holds the quick-check answers). */
export async function getCachedPlan(nodeId: string, studentId: string): Promise<StoredPlan | null> {
  const { data } = await createAdminClient()
    .from("remedial_plans")
    .select("explanation, practice_task, check_questions, used_fallback")
    .eq("node_id", nodeId)
    .eq("student_id", studentId)
    .maybeSingle();
  return data ? { ...data, check_questions: data.check_questions as unknown as RemedialPlan["check_questions"] } : null;
}

/**
 * Remedial plan for a weak node, cached per node. A canned fallback is cached
 * too (the quick check is graded against the stored copy) but is replaced as
 * soon as the AI succeeds on a later visit.
 */
export async function getRemedialPlan(item: OwnedReviewItem, studentId: string): Promise<StoredPlan> {
  const cached = await getCachedPlan(item.node.id, studentId);
  if (cached && !cached.used_fallback) return cached;

  const admin = createAdminClient();
  const { data: missed } = await admin
    .from("milestone_question_results")
    .select("question")
    .eq("student_id", studentId)
    .eq("node_id", item.node.id)
    .eq("is_correct", false)
    .order("created_at", { ascending: false })
    .limit(3);

  const ai = await generateRemedialPlan(
    item.node,
    item.roadmap_title,
    (missed ?? []).map((m) => m.question),
    studentId
  );
  if (!ai && cached) return cached;

  let plan: StoredPlan;
  if (ai) {
    plan = { ...ai, used_fallback: false };
  } else {
    const { data: titles } = await admin.from("nodes").select("title").eq("roadmap_id", item.roadmap_id);
    const [q] = buildFallbackQuestions([item.node], (titles ?? []).map((t) => t.title), item.node.title);
    plan = {
      explanation: item.node.description
        ? `${item.node.title}: ${item.node.description}

Re-read this topic's resources on your roadmap, then try the quick check below.`
        : `Re-read the resources for "${item.node.title}" on your roadmap, then try the quick check below.`,
      practice_task: `Write a 5-sentence summary of "${item.node.title}" in your own words, then build one tiny example that uses it.`,
      check_questions: [{ question: q.question, options: q.options!, correct_answer: q.correct_answer! }],
      used_fallback: true,
    };
  }
  await admin.from("remedial_plans").upsert(
    { node_id: item.node.id, student_id: studentId, ...plan, check_questions: plan.check_questions as unknown as Json },
    { onConflict: "node_id" }
  );
  return plan;
}
