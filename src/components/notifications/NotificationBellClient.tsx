"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import type { Notification, NotificationType } from "@/types";

const TYPE_ICON: Record<NotificationType, string> = {
  certificate: "🎓",
  milestone: "🎯",
  badge: "🏆",
  credits: "✦",
  system: "•",
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

type Props = {
  notifications: Notification[];
  unreadCount: number;
};

export function NotificationBellClient({ notifications, unreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Click-away + Escape close.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"
        }
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-[#626260] transition-colors hover:bg-[#ebe7e1] hover:text-[#111111]"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5600] px-1 text-[9px] font-bold tabular-nums text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-10 z-50 w-[320px] overflow-hidden rounded-[10px] border border-[#d3cec6] bg-white shadow-[0_18px_50px_-12px_rgba(17,17,17,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-[#f0ece5] px-3.5 py-2.5">
              <p className="text-[12.5px] font-semibold text-[#111111]">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => startTransition(() => markAllNotificationsRead())}
                  className="text-[11.5px] font-medium text-[#9c9fa5] transition-colors hover:text-[#111111]"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12.5px] text-[#9c9fa5]">Nothing here yet.</p>
                <p className="mt-1 text-[11.5px] text-[#c9c3ba]">
                  Milestones and certificates will show up here.
                </p>
              </div>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto">
                {notifications.map((n) => {
                  const body = (
                    <div className="flex gap-2.5">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[#f0ece5] text-[11px]"
                        aria-hidden
                      >
                        {TYPE_ICON[n.type] ?? "•"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium leading-snug text-[#111111]">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-[11.5px] leading-snug text-[#8a8d93]">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-[10.5px] text-[#c9c3ba]">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5600]" />
                      )}
                    </div>
                  );

                  return (
                    <li key={n.id} className="border-b border-[#f5f1ec] last:border-b-0">
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => {
                            setOpen(false);
                            if (!n.is_read) {
                              startTransition(() => markNotificationRead(n.id));
                            }
                          }}
                          className={`block px-3.5 py-3 transition-colors hover:bg-[#faf8f4] ${
                            n.is_read ? "" : "bg-[#fffaf7]"
                          }`}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div
                          className={`px-3.5 py-3 ${n.is_read ? "" : "bg-[#fffaf7]"}`}
                        >
                          {body}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5a4 4 0 00-4 4v2.6L2.8 10.3a.6.6 0 00.5.9h9.4a.6.6 0 00.5-.9L12 8.1V5.5a4 4 0 00-4-4z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.4 13a1.7 1.7 0 003.2 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
