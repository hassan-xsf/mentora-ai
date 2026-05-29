"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { updateRoadmapCompletion } from "@/lib/db/roadmaps";

export async function completeNodeTask(
  taskId: string,
  nodeId: string,
  roadmapId: string,
  isCompleted: boolean
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  // Upsert task completion
  await supabase.from("node_task_completions").upsert(
    {
      task_id: taskId,
      student_id: user.id,
      is_completed: isCompleted,
    },
    { onConflict: "task_id,student_id" }
  );

  // Check if all tasks for this node are completed and update node completion
  const { data: allTasks } = await supabase
    .from("node_tasks")
    .select("id")
    .eq("node_id", nodeId);

  if (allTasks && allTasks.length > 0) {
    const taskIds = allTasks.map((t) => t.id);
    const { data: completedTasks } = await supabase
      .from("node_task_completions")
      .select("task_id, is_completed")
      .in("task_id", taskIds)
      .eq("student_id", user.id)
      .eq("is_completed", true);

    const allDone = (completedTasks ?? []).length === allTasks.length;

    await supabase.from("node_completions").upsert(
      {
        node_id: nodeId,
        student_id: user.id,
        is_completed: allDone,
        completed_at: allDone ? new Date().toISOString() : null,
      },
      { onConflict: "node_id,student_id" }
    );
  }

  // Recalculate roadmap completion
  await updateRoadmapCompletion(roadmapId, user.id);
}
