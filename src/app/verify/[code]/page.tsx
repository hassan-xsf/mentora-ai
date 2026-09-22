import Link from "next/link";
import { getCertificateByCode } from "@/lib/db/certificates";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import type { CertificateLevel } from "@/types";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params;
  const certificate = await getCertificateByCode(decodeURIComponent(code));

  return (
    <div className="min-h-screen bg-[#f5f1ec]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-6 flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#ff5600] text-[11px] font-bold text-white"
            aria-hidden
          >
            ✦
          </span>
          <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#111111]">
            Mentora
          </span>
        </div>

        {certificate ? (
          <>
            <div className="mb-5 flex items-center gap-2.5 rounded-[12px] border border-[#0bdf50]/30 bg-[#0bdf50]/10 px-4 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0bdf50] text-[11px] font-bold text-white">
                ✓
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-[#0a7d30]">
                  Verified certificate
                </p>
                <p className="text-[12px] text-[#0a7d30]/80">
                  Issued by Mentora to {certificate.recipient_name} on{" "}
                  {new Date(certificate.issued_at).toLocaleDateString()}.
                </p>
              </div>
            </div>

            <CertificateCard
              title={certificate.title}
              level={certificate.level as CertificateLevel}
              recipientName={certificate.recipient_name}
              code={certificate.code}
              issuedAt={certificate.issued_at}
            />
          </>
        ) : (
          <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1ea] text-[18px] text-[#ff5600]">
              ✕
            </div>
            <p className="text-[15px] font-medium text-[#111111]">
              No certificate found
            </p>
            <p className="mt-1 text-[13px] text-[#9c9fa5]">
              We have nothing on record for the code{" "}
              <span className="font-mono text-[#111111]">
                {decodeURIComponent(code)}
              </span>
              . Check it for typos and try again.
            </p>
            <Link
              href="/verify"
              className="mt-5 inline-block rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
            >
              Try another code
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-[11.5px] text-[#9c9fa5]">
          Verify any Mentora certificate at{" "}
          <Link href="/verify" className="underline hover:text-[#111111]">
            /verify
          </Link>
        </p>
      </div>
    </div>
  );
}
