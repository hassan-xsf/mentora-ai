import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/db/notifications";
import type { Certificate, CertificateLevel } from "@/types";

// No I/O/0/1 — they get misread off a printed or screenshotted certificate.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Accept any alphanumerics so certificates issued before the unambiguous alphabet still verify.
const CODE_PATTERN = /^MNT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Short, human-typeable verification code: MNT-7F3K-9QB2 (CSPRNG, 40 bits). */
export function generateCode(): string {
  const block = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `MNT-${block()}-${block()}`;
}

/**
 * Canonical form of user-typed codes ("mnt 7f3k 9qb2", "MNT7F3K9QB2", ...),
 * or null when it can't be a code — so junk never reaches the database.
 */
export function normalizeCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("MNT") ? raw.slice(3) : raw;
  if (body.length !== 8) return null;
  const code = `MNT-${body.slice(0, 4)}-${body.slice(4)}`;
  return CODE_PATTERN.test(code) ? code : null;
}

/** Depth of the roadmap decides the badge on the certificate. */
export function levelForSections(sectionCount: number): CertificateLevel {
  if (sectionCount >= 4) return "Advanced";
  if (sectionCount === 3) return "Intermediate";
  return "Beginner";
}

/** Earned = every node complete AND every milestone test of the roadmap passed. */
export function isCertificateEarned(
  nodeIds: string[],
  completedNodeIds: Set<string>,
  testIds: string[],
  passedTestIds: Set<string>
): boolean {
  return (
    nodeIds.length > 0 &&
    nodeIds.every((id) => completedNodeIds.has(id)) &&
    testIds.every((id) => passedTestIds.has(id))
  );
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
 * Issue the certificate for a finished roadmap. Re-checks eligibility itself,
 * so a caller can't issue one early. Idempotent: unique(student_id, roadmap_id)
 * means a second call returns the existing certificate.
 * Returns null when the roadmap isn't the student's or isn't finished.
 */
export async function issueCertificate(
  roadmapId: string,
  studentId: string
): Promise<Certificate | null> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("certificates")
    .select("*")
    .eq("roadmap_id", roadmapId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) return existing as Certificate;

  const [{ data: roadmap }, { data: student }, { data: nodes }, { data: tests }] =
    await Promise.all([
      supabase
        .from("roadmaps")
        .select("title")
        .eq("id", roadmapId)
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase.from("students").select("full_name, email").eq("id", studentId).single(),
      supabase.from("nodes").select("id, section_index").eq("roadmap_id", roadmapId),
      supabase.from("milestone_tests").select("id").eq("roadmap_id", roadmapId),
    ]);

  if (!roadmap || !nodes) return null;

  const nodeIds = nodes.map((n) => n.id);
  const testIds = (tests ?? []).map((t) => t.id);
  const [{ data: completions }, { data: passes }] = await Promise.all([
    nodeIds.length
      ? supabase
          .from("node_completions")
          .select("node_id")
          .eq("student_id", studentId)
          .eq("is_completed", true)
          .in("node_id", nodeIds)
      : { data: [] as { node_id: string }[] },
    testIds.length
      ? supabase
          .from("milestone_test_attempts")
          .select("test_id")
          .eq("student_id", studentId)
          .eq("passed", true)
          .in("test_id", testIds)
      : { data: [] as { test_id: string }[] },
  ]);

  const earned = isCertificateEarned(
    nodeIds,
    new Set((completions ?? []).map((c) => c.node_id)),
    testIds,
    new Set((passes ?? []).map((p) => p.test_id))
  );
  if (!earned) return null;

  const sectionCount = new Set(nodes.map((n) => n.section_index)).size;
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

  // A concurrent completion won the race (or, ~never, a code collision) —
  // return whatever landed.
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

/** Exactly what a printed certificate shows — nothing that identifies the account. */
export type PublicCertificate = Pick<
  Certificate,
  "code" | "title" | "level" | "recipient_name" | "issued_at"
>;

/**
 * Public lookup for /verify/<code>. Uses the admin client because the verifier
 * is usually a signed-out recruiter and certificates have no public RLS policy;
 * selects only the printed fields.
 */
export async function getCertificateByCode(
  input: string
): Promise<PublicCertificate | null> {
  const code = normalizeCode(input);
  if (!code) return null;

  const { data } = await createAdminClient()
    .from("certificates")
    .select("code, title, level, recipient_name, issued_at")
    .eq("code", code)
    .maybeSingle();

  return (data as PublicCertificate) ?? null;
}
