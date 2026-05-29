"use client";

type Props = {
  size?: "sm" | "md" | "lg";
  /** Show just the icon mark, no wordmark */
  iconOnly?: boolean;
  /** Override the link colour of the wordmark (defaults to #111111) */
  textColor?: string;
};

const sizes = {
  sm: { icon: 24, text: 13, gap: 8 },
  md: { icon: 30, text: 15, gap: 10 },
  lg: { icon: 40, text: 20, gap: 12 },
};

export function Logo({ size = "md", iconOnly = false, textColor = "#111111" }: Props) {
  const s = sizes[size];

  return (
    <span
      className="inline-flex items-center shrink-0 select-none"
      style={{ gap: s.gap }}
      aria-label="Mentora AI"
    >
      {/* Icon mark — stylised "M" on orange */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="40" height="40" rx="10" fill="#ff5600" />
        {/* Stylised M — two peaks with a connecting valley */}
        <path
          d="M9 29 L9 13 L20 22 L31 13 L31 29"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {!iconOnly && (
        <span
          style={{
            fontSize: s.text,
            fontWeight: 600,
            letterSpacing: "-0.4px",
            color: textColor,
            lineHeight: 1,
          }}
        >
          Mentora{" "}
          <span style={{ color: "#ff5600", fontWeight: 700 }}>AI</span>
        </span>
      )}
    </span>
  );
}
