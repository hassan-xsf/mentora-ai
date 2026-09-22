import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/db/notifications";
import type { Certificate, CertificateLevel } from "@/types";

/** Short, human-typeable verification code: MNT-7F3K-9QB2. */
function generateCode(): string {
  // No I/O/0/1 — they get misread off a printed or screenshotted certificate.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = (n: number) =>
    Array.from(
      { length: n },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
  return `MNT-${block(4)}-${block(4)}`;
}

/** Depth of the roadmap decides the badge on the certificate. */
export function levelForSections(sectionCount: number): CertificateLevel {
  if (sectionCount >= 4) return "Advanced";
  if (sectionCount === 3) return "Intermediate";
  return "Beginner";
}

/**
 * What the certificate WILL look like for a roadmap the student hasn't
 * finished yet — used by the preview card to motivate.
 */
export async function getCertificatePreview(
  roadmapTitle: string,
  sectionCount: number,
  studentId: string
): Promise<{ title: string; level: CertificateLevel; recipientName: string }> {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("full_name, email")
    .eq("id", studentId)
    .single();

  return {
    title: roadmapTitle,
    level: levelForSections(sectionCount),
    recipientName:
      student?.full_name?.trim() || student?.email?.split("@")[0] || "Student",
  };
}

/**
 * Issue the certificate for a finished roadmap. Idempotent: the
 * unique(student_id, roadmap_id) constraint means a second call is a no-op,
 * so callers can invoke it on every completion recalculation.
 */
export async function issueCertificate(
  roadmapId: string,
  studentId: string
): Promise<Certificate | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("certificates")
    .select("*")
    .eq("roadmap_id", roadmapId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) return existing as Certificate;

  const [{ data: roadmap }, { data: student }, { data: nodes }] = await Promise.all([
    supabase.from("roadmaps").select("title").eq("id", roadmapId).single(),
    supabase.from("students").select("full_name, email").eq("id", studentId).single(),
    supabase.from("nodes").select("section_index").eq("roadmap_id", roadmapId),
  ]);

  if (!roadmap) return null;

  const sectionCount = new Set((nodes ?? []).map((n) => n.section_index)).size;
  const recipientName =
    student?.full_name?.trim() || student?.email?.split("@")[0] || "Student";

  const { data: certificate, error } = await supabase
    .from("certificates")
    .insert({
      student_id: studentId,
      roadmap_id: roadmapId,
      code: generateCode(),
      title: roadmap.title,
      level: levelForSections(sectionCount),
      recipient_name: recipientName,
    })
    .select()
    .single();

  // A concurrent completion won the race — return whatever landed.
  if (error || !certificate) {
    const { data: raced } = await supabase
      .from("certificates")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .eq("student_id", studentId)
      .maybeSingle();
    return (raced as Certificate) ?? null;
  }

  await notify(
    studentId,
    "certificate",
    "Certificate earned 🎓",
    `You completed "${roadmap.title}". Your certificate is ready.`,
    `/certificates/${certificate.id}`
  );

  return certificate as Certificate;
}

export async function getCertificatesByStudent(
  studentId: string
): Promise<Certificate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", studentId)
    .order("issued_at", { ascending: false });

  return (data ?? []) as Certificate[];
}

export async function getCertificateById(
  certificateId: string,
  studentId: string
): Promise<Certificate | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .eq("student_id", studentId)
    .maybeSingle();

  return (data as Certificate) ?? null;
}

/**
 * Public lookup for /verify/<code>. Uses the admin client because the verifier
 * is usually a signed-out recruiter, and an anon session carries no RLS
 * identity of its own.
 */
export async function getCertificateByCode(
  code: string
): Promise<Certificate | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  return (data as Certificate) ?? null;
}
