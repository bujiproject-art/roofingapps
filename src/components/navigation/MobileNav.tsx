"use client";

import { Home, Camera, Users, FileText, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/inspection/new", icon: Camera, label: "Inspect" },
    { href: "/crm", icon: Users, label: "CRM" },
    { href: "/history", icon: FileText, label: "History" },
    { href: "/admin", icon: BarChart3, label: "Admin" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-gray-800 z-50">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive 
                  ? "text-[#D4AF37]" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}