import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatMessage } from "@/types";

// All callers authenticate first and pass the verified user id; the admin
// client is used because RLS on chat_messages is select-only for students.

/** The student's most recent `limit` messages, oldest first. */
export async function getChatHistory(
  studentId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const { data, error } = await createAdminClient()
    .from("chat_messages")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function saveChatMessage(
  studentId: string,
  role: "user" | "assistant",
  content: string,
  nodeContextId?: string
): Promise<ChatMessage | null> {
  const { data, error } = await createAdminClient()
    .from("chat_messages")
    .insert({
      student_id: studentId,
      role,
      content,
      node_context_id: nodeContextId ?? null,
    })
    .select()
    .single();

  if (error) {
    console.warn("[chat] save failed:", error.message);
    return null;
  }
  return data as ChatMessage;
}

/** Title + description of a node, only if it belongs to one of the student's roadmaps. */
export async function getOwnedNodeContext(
  nodeId: string,
  studentId: string
): Promise<{ id: string; title: string; description: string } | null> {
  const admin = createAdminClient();
  const { data: node } = await admin
    .from("nodes")
    .select("id, title, description, roadmap_id")
    .eq("id", nodeId)
    .maybeSingle();
  if (!node) return null;

  const { data: roadmap } = await admin
    .from("roadmaps")
    .select("student_id")
    .eq("id", node.roadmap_id)
    .maybeSingle();
  if (roadmap?.student_id !== studentId) return null;

  return { id: node.id, title: node.title, description: node.description };
}

/** The student's thumbs on chat replies, keyed by message id. Empty if the table is missing. */
export async function getChatFeedback(studentId: string, messageIds: string[]): Promise<Record<string, 1 | -1>> {
  if (messageIds.length === 0) return {};
  const { data } = await createAdminClient()
    .from("ai_feedback")
    .select("target_id, rating")
    .eq("student_id", studentId)
    .eq("feature", "chat_message")
    .in("target_id", messageIds);
  return Object.fromEntries((data ?? []).map((r) => [r.target_id, r.rating]));
}
