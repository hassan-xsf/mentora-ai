"use client";

import { useEffect, useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyAIFeedback, submitAIFeedback, type FeedbackRating } from "@/app/actions/ai-feedback";

type Props = {
  feature: string;
  targetId: string;
  /** Pass when already known (e.g. loaded in bulk) to skip the per-widget fetch. */
  initialRating?: FeedbackRating | null;
  className?: string;
};

const MAX_COMMENT = 500;

export function AIFeedback({ feature, targetId, initialRating, className }: Props) {
  const [rating, setRating] = useState<FeedbackRating | null>(initialRating ?? null);
  const [comment, setComment] = useState("");
  const [stage, setStage] = useState<"idle" | "comment" | "done">(initialRating ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialRating !== undefined) return;
    let live = true;
    getMyAIFeedback(feature, targetId)
      .then((r) => {
        if (live && r) {
          setRating(r);
          setStage("done");
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [feature, targetId, initialRating]);

  function save(next: FeedbackRating, text?: string, nextStage: "comment" | "done" = "done") {
    const prev = rating;
    setRating(next);
    setError(null);
    startTransition(async () => {
      const res = await submitAIFeedback(feature, targetId, next, text).catch(() => ({
        ok: false as const,
        error: "Couldn't save feedback right now.",
      }));
      if (res.ok) {
        setStage(nextStage);
      } else {
        setRating(prev);
        setError(res.error);
      }
    });
  }

  const thumb = (value: FeedbackRating) => {
    const Icon = value === 1 ? ThumbsUp : ThumbsDown;
    const active = rating === value;
    return (
      <button
        type="button"
        onClick={() => save(value, undefined, "comment")}
        disabled={pending}
        aria-pressed={active}
        aria-label={value === 1 ? "Helpful" : "Not helpful"}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-[6px] border transition-colors disabled:opacity-50",
          active
            ? "border-[#111111] bg-[#111111] text-white"
            : "border-[#d3cec6] bg-white text-[#626260] hover:border-[#111111] hover:text-[#111111]"
        )}
      >
        <Icon size={12} strokeWidth={1.8} aria-hidden />
      </button>
    );
  };

  return (
    <div className={cn("text-[11px] text-[#7b7b78]", className)}>
      <div className="flex items-center gap-1.5">
        <span>{stage === "done" ? "Thanks for the feedback" : "Was this helpful?"}</span>
        {thumb(1)}
        {thumb(-1)}
      </div>

      {stage === "comment" && rating !== null && (
        <form
          className="mt-1.5 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            save(rating, comment);
          }}
        >
          <label className="sr-only" htmlFor={`fb-${feature}-${targetId}`}>
            Optional comment
          </label>
          <input
            id={`fb-${feature}-${targetId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            maxLength={MAX_COMMENT}
            placeholder={rating === 1 ? "What worked? (optional)" : "What was wrong? (optional)"}
            className="h-7 min-w-0 flex-1 rounded-[6px] border border-[#d3cec6] bg-white px-2 text-[12px] text-[#111111] outline-none focus:border-[#111111]"
          />
          <button
            type="submit"
            disabled={pending || !comment.trim()}
            className="h-7 rounded-[6px] bg-[#111111] px-2.5 text-[11px] font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => setStage("done")}
            className="h-7 px-1 text-[11px] text-[#9c9fa5] hover:text-[#111111]"
          >
            Skip
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-1 text-[11px] text-[#c41c1c]">
          {error}
        </p>
      )}
    </div>
  );
}
