"use client";

import { usePathname } from "next/navigation";
import { openTutor } from "@/components/chat/openTutor";
import { NavList } from "./nav-links";

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col border-r border-[#e4dfd7] bg-[#f5f1ec] md:flex">
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <NavList pathname={pathname} isAdmin={isAdmin} />
      </div>

      <div className="p-3 pb-4">
        <button
          type="button"
          onClick={() => openTutor()}
          aria-label="Open AI tutor"
          className="group flex w-full items-center gap-3 rounded-[10px] border border-[#e4dfd7] bg-white p-3 text-left transition-colors hover:border-[#111111]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#ff5600] text-[13px] text-white" aria-hidden>
            ✦
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-[#111111]">AI Tutor</span>
            <span className="block text-[11.5px] text-[#9c9fa5]">Stuck? Ask anything.</span>
          </span>
          <span aria-hidden className="ml-auto text-[#a8a49d] transition-transform group-hover:translate-x-0.5 group-hover:text-[#111111]">
            →
          </span>
        </button>
      </div>
    </aside>
  );
}
