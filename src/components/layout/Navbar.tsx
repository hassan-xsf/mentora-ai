"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { NavList } from "./nav-links";

type Account = { name: string; email: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function AccountMenu({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-[#ebe7e1]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[12px] font-semibold text-white">
          {initials(account.name)}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="text-[#626260]">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-11 w-60 overflow-hidden rounded-[12px] border border-[#e4dfd7] bg-white shadow-[0_12px_32px_-8px_rgba(17,17,17,0.18)]">
          <div className="border-b border-[#efebe5] px-4 py-3">
            <p className="truncate text-[13.5px] font-medium text-[#111111]">{account.name}</p>
            <p className="truncate text-[12px] text-[#9c9fa5]">{account.email}</p>
          </div>
          <div className="p-1.5">
            {[
              { href: "/progress", label: "My progress" },
              { href: "/certificates", label: "Certificates" },
              { href: "/pricing", label: "Buy credits" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-[8px] px-2.5 py-2 text-[13px] text-[#3d3b38] hover:bg-[#f5f1ec] hover:text-[#111111]"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <form action="/sign-out" method="post" className="border-t border-[#efebe5] p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded-[8px] px-2.5 py-2 text-left text-[13px] text-[#3d3b38] hover:bg-[#fff1ea] hover:text-[#d14400]"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function Navbar({
  credits,
  notifications,
  isAdmin = false,
  account,
}: {
  credits?: React.ReactNode;
  notifications?: React.ReactNode;
  isAdmin?: boolean;
  account: Account;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-[#e4dfd7] bg-[#f5f1ec]/85 backdrop-blur-md">
        <div className="flex h-full items-center gap-2 px-3 md:px-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#3d3b38] transition-colors hover:bg-[#ebe7e1] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
              {open ? (
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>

          {/* Sits above the sidebar column on desktop so the logo lines up with the nav. */}
          <Link href="/dashboard" className="flex items-center md:w-60 md:px-6">
            <Logo size="sm" />
          </Link>

          <div className="ml-auto flex items-center gap-2 md:pr-6">
            {notifications}
            {credits}
            <AccountMenu account={account} />
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 top-14 z-30 bg-[#111111]/25 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="h-full w-72 max-w-[85vw] overflow-y-auto border-r border-[#e4dfd7] bg-[#f5f1ec] px-3 py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NavList pathname={pathname} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
