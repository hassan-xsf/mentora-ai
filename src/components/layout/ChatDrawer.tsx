"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { OPEN_TUTOR_EVENT, type TutorContext } from "@/components/chat/openTutor";

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<TutorContext | null>(null);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<TutorContext | undefined>).detail;
      if (detail) setContext(detail);
      setIsOpen(true);
    }
    window.addEventListener(OPEN_TUTOR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TUTOR_EVENT, onOpen);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#111111] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Close AI tutor" : "Open AI tutor"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <span className="text-lg font-bold" aria-hidden>✕</span>
        ) : (
          <span className="text-lg text-[#ff5600]" aria-hidden>✦</span>
        )}
      </button>

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
              role="dialog"
              aria-label="AI tutor"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full flex-col overflow-hidden rounded-t-[16px] border border-[#d3cec6] bg-white shadow-2xl md:bottom-20 md:right-6 md:h-[560px] md:w-[400px] md:rounded-[16px]"
            >
              <div className="flex items-center justify-between border-b border-[#ebe7e1] bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#ff5600] text-[11px] font-bold text-white" aria-hidden>
                    ✦
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-[#111111]">AI Tutor</p>
                    <p className="text-[11px] text-[#9c9fa5]">Educational assistant</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-[6px] p-1.5 text-[13px] text-[#9c9fa5] hover:bg-[#f5f1ec] hover:text-[#111111]"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>

              <ChatPanel context={context} onClearContext={() => setContext(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
