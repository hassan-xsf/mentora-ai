type Props = {
  /** Optional override text — defaults to "Fallback response" */
  label?: string;
  /** Compact pill (no body text) */
  compact?: boolean;
  className?: string;
};

/**
 * Surfaced anywhere the AI request failed and we're showing a hardcoded
 * fallback instead of a real AI response. Keeps users from thinking the
 * generic content is what the AI actually produced.
 */
export function AIFallbackBadge({ label = "Fallback response", compact = false, className = "" }: Props) {
  if (compact) {
    return (
      <span
        title="The AI service was unavailable — this is a generic fallback."
        className={`inline-flex items-center gap-1 rounded-full border border-[#ff5600]/30 bg-[#ff5600]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#b83d00] ${className}`}
      >
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M6 1.5v3.5M6 8.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {label}
      </span>
    );
  }

  return (
    <div className={`flex items-start gap-3 rounded-[8px] border border-[#ff5600]/30 bg-[#ff5600]/8 px-4 py-3 ${className}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-[#ff5600]">
        <path d="M8 2v5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium uppercase tracking-widest text-[#b83d00]">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] text-[#626260]">
          The AI service was unavailable, so this is a generic placeholder. Try again in a moment to get a real personalised response.
        </p>
      </div>
    </div>
  );
}
