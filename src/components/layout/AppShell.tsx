"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/navigation/MobileNav";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

const CHROMELESS_PATHS = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chromeless = CHROMELESS_PATHS.some((p) => pathname?.startsWith(p));

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <>
      <OfflineBanner />
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />
        <main className="flex-1 overflow-y-auto bg-black relative">
          <div className="pb-20 md:pb-0">{children}</div>
        </main>
        <MobileNav />
      </div>
    </>
  );
}
