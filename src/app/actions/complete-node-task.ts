"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { updateRoadmapCompletion } from "@/lib/db/roadmaps";
import { updateStreak } from "@/lib/gamification/streaks";

export async function completeNodeTask(
  taskId: string,
  nodeId: string,
  roadmapId: string,
  isCompleted: boolean
): Promise<void> {
  const user = await requireUser();
  const supabase = createAdminClient();

  // Every id comes from the client: task → node → roadmap → this user.
  const [{ data: task }, { data: node }, { data: roadmap }] = await Promise.all([
    supabase.from("node_tasks").select("node_id").eq("id", taskId).maybeSingle(),
    supabase.from("nodes").select("roadmap_id, section_index").eq("id", nodeId).maybeSingle(),
    supabase
      .from("roadmaps")
      .select("id")
      .eq("id", roadmapId)
      .eq("student_id", user.id)
      .maybeSingle(),
  ]);
  if (!task || !node || !roadmap || task.node_id !== nodeId || node.roadmap_id !== roadmapId) {
    throw new Error("Task not found");
  }

  // Section 0 is always open; later ones unlock by passing the previous milestone test.
  if (node.section_index !== 0) {
    const { data: unlocked } = await supabase
      .from("unlocked_sections")
      .select("id")
      .eq("student_id", user.id)
      .eq("roadmap_id", roadmapId)
      .eq("section_index", node.section_index)
      .maybeSingle();
    if (!unlocked) throw new Error("This section is still locked — pass the previous milestone test first.");
  }

  const done = isCompleted === true;
  const { error } = await supabase
    .from("node_task_completions")
    .upsert(
      { task_id: taskId, student_id: user.id, is_completed: done },
      { onConflict: "task_id,student_id" }
    );
  if (error) throw new Error("Could not save the task");

  // The node is complete when all of its tasks are.
  const { data: allTasks } = await supabase.from("node_tasks").select("id").eq("node_id", nodeId);
  const taskIds = (allTasks ?? []).map((t) => t.id);
  const { count } = await supabase
    .from("node_task_completions")
    .select("id", { count: "exact", head: true })
    .in("task_id", taskIds)
    .eq("student_id", user.id)
    .eq("is_completed", true);
  const allDone = taskIds.length > 0 && count === taskIds.length;

  await supabase.from("node_completions").upsert(
    {
      node_id: nodeId,
      student_id: user.id,
      is_completed: allDone,
      completed_at: allDone ? new Date().toISOString() : null,
    },
    { onConflict: "node_id,student_id" }
  );

  await updateRoadmapCompletion(roadmapId, user.id);
  if (done) await updateStreak(user.id);
}
