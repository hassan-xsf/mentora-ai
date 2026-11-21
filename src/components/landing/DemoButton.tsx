"use client";

import { useActionState } from "react";
import { signInDemo, type ActionState } from "@/app/actions/auth";

export function DemoButton({ className }: { className: string }) {
  const [state, action, isPending] = useActionState<ActionState>(signInDemo, { error: null });
  return (
    <form action={action} className="contents">
      <button type="submit" disabled={isPending} aria-busy={isPending} className={className}>
        {isPending ? "Opening demo…" : "Try the demo"}
      </button>
      {state.error && (
        <p role="alert" className="basis-full text-[13px] text-[#c41c1c]">
          {state.error}
        </p>
      )}
    </form>
  );
}
