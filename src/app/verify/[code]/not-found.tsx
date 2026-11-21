import Link from "next/link";

export default function CertificateNotFound() {
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

        <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1ea] text-[18px] text-[#ff5600]">
            ✕
          </div>
          <h1 className="text-[15px] font-medium text-[#111111]">No certificate found</h1>
          <p className="mt-1 text-[13px] text-[#9c9fa5]">
            We have nothing on record for that code. Codes look like{" "}
            <span className="font-mono text-[#111111]">MNT-XXXX-XXXX</span> — check it for
            typos and try again.
          </p>
          <Link
            href="/verify"
            className="mt-5 inline-block rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            Try another code
          </Link>
        </div>
      </div>
    </div>
  );
}
