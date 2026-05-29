import { createClient } from "@/lib/supabase/server";
import type { Roadmap } from "@/types";

export async function getRoadmapsByStudent(studentId: string): Promise<Roadmap[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Roadmap[];
}

export type FullRoadmap = Roadmap & {
  nodes: FullNode[];
};

export type FullNode = {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  position: number;
  section_index: number;
  is_completed: boolean;
  resources: {
    id: string;
    node_id: string;
    title: string;
    type: "video" | "article" | "note";
    url: string | null;
    content: string | null;
  }[];
  tasks: {
    id: string;
    node_id: string;
    title: string;
    position: number;
    is_completed: boolean;
  }[];
};

export async function getRoadmapById(
  roadmapId: string,
  studentId: string
): Promise<FullRoadmap | null> {
  const supabase = await createClient();

  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", roadmapId)
    .eq("student_id", studentId)
    .single();

  if (roadmapError || !roadmap) return null;

  const { data: nodes } = await supabase
    .from("nodes")
    .select("*")
    .eq("roadmap_id", roadmapId)
    .order("section_index", { ascending: true })
    .order("position", { ascending: true });

  const nodeList = nodes ?? [];
  const nodeIds = nodeList.map((n) => n.id);

  const [resourcesResult, tasksResult, nodeCompletionsResult, taskCompletionsResult] =
    await Promise.all([
      nodeIds.length > 0
        ? supabase.from("resources").select("*").in("node_id", nodeIds)
        : { data: [] },
      nodeIds.length > 0
        ? supabase.from("node_tasks").select("*").in("node_id", nodeIds).order("position")
        : { data: [] },
      nodeIds.length > 0
        ? supabase
            .from("node_completions")
            .select("*")
            .eq("student_id", studentId)
            .in("node_id", nodeIds)
        : { data: [] },
      nodeIds.length > 0
        ? supabase
            .from("node_task_completions")
            .select("*")
            .eq("student_id", studentId)
        : { data: [] },
    ]);

  const resources = resourcesResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const nodeCompletions = nodeCompletionsResult.data ?? [];
  const taskCompletions = taskCompletionsResult.data ?? [];

  const fullNodes: FullNode[] = nodeList.map((node) => {
    const completion = nodeCompletions.find((nc) => nc.node_id === node.id);
    const nodeResources = resources.filter((r) => r.node_id === node.id);
    const nodeTasks = tasks
      .filter((t) => t.node_id === node.id)
      .map((task) => {
        const tc = taskCompletions.find((tc) => tc.task_id === task.id);
        return {
          ...task,
          is_completed: tc?.is_completed ?? false,
        };
      });

    return {
      ...node,
      is_completed: completion?.is_completed ?? false,
      resources: nodeResources,
      tasks: nodeTasks,
    };
  });

  return {
    ...(roadmap as Roadmap),
    nodes: fullNodes,
  };
}

export async function getNodeById(nodeId: string) {
  const supabase = await createClient();
  const { data: node, error } = await supabase
    .from("nodes")
    .select("*")
    .eq("id", nodeId)
    .single();

  if (error || !node) return null;

  const [resourcesResult, tasksResult] = await Promise.all([
    supabase.from("resources").select("*").eq("node_id", nodeId),
    supabase.from("node_tasks").select("*").eq("node_id", nodeId).order("position"),
  ]);

  return {
    ...node,
    resources: resourcesResult.data ?? [],
    tasks: tasksResult.data ?? [],
  };
}

export async function updateRoadmapCompletion(
  roadmapId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: nodes } = await supabase
    .from("nodes")
    .select("id")
    .eq("roadmap_id", roadmapId);

  if (!nodes || nodes.length === 0) return;

  const nodeIds = nodes.map((n) => n.id);

  const { data: completions } = await supabase
    .from("node_completions")
    .select("node_id, is_completed")
    .eq("student_id", studentId)
    .in("node_id", nodeIds);

  const completedCount = (completions ?? []).filter((c) => c.is_completed).length;
  const percentage = Math.round((completedCount / nodes.length) * 100);

  await supabase
    .from("roadmaps")
    .update({ completion_percentage: percentage })
    .eq("id", roadmapId)
    .eq("student_id", studentId);
}
