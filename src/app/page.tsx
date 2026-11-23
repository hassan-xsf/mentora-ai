import type { Metadata } from "next";
import Link from "next/link";

// Signed-in visitors never reach this page: src/proxy.ts sends them to /dashboard.
// shortcut: the five home page designs are static pages in public/landing (built by
// scripts/landing-variants/build.mjs); once one is picked, port it here and delete the rest.

export const metadata: Metadata = {
  title: "Mentora AI · From “what should I study?” to your first internship",
  description:
    "Career discovery, a personalised roadmap, real coding practice, spaced review and a verifiable certificate, built for students in Pakistan.",
};

const VARIANTS = [
  { n: 1, label: "Split" },
  { n: 2, label: "Product" },
  { n: 3, label: "Campus" },
  { n: 4, label: "Dark" },
  { n: 5, label: "Bento" },
];

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const current = VARIANTS.find((x) => String(x.n) === v)?.n ?? 1;

  return (
    <div className="fixed inset-0 bg-[#f5f1ec]">
      <iframe
        key={current}
        src={`/landing/v${current}.html`}
        title={`Home page design ${current}`}
        className="h-full w-full border-0"
      />
      <nav
        aria-label="Home page designs"
        className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-[12px] border border-[#d3cec6] bg-white p-1 sm:bottom-4"
      >
        {VARIANTS.map((x) => (
          <Link
            key={x.n}
            href={`/?v=${x.n}`}
            scroll={false}
            aria-current={x.n === current ? "page" : undefined}
            className={`inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${
              x.n === current ? "bg-[#111111] text-white" : "text-[#626260] hover:bg-[#ebe7e1] hover:text-[#111111]"
            }`}
          >
            {x.n}
            <span className="hidden sm:inline">{x.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
