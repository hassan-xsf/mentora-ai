import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStudyKind } from "@/components/progress/study-kind";

/** One active study minute from StudyTimeTracker. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { kind?: unknown } | null;
  if (!isStudyKind(body?.kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const { data: recorded, error } = await createAdminClient().rpc("record_study_heartbeat", {
    p_student_id: user.id,
    p_kind: body.kind,
  });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  if (!recorded) return NextResponse.json({ error: "too frequent" }, { status: 429 });
  return NextResponse.json({ ok: true });
}
