import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f1ec]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 bg-[#111111] text-white relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 48px)",
          }}
        />

        {/* Wordmark */}
        <div className="relative">
          <Logo size="md" textColor="rgba(255,255,255,0.9)" />
        </div>

        {/* Hero copy */}
        <div className="relative space-y-5">
          <p className="text-[11px] font-medium tracking-widest uppercase text-white/40">
            Mentora AI · Powered by Gemini
          </p>
          <h1 className="text-[52px] font-medium leading-[1.08] tracking-[-1.4px] text-white">
            Your career,<br />
            mapped out<br />
            precisely.
          </h1>
          <p className="max-w-sm text-[17px] leading-[1.6] text-white/50">
            AI-generated learning roadmaps, milestone tests, and a coding tutor —
            built around where you want to go.
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative flex items-center gap-8 border-t border-white/10 pt-8">
          {[
            { value: "8+", label: "Career paths" },
            { value: "70%", label: "Pass threshold" },
            { value: "∞", label: "Practice challenges" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-medium tracking-tight text-white">{value}</div>
              <div className="mt-0.5 text-[11px] text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[400px]">
          {/* Mobile wordmark */}
          <div className="mb-10 lg:hidden">
            <Logo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
