"use client";

import { useState } from "react";
import Link from "next/link";

type Props = { code: string; pdfHref: string; linkedInHref: string };

const secondary =
  "rounded-[8px] border border-[#d3cec6] bg-white px-4 py-2 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]";

export function CopyVerifyLink({ code, pdfHref, linkedInHref }: Props) {
  const [copied, setCopied] = useState(false);
  const path = `/verify/${code}`;

  async function copy() {
    // location is only readable in the browser, hence the client component.
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={pdfHref}
        download
        className="rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
      >
        Download PDF
      </a>
      <a href={linkedInHref} target="_blank" rel="noopener noreferrer" className={secondary}>
        Add to LinkedIn profile
      </a>
      <button type="button" onClick={copy} className={secondary}>
        {copied ? "Link copied ✓" : "Copy verification link"}
      </button>
      <Link href={path} className={secondary}>
        Open public page
      </Link>
    </div>
  );
}
