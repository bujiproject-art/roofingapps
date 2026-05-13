import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Sparkles } from 'lucide-react';

export default async function AdminJobs() {
  const { data: jobs } = await supabaseAdmin
    .from('revo_jobs')
    .select('*, revo_customers(name, city, state), revo_users(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  const list = jobs || [];
  const totalValue = list.reduce((s, j) => s + (Number(j.estimated_cost) || 0), 0);
  const aiAnalyzed = list.filter(j => j.drone_report).length;

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">All jobs</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{list.length} jobs · {aiAnalyzed} AI-analyzed · ${Math.round(totalValue).toLocaleString()} pipeline</p>
        </div>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Job #</th>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Expert</th>
              <th className="text-left px-6 py-3">Type</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-center px-6 py-3">AI</th>
              <th className="text-right px-6 py-3">Estimate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {list.map(j => {
              const expert = j.revo_users ? `${j.revo_users.first_name || ''} ${j.revo_users.last_name || ''}`.trim() : '—';
              return (
                <tr key={j.id} className="hover:bg-white/5">
                  <td className="px-6 py-3 font-mono text-xs text-[#D4A24C]">{j.job_number}</td>
                  <td className="px-6 py-3 text-sm">{j.revo_customers?.name || '—'}<div className="text-xs text-[#E5E9F2]/50">{[j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ')}</div></td>
                  <td className="px-6 py-3 text-xs text-[#E5E9F2]/70">{expert}</td>
                  <td className="px-6 py-3 text-xs text-[#E5E9F2]/70">{(j.job_type || '').replace(/_/g, ' ')}</td>
                  <td className="px-6 py-3"><StatusPill status={j.status} /></td>
                  <td className="px-6 py-3 text-center">{j.drone_report ? <Sparkles className="w-3.5 h-3.5 text-[#3B82F6] inline" /> : ''}</td>
                  <td className="px-6 py-3 text-right font-display text-[#D4A24C]">{j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
