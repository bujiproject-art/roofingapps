'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, GraduationCap, MessageSquare, Trophy, HelpCircle, MessageCircleQuestion, User, Settings, Shield, FileText, Mail, BarChart3, Home, LogOut, Menu, X, Wand2, Calculator, ClipboardList, MapPin, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EXPERT_NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/roof-analyze', label: 'AI Roof Analysis', icon: Wand2 },
  { href: '/dashboard/courses', label: 'Course', icon: GraduationCap },
  { href: '/dashboard/chatbot', label: 'Ask Revo AI', icon: MessageCircleQuestion },
  { href: '/dashboard/community', label: 'Community', icon: MessageSquare },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
];

// Estimator nav reuses /dashboard/* pages where they already exist (Customers,
// AI Roof Analysis, FAQ, Profile). Only the estimator-specific surfaces
// (Overview, Estimates, New) live under /estimator.
const ESTIMATOR_NAV = [
  { href: '/estimator', label: 'Overview', icon: LayoutDashboard },
  { href: '/estimator/estimates', label: 'My Estimates', icon: ClipboardList },
  { href: '/estimator/new', label: 'New Estimate', icon: Calculator },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/roof-analyze', label: 'AI Roof Analysis', icon: Wand2 },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
];

// Scout nav — field-only role per Iteration 3. Sees their captured leads,
// the AI scanner, and their profile. No customer-management surfaces — those
// require can_manage_customers=true (enforced by RLS, mirrored in nav here).
const SCOUT_NAV = [
  { href: '/dashboard', label: 'My Leads', icon: LayoutDashboard },
  { href: '/dashboard/scout/new', label: 'Quick Scout', icon: Camera },
  { href: '/dashboard/roof-analyze', label: 'AI Roof Analysis', icon: Wand2 },
  { href: '/dashboard/courses', label: 'Course', icon: GraduationCap },
  { href: '/dashboard/chatbot', label: 'Ask Revo AI', icon: MessageCircleQuestion },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
];

// Sales Coordinator nav — Iteration 3 P3
const SALES_COORD_NAV = [
  { href: '/dashboard/sales-coordinator', label: 'Assign Queue', icon: ClipboardList },
  { href: '/dashboard/closer', label: 'Active Deals', icon: Briefcase },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
];

// Closer nav — Iteration 3 P3
const CLOSER_NAV = [
  { href: '/dashboard/closer', label: 'My Deals', icon: Briefcase },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/chatbot', label: 'Ask Revo AI', icon: MessageCircleQuestion },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
];

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/experts', label: 'Experts', icon: Users },
  { href: '/admin/customers', label: 'All Customers', icon: Users },
  { href: '/admin/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/admin/rag', label: 'Knowledge Base', icon: FileText },
  { href: '/admin/emails', label: 'Emails', icon: Mail },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export type SidebarVariant = 'expert' | 'admin' | 'estimator' | 'scout' | 'sales_coordinator' | 'closer';

export function Sidebar({ variant, userName, role, availableRoles }: { variant: SidebarVariant; userName: string; role: string; availableRoles?: SidebarVariant[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav =
    variant === 'admin' ? ADMIN_NAV
    : variant === 'estimator' ? ESTIMATOR_NAV
    : variant === 'scout' ? SCOUT_NAV
    : variant === 'sales_coordinator' ? SALES_COORD_NAV
    : variant === 'closer' ? CLOSER_NAV
    : EXPERT_NAV;
  const variantLabel =
    variant === 'admin' ? 'Admin'
    : variant === 'estimator' ? 'Estimator'
    : variant === 'scout' ? 'Scout'
    : variant === 'sales_coordinator' ? 'Sales Coord'
    : variant === 'closer' ? 'Closer'
    : 'Expert';

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const NavBody = (
    <>
      <div className="p-5 border-b border-[#E5E9F2]/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold text-lg shadow-lg shadow-[#D4A24C]/20 group-hover:scale-105 transition-transform">R</div>
          <div>
            <div className="font-display text-sm">Revo Roofing</div>
            <div className="text-[10px] uppercase tracking-widest text-[#D4A24C]">{variantLabel}</div>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} className="md:hidden text-[#E5E9F2]/60 hover:text-white p-1" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? 'bg-[#D4A24C]/10 text-[#D4A24C] border-l-2 border-[#D4A24C]' : 'text-[#E5E9F2]/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {role === 'admin' && variant === 'expert' && (
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#3B82F6] hover:bg-white/5 mt-4 border-t border-[#E5E9F2]/10 pt-4">
            <Shield className="w-4 h-4 shrink-0" />
            Switch to Admin
          </Link>
        )}
        {role === 'admin' && variant === 'admin' && (
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#D4A24C] hover:bg-white/5 mt-4 border-t border-[#E5E9F2]/10 pt-4">
            <Home className="w-4 h-4 shrink-0" />
            Switch to Expert View
          </Link>
        )}
        {availableRoles && availableRoles.length > 1 && (
          <RoleSwitcher current={variant} available={availableRoles} />
        )}
      </nav>

      <div className="p-4 border-t border-[#E5E9F2]/10">
        <div className="text-sm mb-2 truncate">{userName}</div>
        <button onClick={signOut} className="flex items-center gap-2 text-xs text-[#E5E9F2]/50 hover:text-white transition">
          <LogOut className="w-3 h-3" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0A0F1F]/95 backdrop-blur-md border-b border-[#E5E9F2]/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold">R</div>
          <div>
            <div className="font-display text-sm leading-tight">Revo Roofing</div>
            <div className="text-[9px] uppercase tracking-widest text-[#D4A24C] leading-tight">{variantLabel}</div>
          </div>
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-[#E5E9F2]/80 hover:text-white hover:bg-white/5 transition" aria-label="Open menu" aria-expanded={open}>
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex w-64 bg-[#0A0F1F] border-r border-[#E5E9F2]/10 flex-col min-h-screen sticky top-0 max-h-screen">
        {NavBody}
      </aside>

      {/* Mobile drawer overlay */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <aside className={`absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#0A0F1F] border-r border-[#E5E9F2]/10 flex flex-col shadow-2xl shadow-black/50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          {NavBody}
        </aside>
      </div>
    </>
  );
}

const ROLE_DESTS: Record<SidebarVariant, { href: string; label: string }> = {
  expert: { href: '/dashboard', label: 'Expert workspace' },
  scout: { href: '/dashboard', label: 'Scout workspace' },
  estimator: { href: '/dashboard/estimator', label: 'Estimator workspace' },
  sales_coordinator: { href: '/dashboard/sales-coordinator', label: 'Sales Coordinator' },
  closer: { href: '/dashboard/closer', label: 'Closer workspace' },
  admin: { href: '/admin', label: 'Admin' },
};

function RoleSwitcher({ current, available }: { current: SidebarVariant; available: SidebarVariant[] }) {
  return (
    <div className="mt-4 border-t border-[#E5E9F2]/10 pt-4">
      <div className="px-3 text-[10px] uppercase tracking-widest text-[#E5E9F2]/50 mb-2">Switch role</div>
      {available.filter(r => r !== current).map(r => (
        <Link key={r} href={ROLE_DESTS[r].href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#E5E9F2]/65 hover:bg-white/5 hover:text-white transition">
          <Home className="w-3.5 h-3.5 shrink-0" />
          {ROLE_DESTS[r].label}
        </Link>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, cta }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-[#E5E9F2]/20 rounded-2xl p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-4 text-[#E5E9F2]/30" />
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-[#E5E9F2]/60 text-sm mb-6 max-w-md mx-auto">{body}</p>
      {cta}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    lead: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    scheduled: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    inspected: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    proposal_sent: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    signed: 'bg-[#D4A24C]/20 text-[#D4A24C] border-[#D4A24C]/40',
    in_progress: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    lost: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    pending: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    approved: 'bg-[#D4A24C]/20 text-[#D4A24C] border-[#D4A24C]/40',
    cancelled: 'bg-red-500/10 text-red-300 border-red-500/30',
    // Iteration 3 pipeline statuses
    analyzed: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    estimated: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    assigned: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    sold: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
  };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-white/5 text-white/70 border-white/20'}`}>{status.replace(/_/g, ' ')}</span>;
}
