import { AppShell } from "@/components/layout/AppShell";
import { ChatDrawer } from "@/components/layout/ChatDrawer";
import { ToastProvider } from "@/components/ui/Toaster";
import { StudyTimeTracker } from "@/components/progress/StudyTimeTracker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
      <ChatDrawer />
      <StudyTimeTracker />
    </ToastProvider>
  );
}
