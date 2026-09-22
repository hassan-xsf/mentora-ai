"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("student_id", user.id)
    .eq("is_read", false);

  revalidatePath("/", "layout");
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("student_id", user.id);

  revalidatePath("/", "layout");
}
