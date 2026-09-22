import { createClient } from "@/lib/supabase/server";
import type { ProjectBlueprint } from "@/lib/blueprints/types";

export async function getBlueprintsByStudent(
  studentId: string
): Promise<ProjectBlueprint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_blueprints")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ProjectBlueprint[];
}

export async function getBlueprintById(
  blueprintId: string,
  studentId: string
): Promise<{ blueprint: ProjectBlueprint; completed: string[] } | null> {
  const supabase = await createClient();

  const { data: blueprint } = await supabase
    .from("project_blueprints")
    .select("*")
    .eq("id", blueprintId)
    .eq("student_id", studentId)
    .single();

  if (!blueprint) return null;

  const { data: completions } = await supabase
    .from("blueprint_node_completions")
    .select("node_key, is_completed")
    .eq("blueprint_id", blueprintId);

  return {
    blueprint: blueprint as ProjectBlueprint,
    completed: (completions ?? []).filter((c) => c.is_completed).map((c) => c.node_key),
  };
}
