import { supabaseAdmin } from '@/lib/supabase/admin';
import { Users, Briefcase, DollarSign, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function AdminOverview() {
  const period = new Date().toISOString().slice(0, 7);
  const [{ count: experts }, { count: customers }, { count: jobs }, { data: lb }, { data: recentJobs }] = await Promise.all([
    supabaseAdmin.from('revo_users').select('id', { count: 'exact', head: true }).eq('role', 'expert'),
    supabaseAdmin.from('revo_customers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('revo_jobs').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('revo_leaderboard').select('total_revenue, jobs_completed').eq('period', period),
    supabaseAdmin.from('revo_jobs').select('id, job_number, status, estimated_cost, created_at, revo_customers(name, city, state)').order('created_at', { ascending: false }).limit(8),
  ]);

  const networkRevenue = (lb || []).reduce((s, r) => s + Number(r.total_revenue || 0), 0);
  const networkJobs = (lb || []).reduce((s, r) => s + (r.jobs_completed || 0), 0);

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl mb-1">Admin overview</h1>
        <p className="text-[#E5E9F2]/60">Network performance for {period}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Tile icon={Users} label="Experts" value={(experts || 0).toString()} accent="gold" href="/admin/experts" />
        <Tile icon={Users} label="Customers" value={(customers || 0).toString()} accent="blue" href="/admin/customers" />
        <Tile icon={Briefcase} label="Jobs" value={(jobs || 0).toString()} accent="emerald" href="/admin/jobs" />
        <Tile icon={DollarSign} label="Network revenue" value={`$${Math.round(networkRevenue).toLocaleString()}`} accent="gold" />
        <Tile icon={Trophy} label="Jobs closed" value={networkJobs.toString()} accent="emerald" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
          <h2 className="font-display text-lg mb-4">Recent network activity</h2>
          {(recentJobs || []).length === 0 ? <p className="text-sm text-[#E5E9F2]/50">No activity yet.</p> : (
            <ul className="divide-y divide-[#E5E9F2]/5">
              {(recentJobs || []).map(j => (
                <li key={j.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono text-xs text-[#D4A24C] mr-2">{j.job_number}</span>
                    <span>{j.revo_customers?.name || 'Customer'}</span>
                    <span className="text-xs text-[#E5E9F2]/50 ml-2">· {j.status}</span>
                  </div>
                  <div className="text-[#D4A24C] font-display">{j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—'}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-[#D4A24C]" /><span className="font-display text-sm uppercase tracking-wider">Network growth</span></div>
          <div className="space-y-3 text-sm">
            <Link href="/admin/experts" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white"><span>Manage experts</span><span className="text-[#D4A24C]">→</span></Link>
            <Link href="/admin/leaderboard" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white"><span>Edit leaderboard</span><span className="text-[#D4A24C]">→</span></Link>
            <Link href="/admin/courses" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white"><span>Course modules</span><span className="text-[#D4A24C]">→</span></Link>
            <Link href="/admin/rag" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white"><span>Knowledge base</span><span className="text-[#D4A24C]">→</span></Link>
            <Link href="/admin/emails" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white"><span>Email sequences</span><span className="text-[#D4A24C]">→</span></Link>
            <Link href="/admin/analytics" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white"><span>Analytics</span><span className="text-[#D4A24C]">→</span></Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Tile({ icon: Icon, label, value, accent, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: 'gold' | 'blue' | 'emerald'; href?: string }) {
  const colors = { gold: 'text-[#D4A24C]', blue: 'text-[#3B82F6]', emerald: 'text-emerald-400' };
  const inner = (
    <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2"><span className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">{label}</span><Icon className={`w-4 h-4 ${colors[accent]}`} /></div>
      <div className={`font-display text-2xl ${colors[accent]}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
