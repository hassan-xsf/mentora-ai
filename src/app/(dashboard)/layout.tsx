import { AppShell } from "@/components/layout/AppShell";
import { ChatDrawer } from "@/components/layout/ChatDrawer";
import { ToastProvider } from "@/components/ui/Toaster";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
      <ChatDrawer />
    </ToastProvider>
  );
}
