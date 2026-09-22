import type { CertificateLevel } from "@/types";

const LEVEL_STYLE: Record<CertificateLevel, { ink: string; wash: string; seal: string }> = {
  Beginner: { ink: "#0a7d30", wash: "rgba(11,223,80,0.10)", seal: "#0bdf50" },
  Intermediate: { ink: "#b34100", wash: "rgba(255,86,0,0.10)", seal: "#ff5600" },
  Advanced: { ink: "#111111", wash: "rgba(17,17,17,0.07)", seal: "#111111" },
};

type Props = {
  title: string;
  level: CertificateLevel;
  recipientName: string;
  code?: string;
  issuedAt?: string;
  /** Watermarked, greyed-out "this is what you'll get" rendering. */
  preview?: boolean;
};

/**
 * The certificate itself. One component for the owner's view, the public
 * verification page, and the pre-completion preview — so what a student is
 * shown up front is literally what they will earn.
 */
export function CertificateCard({
  title,
  level,
  recipientName,
  code,
  issuedAt,
  preview = false,
}: Props) {
  const s = LEVEL_STYLE[level];
  const issued = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div
      className="relative overflow-hidden rounded-[16px] border-2 bg-white p-6 sm:p-10"
      style={{ borderColor: s.seal }}
    >
      {/* Corner flourishes */}
      <Corner className="left-3 top-3" color={s.seal} />
      <Corner className="right-3 top-3 rotate-90" color={s.seal} />
      <Corner className="bottom-3 left-3 -rotate-90" color={s.seal} />
      <Corner className="bottom-3 right-3 rotate-180" color={s.seal} />

      {/* Tint wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at top, ${s.wash}, transparent 70%)` }}
        aria-hidden
      />

      {preview && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] text-[52px] font-bold uppercase tracking-[6px] sm:text-[72px]"
          style={{ color: s.seal, opacity: 0.07 }}
          aria-hidden
        >
          Preview
        </span>
      )}

      <div className="relative text-center">
        {/* Issuer */}
        <div className="flex items-center justify-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[11px] font-bold text-white"
            style={{ background: s.seal }}
            aria-hidden
          >
            ✦
          </span>
          <span className="text-[13px] font-semibold tracking-[3px] text-[#111111] uppercase">
            Mentora
          </span>
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[4px] text-[#9c9fa5]">
          Certificate of Completion
        </p>

        <div className="mx-auto mt-4 h-px w-16" style={{ background: s.seal }} />

        <p className="mt-6 text-[12px] text-[#9c9fa5]">This certifies that</p>
        <p className="mt-2 text-[26px] font-medium leading-tight tracking-[-0.5px] text-[#111111] sm:text-[32px]">
          {recipientName}
        </p>

        <p className="mt-5 text-[12px] text-[#9c9fa5]">
          has successfully completed the learning roadmap
        </p>
        <p className="mt-2 text-[18px] font-semibold leading-snug text-[#111111] sm:text-[20px]">
          {title}
        </p>

        <span
          className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ background: s.wash, color: s.ink }}
        >
          <Seal color={s.seal} />
          {level}
        </span>

        {/* Footer: date + verification code */}
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-[#f0ece5] pt-5 sm:flex-row sm:justify-between sm:gap-0">
          <div className="text-center sm:text-left">
            <p className="text-[10px] uppercase tracking-widest text-[#9c9fa5]">Issued</p>
            <p className="mt-0.5 text-[12px] font-medium text-[#111111]">
              {issued ?? "On completion"}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[10px] uppercase tracking-widest text-[#9c9fa5]">
              Verification code
            </p>
            <p className="mt-0.5 font-mono text-[12px] font-medium tabular-nums text-[#111111]">
              {code ?? "MNT-••••-••••"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Corner({ className, color }: { className: string; color: string }) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden
    >
      <path d="M1 25V6a5 5 0 015-5h19" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

function Seal({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.6" />
      <path
        d="M5 8l2 2 4-4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
