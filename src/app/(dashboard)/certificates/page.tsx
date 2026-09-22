import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCertificatesByStudent } from "@/lib/db/certificates";
import type { CertificateLevel } from "@/types";

export default async function CertificatesPage() {
  const user = await requireUser();
  const certificates = await getCertificatesByStudent(user.id);

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
          Achievements
        </p>
        <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">
          Certificates
        </h1>
        <p className="mt-2 text-[13px] text-[#626260]">
          Finish a roadmap end to end and its certificate lands here, with a code
          anyone can verify.
        </p>

        {certificates.length === 0 ? (
          <div className="mt-8 rounded-[12px] border border-dashed border-[#d3cec6] bg-white px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f0ece5] text-[#b3ada3]">
              🎓
            </div>
            <p className="text-[15px] font-medium text-[#111111]">No certificates yet</p>
            <p className="mt-1 text-[13px] text-[#9c9fa5]">
              Complete every topic in a roadmap to earn your first one.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-block rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
            >
              Go to my roadmaps
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {certificates.map((cert) => (
              <Link
                key={cert.id}
                href={`/certificates/${cert.id}`}
                className="flex items-center justify-between gap-4 rounded-[12px] border border-[#d3cec6] bg-white p-4 transition-colors hover:border-[#111111]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f0ece5] text-[18px]">
                    🎓
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#111111]">
                      {cert.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#9c9fa5]">
                      {cert.level} ·{" "}
                      <span className="font-mono">{cert.code}</span> ·{" "}
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <LevelPill level={cert.level as CertificateLevel} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LevelPill({ level }: { level: CertificateLevel }) {
  const styles: Record<CertificateLevel, string> = {
    Beginner: "border-[#0bdf50]/30 bg-[#0bdf50]/10 text-[#0a7d30]",
    Intermediate: "border-[#ff5600]/30 bg-[#ff5600]/10 text-[#b34100]",
    Advanced: "border-[#111111]/20 bg-[#111111]/5 text-[#111111]",
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[level]}`}
    >
      {level}
    </span>
  );
}
