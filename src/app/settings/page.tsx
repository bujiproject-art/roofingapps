"use client";

import { User, Bell, Shield, CreditCard, LogOut, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    { icon: User, title: "Profile", subtitle: "Name, email, phone, avatar" },
    { icon: Bell, title: "Notifications", subtitle: "Push, SMS, email preferences" },
    { icon: Shield, title: "Security", subtitle: "Password, 2FA, session management" },
    { icon: CreditCard, title: "Billing", subtitle: "Subscription, payment methods, invoices" },
  ];
  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gold-text mb-1">Settings</h1>
          <p className="text-gray-400">Manage your account, notifications, and billing</p>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden divide-y divide-gray-800">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.title} className="w-full flex items-center gap-4 p-4 hover:bg-gray-900/60 transition text-left">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{s.title}</p>
                  <p className="text-sm text-gray-400">{s.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            );
          })}
          <button className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 transition text-left text-red-400">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Sign Out</p>
            </div>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-8 text-center">
          Demo mode — settings are read-only. In production, updates are written to the <code className="text-[#D4AF37]">users</code> table via RLS-scoped Supabase mutations.
        </p>
      </div>
    </div>
  );
}
