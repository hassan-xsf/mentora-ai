"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatInput } from "@/components/chat/ChatInput";

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  function handleSend(message: string) {
    const panel = document.getElementById("chat-panel");
    if (panel) {
      type PanelEl = HTMLDivElement & { __sendMessage?: (msg: string) => Promise<void> };
      const el = panel as PanelEl;
      if (el.__sendMessage) {
        setIsStreaming(true);
        el.__sendMessage(message).finally(() => setIsStreaming(false));
      }
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-violet-700 active:scale-95"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <span className="text-lg font-bold">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl md:bottom-20 md:right-6 md:h-[520px] md:w-[380px] md:rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm">
                    ✦
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">AI Tutor</p>
                    <p className="text-xs text-gray-400">Educational assistant</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-sm"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>

              {/* Chat content */}
              <ChatPanel />

              {/* Input */}
              <ChatInput onSend={handleSend} disabled={isStreaming} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
