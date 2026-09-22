import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCertificateById } from "@/lib/db/certificates";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { CopyVerifyLink } from "./CopyVerifyLink";
import type { CertificateLevel } from "@/types";

type Props = {
  params: Promise<{ certificateId: string }>;
};

export default async function CertificatePage({ params }: Props) {
  const { certificateId } = await params;
  const user = await requireUser();
  const certificate = await getCertificateById(certificateId, user.id);

  if (!certificate) notFound();

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/certificates"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9c9fa5] transition-colors hover:text-[#111111]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Certificates
        </Link>

        <CertificateCard
          title={certificate.title}
          level={certificate.level as CertificateLevel}
          recipientName={certificate.recipient_name}
          code={certificate.code}
          issuedAt={certificate.issued_at}
        />

        <div className="mt-5 rounded-[12px] border border-[#d3cec6] bg-white p-5">
          <p className="text-[13px] font-semibold text-[#111111]">Share it</p>
          <p className="mt-1 text-[12.5px] text-[#9c9fa5]">
            Anyone with this link — or the code{" "}
            <span className="font-mono text-[#111111]">{certificate.code}</span> — can
            confirm this certificate is genuine.
          </p>
          <CopyVerifyLink code={certificate.code} />
        </div>
      </div>
    </div>
  );
}
