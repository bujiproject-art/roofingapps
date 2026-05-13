import { supabaseAdmin } from '@/lib/supabase/admin';
import { Users, Briefcase, DollarSign, Sparkles, TrendingUp } from 'lucide-react';

export default async function AdminAnalytics() {
  const period = new Date().toISOString().slice(0, 7);
  const [{ count: experts }, { count: customers }, { count: jobs }, { data: jobsData }, { data: lb }] = await Promise.all([
    supabaseAdmin.from('revo_users').select('id', { count: 'exact', head: true }).eq('role', 'expert'),
    supabaseAdmin.from('revo_customers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('revo_jobs').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('revo_jobs').select('status, estimated_cost, actual_cost, drone_report, job_type'),
    supabaseAdmin.from('revo_leaderboard').select('total_revenue, jobs_completed').eq('period', period),
  ]);

  const list = jobsData || [];
  const aiAnalyzed = list.filter(j => j.drone_report).length;
  const completed = list.filter(j => j.status === 'completed');
  const closedRevenue = completed.reduce((s, j) => s + (Number(j.actual_cost ?? j.estimated_cost) || 0), 0);
  const pipeline = list.filter(j => ['pending','approved','in_progress'].includes(j.status)).reduce((s, j) => s + (Number(j.estimated_cost) || 0), 0);
  const networkRev = (lb || []).reduce((s, r) => s + Number(r.total_revenue || 0), 0);

  const byType = list.reduce<Record<string, number>>((acc, j) => {
    const k = j.job_type || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl mb-1">Analytics</h1>
        <p className="text-[#E5E9F2]/60 text-sm">Network performance · {period}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Tile icon={Users} label="Experts" value={(experts || 0).toString()} />
        <Tile icon={Users} label="Customers" value={(customers || 0).toString()} />
        <Tile icon={Briefcase} label="Jobs" value={(jobs || 0).toString()} />
        <Tile icon={Sparkles} label="AI analyses" value={aiAnalyzed.toString()} accent="blue" />
        <Tile icon={DollarSign} label="Network revenue" value={`$${Math.round(networkRev).toLocaleString()}`} accent="emerald" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
          <h2 className="font-display text-lg mb-4">Pipeline vs Closed</h2>
          <div className="space-y-3">
            <Bar label="Active pipeline" value={pipeline} max={Math.max(pipeline, closedRevenue, 1)} color="bg-[#3B82F6]" />
            <Bar label="Closed revenue" value={closedRevenue} max={Math.max(pipeline, closedRevenue, 1)} color="bg-emerald-500" />
          </div>
          <p className="text-xs text-[#E5E9F2]/50 mt-4">Closed/pipeline ratio: {pipeline > 0 ? `${((closedRevenue/pipeline)*100).toFixed(0)}%` : '—'}</p>
        </section>

        <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
          <h2 className="font-display text-lg mb-4">Jobs by type</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="capitalize">{k.replace(/_/g, ' ')}</span><span className="text-[#D4A24C] font-display">{v}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Tile({ icon: Icon, label, value, accent = 'gold' }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: 'gold' | 'blue' | 'emerald' }) {
  const colors = { gold: 'text-[#D4A24C]', blue: 'text-[#3B82F6]', emerald: 'text-emerald-400' };
  return (
    <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2"><span className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">{label}</span><Icon className={`w-4 h-4 ${colors[accent]}`} /></div>
      <div className={`font-display text-2xl ${colors[accent]}`}>{value}</div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="text-[#D4A24C] font-display">${Math.round(value).toLocaleString()}</span></div>
      <div className="h-2 bg-black/30 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
