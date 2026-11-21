"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setLeaderboardVisibility(show: boolean): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (typeof show !== "boolean") return { ok: false };

  const { error } = await createAdminClient()
    .from("students")
    .update({ show_on_leaderboard: show })
    .eq("id", user.id);
  if (error) return { ok: false };

  revalidatePath("/leaderboard");
  return { ok: true };
}
