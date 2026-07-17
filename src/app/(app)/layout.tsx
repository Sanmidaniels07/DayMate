"use client";

import { AuthGuard } from "@/components/features/auth-guard";
import { AppNav } from "@/components/features/app-nav";
import { CallManager } from "@/components/features/call-manager";
import { TopNav } from "@/components/features/top-nav";
import { usePathname } from "next/navigation";

const FULLSCREEN_CHAT = /^\/chat\/[^/]+$/;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenChat = FULLSCREEN_CHAT.test(pathname);

  return (
    <AuthGuard>
      <div className="min-h-dvh lg:pl-24">
        <AppNav />
        <CallManager />
        {!isFullScreenChat && <TopNav />}

        {isFullScreenChat ? (
          
          <div className="h-dvh lg:h-screen">{children}</div>
        ) : (
          // Bottom padding clears the mobile nav; desktop clears the rail via pl
          <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
            {children}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}