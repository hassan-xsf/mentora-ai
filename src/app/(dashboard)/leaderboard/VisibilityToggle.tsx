"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toaster";
import { setLeaderboardVisibility } from "./actions";

export function VisibilityToggle({ initial }: { initial: boolean }) {
  const [show, setShow] = useState(initial);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function toggle() {
    const next = !show;
    setShow(next);
    startTransition(async () => {
      const { ok } = await setLeaderboardVisibility(next);
      if (!ok) {
        setShow(!next);
        showToast("Couldn't update your leaderboard setting", "error");
      }
    });
  }

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-[#d3cec6] bg-white px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-[#111111]">Show me on the leaderboard</span>
        <span className="block text-[12px] text-[#9c9fa5]">
          Others only ever see your first name and last initial.
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={show}
        aria-label="Show me on the leaderboard"
        disabled={pending}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          show ? "bg-[#111111]" : "bg-[#d3cec6]"
        }`}
      >
        <span
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            show ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
