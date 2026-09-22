"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export async function toggleBlueprintNode(
  blueprintId: string,
  nodeKey: string,
  isCompleted: boolean
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  // RLS restricts both tables to the owner, so no extra ownership check here.
  await supabase.from("blueprint_node_completions").upsert(
    {
      blueprint_id: blueprintId,
      student_id: user.id,
      node_key: nodeKey,
      is_completed: isCompleted,
    },
    { onConflict: "blueprint_id,node_key" }
  );
}
