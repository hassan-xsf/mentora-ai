import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  CareerMock,
  CertificateMock,
  InternshipsMock,
  PracticeMock,
  ReviewMock,
  RoadmapMock,
} from "@/components/landing/ProductMocks";

// Signed-in visitors never reach this page: src/proxy.ts sends them to /dashboard.

export const metadata: Metadata = {
  title: "Mentora AI · From “what should I study?” to your first internship",
  description:
    "Career discovery, a personalised roadmap, real coding practice, spaced review and a verifiable certificate, built for students in Pakistan.",
};

const btnPrimary =
  "inline-flex h-11 items-center justify-center rounded-[8px] bg-[#ff5600] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#e04d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";
const btnSecondary =
  "inline-flex h-11 items-center justify-center rounded-[8px] border border-[#d3cec6] bg-white px-5 text-[15px] font-medium text-[#111111] transition-colors hover:bg-[#ebe7e1] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";

const steps = [
  { title: "Discover", body: "Answer 10 quick questions. Get careers ranked by how well they fit you, with real demand and salary ranges." },
  { title: "Plan", body: "Pick a career and get a roadmap: three sections of topics, each with resources and small tasks." },
  { title: "Practise", body: "Write real code in the browser. It runs against test cases and you get feedback on what broke." },
  { title: "Prove it", body: "Each section ends with a milestone test. Score 70% to unlock the next one." },
  { title: "Remember it", body: "What you got wrong comes back for review on a schedule, so it sticks past exam week." },
  { title: "Get hired", body: "Finish a roadmap for a certificate anyone can verify, then browse internships in Pakistan." },
];

const features = [
  {
    eyebrow: "Career discovery",
    title: "Not sure what to study? Start here.",
    body: "A short assessment matches your interests and strengths to tech careers. Each match shows its fit score, market demand and salary range, so you can choose with your eyes open.",
    Mock: CareerMock,
  },
  {
    eyebrow: "Real code practice",
    title: "Write code. See it pass or fail.",
    body: "Generate a challenge in your language and level. Your solution runs against real test cases, and the feedback points at the case that failed instead of just giving you a score.",
    Mock: PracticeMock,
  },
  {
    eyebrow: "Adaptive review",
    title: "The topics you missed come back.",
    body: "Questions you get wrong in milestone tests turn into short review sessions, spaced out over days. The ones you keep getting right fade away.",
    Mock: ReviewMock,
  },
  {
    eyebrow: "Verifiable certificate",
    title: "Proof a recruiter can check in seconds.",
    body: "Finish every topic and pass every milestone test to earn a certificate. Its code opens a public verification page, no account needed.",
    Mock: CertificateMock,
  },
  {
    eyebrow: "Internships in Pakistan",
    title: "Then put it to work.",
    body: "Browse internships from Lahore, Karachi, Islamabad and remote teams, collected from public listings and tagged with the skills they ask for.",
    Mock: InternshipsMock,
  },
];

const faqs = [
  {
    q: "Is it free?",
    a: "Yes, to start. Every new account gets 1,000 credits. AI actions such as generating a roadmap or evaluating code spend a few credits each; reading your roadmap, reviewing and tracking progress cost nothing. If the AI fails and you get fallback content, the credits are refunded.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. Roadmaps start from the foundations, and the career assessment also suggests paths like data analysis and QA. Practice challenges come in easy, medium and hard.",
  },
  {
    q: "How is the AI kept honest?",
    a: "Multiple-choice answers are checked against stored keys, code runs against real test cases, and anything the AI writes is labelled. When the AI service is unavailable you see clearly marked fallback content instead of a made-up answer.",
  },
  {
    q: "What does the certificate prove?",
    a: "That you completed every topic in a roadmap and passed each of its milestone tests. Anyone with the code can confirm it on the public verification page.",
  },
  {
    q: "Where do the internships come from?",
    a: "From public job listings for Pakistani companies and remote roles. You apply on the original listing; we don't stand between you and the employer.",
  },
  {
    q: "Who can see my data?",
    a: "Only you. Your roadmaps, answers and code are private to your account, and the only thing ever shown publicly is a certificate you choose to share.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ec] text-[#111111]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-[6px] focus:bg-white focus:px-3 focus:py-2 focus:text-[13px]"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#d3cec6] bg-[#f5f1ec]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Mentora AI home">
            <Logo size="sm" />
          </Link>
          <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
            {[
              ["#how", "How it works"],
              ["#features", "Features"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[#626260] transition-colors hover:bg-[#ebe7e1] hover:text-[#111111]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link
              href="/sign-in"
              className="rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[#626260] transition-colors hover:bg-[#ebe7e1] hover:text-[#111111]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-[6px] bg-[#111111] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
          <div>
            <p className="text-[13px] font-medium text-[#626260]">For students in Pakistan</p>
            <h1 className="mt-4 text-[40px] font-medium leading-[1.06] tracking-[-1.2px] sm:text-[56px] sm:tracking-[-1.6px]">
              Know what to learn next. Prove you learned it.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-[1.55] text-[#626260] sm:text-[18px]">
              Mentora takes you from &ldquo;which career suits me?&rdquo; to a personalised roadmap, real coding
              practice, review that adapts to your mistakes, and a certificate anyone can verify. Then it shows you
              internships to apply for.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={btnPrimary}>
                Create a free account
              </Link>
              <Link href="#how" className={btnSecondary}>
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-[#7b7b78]">1,000 free credits on sign-up · no card needed</p>
          </div>
          <RoadmapMock />
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-y border-[#d3cec6] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-[13px] font-medium text-[#626260]">How it works</p>
            <h2 id="how-title" className="mt-2 max-w-2xl text-[30px] font-medium leading-[1.15] tracking-[-0.8px] sm:text-[40px]">
              Six steps from undecided to job-ready.
            </h2>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-[12px] border border-[#d3cec6] bg-[#d3cec6] sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="bg-white p-6">
                  <span className="font-mono text-[12px] text-[#ff5600]">0{i + 1}</span>
                  <h3 className="mt-2 text-[18px] font-medium tracking-[-0.2px]">{s.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#626260]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <div id="features" className="scroll-mt-16">
          {features.map(({ eyebrow, title, body, Mock }, i) => (
            <section
              key={eyebrow}
              aria-labelledby={`feature-${i}`}
              className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16"
            >
              <div className={i % 2 ? "lg:order-2" : undefined}>
                <p className="text-[13px] font-medium text-[#626260]">{eyebrow}</p>
                <h2 id={`feature-${i}`} className="mt-2 text-[28px] font-medium leading-[1.15] tracking-[-0.6px] sm:text-[36px]">
                  {title}
                </h2>
                <p className="mt-4 max-w-lg text-[16px] leading-[1.6] text-[#626260]">{body}</p>
              </div>
              <div className="mx-auto w-full max-w-md lg:max-w-none">
                <Mock />
              </div>
            </section>
          ))}
        </div>

        {/* AI tutor strip */}
        <section aria-labelledby="tutor-title" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="flex flex-col gap-5 rounded-[16px] bg-[#111111] p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-xl">
              <p className="text-[13px] font-medium text-white/50">Stuck on a topic?</p>
              <h2 id="tutor-title" className="mt-2 text-[24px] font-medium leading-[1.2] tracking-[-0.4px] sm:text-[28px]">
                An AI tutor that knows which topic you&rsquo;re on.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                Ask from inside any roadmap topic and it answers in that context. It explains and hints; it won&rsquo;t
                do your graded work for you.
              </p>
            </div>
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#ff5600] text-[18px]" aria-hidden>
              ✦
            </span>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 border-t border-[#d3cec6]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <p className="text-[13px] font-medium text-[#626260]">FAQ</p>
              <h2 id="faq-title" className="mt-2 text-[30px] font-medium leading-[1.15] tracking-[-0.8px] sm:text-[40px]">
                Questions students ask.
              </h2>
            </div>
            <div className="divide-y divide-[#d3cec6] border-y border-[#d3cec6]">
              {faqs.map((f) => (
                <details key={f.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[6px] py-4 text-[16px] font-medium focus-visible:outline-2 focus-visible:outline-[#111111] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden className="text-[20px] leading-none text-[#9c9fa5] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 pr-8 text-[15px] leading-relaxed text-[#626260]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section aria-labelledby="cta-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="rounded-[16px] border border-[#d3cec6] bg-white px-6 py-12 text-center sm:px-12">
            <h2 id="cta-title" className="text-[28px] font-medium leading-[1.15] tracking-[-0.6px] sm:text-[36px]">
              Your roadmap is ten questions away.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#626260]">
              Create a free account and take the career assessment.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/sign-up" className={btnPrimary}>
                Create a free account
              </Link>
              <Link href="/sign-in" className={btnSecondary}>
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d3cec6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-[13px] text-[#626260] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[#9c9fa5]">© {new Date().getFullYear()}</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/sign-up" className="hover:text-[#111111]">Sign up</Link>
            <Link href="/sign-in" className="hover:text-[#111111]">Sign in</Link>
            <Link href="/verify" className="hover:text-[#111111]">Verify a certificate</Link>
            <a href="#faq" className="hover:text-[#111111]">FAQ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
