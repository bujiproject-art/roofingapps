import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/navigation/MobileNav";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RevoRoof AI Pro Suite",
  description: "AI-powered roof inspection platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <OfflineBanner />
        <div className="flex h-screen overflow-hidden">
          <DesktopSidebar />
          <main className="flex-1 overflow-y-auto bg-black relative">
            <div className="pb-20 md:pb-0">
              {children}
            </div>
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}