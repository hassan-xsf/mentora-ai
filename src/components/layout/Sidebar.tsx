"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="8" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8" y="8" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    href: "/assessment",
    label: "Career Discovery",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    href: "/build",
    label: "What to Build",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="3" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="7.5" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.3 5L6.7 9.9M10.7 5L8.3 9.9M5 3.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/practice",
    label: "Practice",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 7h2M9 7h2M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/review",
    label: "Review",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M2 7.5a5.5 5.5 0 109.4-3.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M11.5 1.5v2.3H9.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 5v2.7l1.8 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/internships",
    label: "Internships",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <rect x="1.5" y="4.5" width="12" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5.5 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M1.5 8h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M7.5 1.5v12M10.5 4H6a1.75 1.75 0 100 3.5h3a1.75 1.75 0 110 3.5H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/certificates",
    label: "Certificates",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 9.5L4 14l3.5-1.8L11 14l-1-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M1.5 11.5L5 7.5L8 9.5L12 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 4.5H13V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <rect x="1" y="7" width="4" height="6.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
        <rect x="5.5" y="3" width="4" height="10.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10" y="9" width="4" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
];

// Shown only when the server says the user is in ADMIN_EMAILS; the page itself re-checks.
const adminLink = {
  href: "/admin/ai",
  label: "Admin",
  icon: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 1.5L13 3.5V7.5C13 10.5 10.5 12.8 7.5 13.5C4.5 12.8 2 10.5 2 7.5V3.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
};

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-52 shrink-0 border-r border-[#d3cec6] bg-[#f5f1ec] md:flex md:flex-col">
      <nav className="flex flex-col gap-0.5 p-3 pt-4">
        {(isAdmin ? [...sidebarLinks, adminLink] : sidebarLinks).map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-[#111111] text-white"
                : "text-[#626260] hover:bg-[#ebe7e1] hover:text-[#111111]"
            )}
          >
            <span className="shrink-0">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom AI badge */}
      <div className="mt-auto p-3 pb-4">
        <div className="rounded-[8px] border border-[#d3cec6] bg-white px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#ff5600] text-white text-[9px] font-bold shrink-0">
              ✦
            </span>
            <div>
              <p className="text-[11px] font-medium text-[#111111]">AI Tutor</p>
              <p className="text-[10px] text-[#9c9fa5]">Ask anything</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
