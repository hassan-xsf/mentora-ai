import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/session";
import { statsToCsv } from "@/lib/ai/evaluation";
import { loadEvaluation, WINDOW_DAYS } from "../data";

export const dynamic = "force-dynamic";

/** Per-feature evaluation table as CSV (same numbers as the dashboard). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { features } = await loadEvaluation();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(statsToCsv(features), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ai-evaluation-${WINDOW_DAYS}d-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
