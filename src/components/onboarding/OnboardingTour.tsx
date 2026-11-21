"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { completeOnboarding } from "@/app/actions/auth";

type Step = { title: string; body: string; target?: string };

// Targets are found by href, so links other features add to the sidebar get
// highlighted without touching this file. Missing/hidden targets (mobile,
// feature not shipped yet) fall back to a centred card.
const STEPS: Step[] = [
  {
    title: "Welcome to Mentora",
    body: "A one-minute tour of where everything lives. You can replay it any time from your dashboard.",
  },
  {
    title: "Career Discovery",
    body: "Start here. Answer 10 questions and get careers ranked by how well they fit you.",
    target: '[href="/assessment"]',
  },
  {
    title: "Your roadmaps",
    body: "Pick a career and you get a roadmap of topics, resources and tasks. Pass each section's milestone test (70%) to unlock the next.",
    target: '[data-tour="roadmaps"]',
  },
  {
    title: "Practice",
    body: "Generate a coding challenge in your language and level. Your code runs against test cases and you get feedback.",
    target: '[href="/practice"]',
  },
  {
    title: "Review",
    body: "Questions you missed come back here on a schedule, so they stick.",
    target: '[href="/review"]',
  },
  {
    title: "Leaderboard",
    body: "Earn XP from tasks, tests and challenges and see how you rank this week.",
    target: '[href="/leaderboard"]',
  },
  {
    title: "Internships",
    body: "Browse internships in Pakistan and remote roles once you have skills to show.",
    target: '[href="/internships"]',
  },
  {
    title: "Certificates",
    body: "Finish a roadmap and pass every test to earn a certificate anyone can verify.",
    target: '[href="/certificates"]',
  },
  {
    title: "AI tutor",
    body: "Stuck? Open the tutor from this button. Inside a roadmap topic it knows what you're studying.",
    target: 'button[aria-label*="tutor" i], button[aria-label*="chat" i]',
  },
];

const DONE_KEY = "mentora:tour-done";
const CARD_W = 340;
const GAP = 14;

function findTarget(selector?: string): HTMLElement | null {
  if (!selector) return null;
  // Sidebar first, then the top nav, then anywhere on the page.
  for (const scope of ["aside ", "header ", ""]) {
    for (const el of document.querySelectorAll<HTMLElement>(scope + selector)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

/** Card placement next to the target: right of it, else above, else below. */
function cardStyle(r: DOMRect | null): React.CSSProperties {
  const w = Math.min(CARD_W, window.innerWidth - 32);
  if (!r) return { width: w, left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  const clampLeft = (x: number) => Math.max(16, Math.min(x, window.innerWidth - w - 16));
  if (r.right + GAP + w + 16 <= window.innerWidth) {
    return { width: w, left: r.right + GAP, top: Math.max(16, Math.min(r.top - 8, window.innerHeight - 280)) };
  }
  if (r.top > 300) return { width: w, left: clampLeft(r.right - w), bottom: window.innerHeight - r.top + GAP };
  return { width: w, left: clampLeft(r.left), top: r.bottom + GAP };
}

export function OnboardingTour({ autoStart }: { autoStart: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [open, setOpen] = useState(false);

  const start = useCallback(() => {
    setStep(0);
    setOpen(true);
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(DONE_KEY) === "1";
    } catch {}
    // The local flag covers a DB without the onboarded_at column yet.
    if (autoStart && !seen) {
      const id = requestAnimationFrame(start);
      return () => cancelAnimationFrame(id);
    }
  }, [autoStart, start]);

  // Track the highlighted element while the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    const el = findTarget(STEPS[step].target);
    el?.scrollIntoView({ block: "nearest" });
    const measure = () => setRect(el ? el.getBoundingClientRect() : null);
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step]);

  function finish() {
    dialogRef.current?.close();
    setOpen(false);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {}
    void completeOnboarding();
  }

  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#d3cec6] bg-white px-3 text-[12px] font-medium text-[#626260] transition-colors hover:bg-[#f5f1ec] hover:text-[#111111]"
      >
        <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden>
          <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.8 5.8a1.75 1.75 0 113 1.2c-.5.4-1.3.8-1.3 1.6M7.5 10.6v.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Replay tour
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        onCancel={(e) => {
          e.preventDefault();
          finish();
        }}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-transparent"
      >
        {open && (
          <>
            {/* Spotlight: the huge shadow dims everything except the target. */}
            <div
              aria-hidden
              className="pointer-events-none fixed rounded-[8px] ring-2 ring-[#ff5600] transition-all duration-200"
              style={
                rect
                  ? {
                      left: rect.left - 4,
                      top: rect.top - 4,
                      width: rect.width + 8,
                      height: rect.height + 8,
                      boxShadow: "0 0 0 9999px rgba(17,17,17,0.55)",
                    }
                  : { inset: 0, boxShadow: "inset 0 0 0 9999px rgba(17,17,17,0.55)", borderRadius: 0, outline: "none" }
              }
            />
            <div
              className="fixed rounded-[12px] border border-[#d3cec6] bg-white p-5 shadow-[0_12px_40px_rgba(17,17,17,0.18)]"
              style={cardStyle(rect)}
            >
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 id="tour-title" className="mt-1.5 text-[18px] font-medium tracking-[-0.2px] text-[#111111]">
                {s.title}
              </h2>
              <p id="tour-body" className="mt-1.5 text-[14px] leading-relaxed text-[#626260]">
                {s.body}
              </p>
              <div className="mt-3 flex gap-1" aria-hidden>
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#111111]" : "bg-[#ebe7e1]"}`} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-[#626260] hover:text-[#111111]"
                >
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="h-9 rounded-[8px] border border-[#d3cec6] bg-white px-3.5 text-[13px] font-medium text-[#111111] hover:bg-[#f5f1ec]"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    autoFocus
                    onClick={() => (last ? finish() : setStep(step + 1))}
                    className={`h-9 rounded-[8px] px-4 text-[13px] font-medium text-white ${
                      last ? "bg-[#ff5600] hover:bg-[#e04d00]" : "bg-[#111111] hover:bg-black"
                    }`}
                  >
                    {last ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
