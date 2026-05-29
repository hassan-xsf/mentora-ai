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
    href: "/progress",
    label: "Progress",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M1.5 11.5L5 7.5L8 9.5L12 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 4.5H13V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-52 shrink-0 border-r border-[#d3cec6] bg-[#f5f1ec] md:flex md:flex-col">
      <nav className="flex flex-col gap-0.5 p-3 pt-4">
        {sidebarLinks.map(({ href, label, icon }) => (
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
