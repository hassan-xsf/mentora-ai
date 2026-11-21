"use client";

import { useState, useRef } from "react";

// Mirrors MAX_MESSAGE_CHARS in /api/chat, which enforces it.
const MAX_CHARS = 4000;

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-[#ebe7e1] bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={MAX_CHARS}
          aria-label="Message the AI tutor"
          placeholder="Ask about your learning… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 resize-none rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-3 py-2 text-[13px] text-[#111111] outline-none placeholder:text-[#9c9fa5] focus:border-[#111111] focus:bg-white disabled:opacity-50"
          style={{ maxHeight: "120px" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#111111] text-white transition-colors hover:bg-black disabled:opacity-40"
          aria-label="Send message"
        >
          <svg className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      {value.length > MAX_CHARS * 0.8 && (
        <p className="mt-1 text-right text-[11px] text-[#9c9fa5]">
          {value.length}/{MAX_CHARS}
        </p>
      )}
    </div>
  );
}
