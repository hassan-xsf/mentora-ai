"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { studyKindForPath } from "./study-kind";

const TICK_MS = 5_000;
// Reading a long article without touching anything still counts, up to this.
const IDLE_AFTER_MS = 3 * 60_000;

/**
 * Counts time that is both visible and recently active on learning pages and
 * reports it one minute at a time. The server dedupes per user, so several
 * open tabs can't add up to more than real time.
 */
export function StudyTimeTracker() {
  const pathname = usePathname();
  const kindRef = useRef(studyKindForPath(pathname));
  useEffect(() => {
    kindRef.current = studyKindForPath(pathname);
  }, [pathname]);

  useEffect(() => {
    let lastActive = Date.now();
    let activeMs = 0;
    const markActive = () => {
      lastActive = Date.now();
    };
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const timer = window.setInterval(() => {
      const kind = kindRef.current;
      if (!kind || document.visibilityState !== "visible") return;
      if (Date.now() - lastActive > IDLE_AFTER_MS) return;
      activeMs += TICK_MS;
      if (activeMs < 60_000) return;
      activeMs -= 60_000;
      fetch("/api/study-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
        keepalive: true,
      }).catch(() => {});
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, []);

  return null;
}
