"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import type { BlueprintGraph } from "@/lib/blueprints/types";

export async function toggleBlueprintNode(
  blueprintId: string,
  nodeKey: string,
  isCompleted: boolean
): Promise<void> {
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: blueprint } = await supabase
    .from("project_blueprints")
    .select("graph")
    .eq("id", blueprintId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!blueprint) throw new Error("Blueprint not found");

  const nodes = (blueprint.graph as BlueprintGraph | null)?.nodes ?? [];
  if (!nodes.some((n) => n.key === nodeKey)) throw new Error("Unknown blueprint step");

  await supabase.from("blueprint_node_completions").upsert(
    {
      blueprint_id: blueprintId,
      student_id: user.id,
      node_key: nodeKey,
      is_completed: isCompleted === true,
    },
    { onConflict: "blueprint_id,node_key" }
  );
}
