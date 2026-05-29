import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types";

export async function getChatHistory(
  studentId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ChatMessage[];
}

export async function saveChatMessage(
  studentId: string,
  role: "user" | "assistant",
  content: string,
  nodeContextId?: string
): Promise<ChatMessage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      student_id: studentId,
      role,
      content,
      node_context_id: nodeContextId ?? null,
    })
    .select()
    .single();

  if (error) return null;
  return data as ChatMessage;
}
