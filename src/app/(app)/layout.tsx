import { AuthGuard } from '@/components/features/auth-guard';
import { AppNav } from '@/components/features/app-nav';
import { CallManager } from '@/components/features/call-manager';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh lg:pl-24">
        <AppNav />
        <CallManager />
        {/* Bottom padding clears the mobile nav; desktop clears the rail via pl */}
        <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 lg:pb-10">{children}</div>
      </div>
    </AuthGuard>
  );
}