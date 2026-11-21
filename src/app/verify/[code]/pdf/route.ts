import { getCertificateByCode } from "@/lib/db/certificates";
import { certificatePdfResponse } from "@/components/certificates/certificate-pdf";

type Ctx = { params: Promise<{ code: string }> };

// Public like /verify/<code>: whoever holds the code may download the PDF.
export async function GET(_request: Request, { params }: Ctx) {
  const { code } = await params;
  let decoded = code;
  try {
    decoded = decodeURIComponent(code);
  } catch {
    // malformed %-escape: normalizeCode rejects it below
  }
  const certificate = await getCertificateByCode(decoded);
  if (!certificate) return new Response("Not found", { status: 404 });
  return certificatePdfResponse(certificate);
}
