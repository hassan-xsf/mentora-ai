import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationType } from "@/types";

/**
 * Fire-and-forget: a failed notification must never break the action that
 * triggered it (completing a task, passing a test, buying credits).
 */
export async function notify(
  studentId: string,
  type: NotificationType,
  title: string,
  body = "",
  href?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .insert({ student_id: studentId, type, title, body, href: href ?? null });
  } catch {
    // swallowed on purpose — see above
  }
}

export async function getNotifications(
  studentId: string,
  limit = 15
): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Notification[];
}

export async function getUnreadCount(studentId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("is_read", false);

  return count ?? 0;
}
