import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { CreditsBadge } from "@/components/credits/CreditsBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar credits={<CreditsBadge />} notifications={<NotificationBell />} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
