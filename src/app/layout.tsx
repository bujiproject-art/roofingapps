import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RevoRoof AI — Revolution Roofing",
  description: "AI-powered roof inspection platform — Photo → Analysis → Report → Close",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
