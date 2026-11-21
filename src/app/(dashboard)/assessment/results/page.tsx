import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listAssessments } from "@/lib/db/careers";

/** Old URL (answers in the query string). Results are saved now: show the latest one. */
export default async function LegacyAssessmentResultsPage() {
  const user = await requireUser();
  const [latest] = await listAssessments(user.id, 1).catch(() => []);
  redirect(latest ? `/assessment/results/${latest.id}` : "/assessment");
}
