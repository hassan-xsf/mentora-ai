import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  // local: the default (global) revokes every session, which logs out everyone sharing the demo account.
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), 303);
}
