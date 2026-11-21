import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/** Admin = email listed in env ADMIN_EMAILS (comma separated, case-insensitive). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Signed-in admin or a 404 — non-admins should not learn the page exists. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
