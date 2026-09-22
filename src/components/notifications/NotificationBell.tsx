import { requireUser } from "@/lib/auth/session";
import { getNotifications, getUnreadCount } from "@/lib/db/notifications";
import { NotificationBellClient } from "./NotificationBellClient";

/**
 * Server component — re-reads on every render, so the badge is honest right
 * after an action that created a notification.
 */
export async function NotificationBell() {
  const user = await requireUser();
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(user.id),
    getUnreadCount(user.id),
  ]);

  return (
    <NotificationBellClient notifications={notifications} unreadCount={unreadCount} />
  );
}
