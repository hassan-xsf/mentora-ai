"use client";

import { useState } from "react";
import Link from "next/link";

export function CopyVerifyLink({ code }: { code: string }) {
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
      <button
        type="button"
        onClick={copy}
        className="rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
      >
        {copied ? "Link copied ✓" : "Copy verification link"}
      </button>
      <Link
        href={path}
        className="rounded-[8px] border border-[#d3cec6] bg-white px-4 py-2 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]"
      >
        Open public page
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-[8px] border border-[#d3cec6] bg-white px-4 py-2 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]"
      >
        Print / Save PDF
      </button>
    </div>
  );
}
