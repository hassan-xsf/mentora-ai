import { createClient } from "@/lib/supabase/server";
import { getCertificateById } from "@/lib/db/certificates";
import { certificatePdfResponse } from "@/components/certificates/certificate-pdf";

type Ctx = { params: Promise<{ certificateId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { certificateId } = await params;
  // Scoped to user.id, so another student's certificate id is a 404.
  const certificate = await getCertificateById(certificateId, user.id);
  if (!certificate) return new Response("Not found", { status: 404 });

  return certificatePdfResponse(certificate);
}
