"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Bookmark or un-bookmark an internship for the signed-in student. */
export async function setInternshipSaved(internshipId: string, saved: boolean): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (typeof internshipId !== "string" || !UUID.test(internshipId) || typeof saved !== "boolean") return { ok: false };

  const admin = createAdminClient();
  if (saved) {
    // Only active listings can be saved; the row ties to the caller's own id, never a client-sent one.
    const { data: listing } = await admin.from("internships").select("id").eq("id", internshipId).eq("is_active", true).maybeSingle();
    if (!listing) return { ok: false };
    const { error } = await admin
      .from("saved_internships")
      .upsert({ student_id: user.id, internship_id: internshipId }, { onConflict: "student_id,internship_id", ignoreDuplicates: true });
    if (error) return { ok: false };
  } else {
    const { error } = await admin.from("saved_internships").delete().eq("student_id", user.id).eq("internship_id", internshipId);
    if (error) return { ok: false };
  }

  revalidatePath("/internships");
  return { ok: true };
}
