import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { CreditsBadge } from "@/components/credits/CreditsBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/session";

type Props = {
  children: React.ReactNode;
};

export async function AppShell({ children }: Props) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar credits={<CreditsBadge />} notifications={<NotificationBell />} isAdmin={isAdminEmail(user?.email)} />
      <div className="flex flex-1">
        <Sidebar isAdmin={isAdminEmail(user?.email)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
