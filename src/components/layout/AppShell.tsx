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
  const email = user?.email ?? "";
  const name = (user?.user_metadata?.full_name as string | undefined)?.trim() || email.split("@")[0] || "Student";
  const isAdmin = isAdminEmail(email);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar credits={<CreditsBadge />} notifications={<NotificationBell />} isAdmin={isAdmin} account={{ name, email }} />
      <div className="flex flex-1">
        <Sidebar isAdmin={isAdmin} />
        {/* pb-24 keeps the floating tutor button off the last row; full-height pages (data-fullbleed) opt out */}
        <main className="min-w-0 flex-1 pb-24 has-[[data-fullbleed]]:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
