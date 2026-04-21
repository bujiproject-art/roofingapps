"use client";

import { Home, Camera, Users, FileText, BarChart3, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesktopSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/inspection/new", icon: Camera, label: "New Inspection" },
    { href: "/crm", icon: Users, label: "CRM" },
    { href: "/history", icon: FileText, label: "History" },
    { href: "/admin", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold gold-text">RevoRoof AI</h1>
        <p className="text-xs text-gray-400 mt-1">Pro Suite</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}