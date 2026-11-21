"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error: string | null };

const isDemo = (email: string | undefined) =>
  !!email && !!process.env.DEMO_EMAIL && email.toLowerCase() === process.env.DEMO_EMAIL.toLowerCase();

/** "Try the demo": signs the visitor into the shared demo account. */
export async function signInDemo(): Promise<ActionState> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return { error: "The demo account isn't set up on this server." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "The demo account is unavailable right now. Please create a free account instead." };
  redirect("/dashboard");
}

/** Sets a new password for the signed-in user (reached via the reset email link). */
export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };
  // Everyone shares the demo login; one visitor must not lock the rest out.
  if (isDemo(user.email)) return { error: "The demo account's password can't be changed." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

/** Marks the dashboard tour as done (Skip or Finish). */
export async function completeOnboarding(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Before migration 016 the column is missing; the error is ignored and the
  // tour simply shows again next visit.
  await createAdminClient()
    .from("students")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
}
