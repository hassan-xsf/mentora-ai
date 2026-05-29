"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const navLinks = [
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/assessment", label: "Career Discovery" },
  { href: "/practice",   label: "Practice" },
  { href: "/progress",   label: "Progress" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-[#d3cec6] bg-[#f5f1ec]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-5">

          {/* Wordmark */}
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-[#111111] text-white"
                    : "text-[#626260] hover:bg-[#ebe7e1] hover:text-[#111111]"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop sign out */}
          <form action="/sign-out" method="post" className="hidden md:block">
            <button
              type="submit"
              className="rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[#626260] transition-colors hover:bg-[#ebe7e1] hover:text-[#111111]"
            >
              Sign out
            </button>
          </form>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#626260] transition-colors hover:bg-[#ebe7e1] hover:text-[#111111] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute left-0 right-0 top-14 border-b border-[#d3cec6] bg-[#f5f1ec] px-4 pb-4 pt-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-[8px] px-4 py-3 text-[14px] font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-[#111111] text-white"
                      : "text-[#626260] hover:bg-[#ebe7e1] hover:text-[#111111]"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-[#d3cec6] pt-3">
              <form action="/sign-out" method="post">
                <button
                  type="submit"
                  className="w-full rounded-[8px] border border-[#d3cec6] bg-white px-4 py-3 text-left text-[14px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
