"use client";

import { useState } from "react";
import Link from "next/link";
import { CertificateCard } from "./CertificateCard";
import type { CertificateLevel } from "@/types";

type Props = {
  title: string;
  level: CertificateLevel;
  recipientName: string;
  /** Set once the roadmap is finished — flips the teaser into a real link. */
  earnedCertificateId?: string | null;
  completionPercentage: number;
};

/**
 * Shown on the roadmap so a student can see the certificate waiting at the end
 * before they've done the work — the whole point is the pull.
 */
export function CertificatePreviewCard({
  title,
  level,
  recipientName,
  earnedCertificateId,
  completionPercentage,
}: Props) {
  const [open, setOpen] = useState(false);
  const earned = Boolean(earnedCertificateId);

  return (
    <div
      className={`mb-8 rounded-[14px] border p-4 sm:p-5 ${
        earned
          ? "border-[#0bdf50]/40 bg-gradient-to-r from-[#0bdf50]/[0.08] to-transparent"
          : "border-[#d3cec6] bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[18px] ${
              earned ? "bg-[#0bdf50]/15" : "bg-[#f0ece5]"
            }`}
            aria-hidden
          >
            🎓
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-[#111111]">
              {earned
                ? "Certificate earned"
                : `Finish this roadmap to earn your ${level} certificate`}
            </p>
            <p className="mt-0.5 text-[11.5px] text-[#9c9fa5]">
              {earned
                ? "Shareable, with a public verification code."
                : `${100 - completionPercentage}% to go — it carries your name and a verification code.`}
            </p>
          </div>
        </div>

        {earned ? (
          <Link
            href={`/certificates/${earnedCertificateId}`}
            className="shrink-0 rounded-[8px] bg-[#0bdf50] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#09b942]"
          >
            View →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded-[8px] border border-[#d3cec6] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]"
          >
            {open ? "Hide" : "Preview"}
          </button>
        )}
      </div>

      {open && !earned && (
        <div className="mt-4">
          {/* Scaled down — it's a teaser, not the document. */}
          <CertificateCard
            title={title}
            level={level}
            recipientName={recipientName}
            preview
          />
        </div>
      )}
    </div>
  );
}
