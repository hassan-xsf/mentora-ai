import { redirect } from "next/navigation";

/**
 * Public entry point for certificate verification. A plain server-action form
 * — no client JS needed for one text field.
 */
export default function VerifyIndexPage() {
  async function lookup(formData: FormData) {
    "use server";
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!code) return;
    redirect(`/verify/${encodeURIComponent(code)}`);
  }

  return (
    <div className="min-h-screen bg-[#f5f1ec]">
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-20">
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

        <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 sm:p-8">
          <h1 className="text-[24px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">
            Verify a certificate
          </h1>
          <p className="mt-2 text-[13px] text-[#626260]">
            Enter the verification code printed on the certificate to confirm it is
            genuine.
          </p>

          <form action={lookup} className="mt-6">
            <label
              htmlFor="code"
              className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]"
            >
              Verification code
            </label>
            <input
              id="code"
              name="code"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="MNT-XXXX-XXXX"
              className="mt-2 w-full rounded-[8px] border border-[#d3cec6] bg-[#faf8f4] px-3.5 py-2.5 font-mono text-[14px] uppercase tracking-wider text-[#111111] outline-none transition-colors placeholder:text-[#c9c3ba] focus:border-[#111111] focus:bg-white"
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-[8px] bg-[#111111] px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-black"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
