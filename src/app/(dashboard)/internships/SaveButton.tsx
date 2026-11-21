"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toaster";
import { setInternshipSaved } from "./actions";

export function SaveButton({ id, initial }: { id: string; initial: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function toggle() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const { ok } = await setInternshipSaved(id, next);
      if (!ok) {
        setSaved(!next);
        showToast("Couldn't update your saved internships", "error");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save internship"}
      className={`flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[13px] font-medium transition-colors disabled:opacity-60 ${
        saved
          ? "border-[#111111] bg-[#111111] text-white"
          : "border-[#d3cec6] bg-white text-[#111111] hover:border-[#111111]"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 15 15" fill={saved ? "currentColor" : "none"} aria-hidden="true">
        <path d="M3.5 1.5h8v12l-4-3-4 3v-12z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
