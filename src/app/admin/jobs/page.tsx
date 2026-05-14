import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Sparkles, Briefcase } from 'lucide-react';

interface JobRow {
  id: string;
  job_number: string | null;
  status: string;
  job_type: string | null;
  estimated_cost: number | null;
  drone_report: { urgency?: string } | null;
  created_at: string;
  customer_name: string;
  city: string | null;
  state: string | null;
  expert_name: string;
}

const PLACEHOLDER_JOBS: JobRow[] = [
  { id: 'demo-1', job_number: 'REVO-A4F2K1', status: 'in_progress', job_type: 'full_replacement', estimated_cost: 18400, drone_report: { urgency: 'within_30_days' }, created_at: '2026-05-04T10:00:00Z', customer_name: 'Daniel & Maria Rivera', city: 'Aurora', state: 'CO', expert_name: 'TJ Morgan' },
  { id: 'demo-2', job_number: 'REVO-9XY7BB', status: 'estimated', job_type: 'storm_damage', estimated_cost: 8200, drone_report: { urgency: 'within_30_days' }, created_at: '2026-05-06T14:11:00Z', customer_name: 'Ashley Park', city: 'Round Rock', state: 'TX', expert_name: 'Sasha Lopez' },
  { id: 'demo-3', job_number: 'REVO-K2P3MM', status: 'analyzed', job_type: 'inspection', estimated_cost: 450, drone_report: { urgency: 'immediate' }, created_at: '2026-05-07T09:00:00Z', customer_name: 'Lakeside Apartments LLC', city: 'Tampa', state: 'FL', expert_name: 'Mike Barron' },
  { id: 'demo-4', job_number: 'REVO-1QW55T', status: 'completed', job_type: 'repair', estimated_cost: 6300, drone_report: null, created_at: '2026-04-20T11:30:00Z', customer_name: 'Maya Patel', city: 'Austin', state: 'TX', expert_name: 'Sasha Lopez' },
  { id: 'demo-5', job_number: 'REVO-BB44CC', status: 'sold', job_type: 'full_replacement', estimated_cost: 22100, drone_report: { urgency: 'immediate' }, created_at: '2026-04-29T16:40:00Z', customer_name: 'Greta Hollis', city: 'Marietta', state: 'GA', expert_name: 'Darius Washington' },
  { id: 'demo-6', job_number: 'REVO-RT78QP', status: 'assigned', job_type: 'inspection', estimated_cost: 450, drone_report: { urgency: 'immediate' }, created_at: '2026-05-10T13:22:00Z', customer_name: 'Westview Office Park', city: 'Denver', state: 'CO', expert_name: 'TJ Morgan' },
];

export default async function AdminJobs() {
  const { data: real } = await supabaseAdmin
    .from('revo_jobs')
    .select('id, job_number, status, job_type, estimated_cost, drone_report, created_at, revo_customers(name, city, state), revo_users!expert_id(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  let list: JobRow[];
  if (real && real.length > 0) {
    list = real.map(j => {
      const c = j.revo_customers as unknown;
      const u = j.revo_users as unknown;
      const cust = Array.isArray(c) ? c[0] : c;
      const user = Array.isArray(u) ? u[0] : u;
      return {
        id: j.id,
        job_number: j.job_number,
        status: j.status,
        job_type: j.job_type,
        estimated_cost: j.estimated_cost,
        drone_report: j.drone_report as { urgency?: string } | null,
        created_at: j.created_at,
        customer_name: (cust as { name?: string })?.name || '—',
        city: (cust as { city?: string | null })?.city || null,
        state: (cust as { state?: string | null })?.state || null,
        expert_name: user ? `${(user as { first_name?: string }).first_name || ''} ${(user as { last_name?: string }).last_name || ''}`.trim() || '—' : '—',
      } as JobRow;
    });
  } else {
    list = PLACEHOLDER_JOBS;
  }

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
              <th className="text-left px-6 py-3 w-36">Job #</th>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Expert</th>
              <th className="text-left px-6 py-3 w-36">Type</th>
              <th className="text-left px-6 py-3 w-32">Status</th>
              <th className="text-center px-6 py-3 w-16">AI</th>
              <th className="text-right px-6 py-3 w-28">Estimate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {list.map(j => (
              <tr key={j.id} className="hover:bg-white/5">
                <td className="px-6 py-3 font-mono text-xs text-[#D4A24C]">{j.job_number}</td>
                <td className="px-6 py-3 text-sm">
                  {j.customer_name}
                  <div className="text-xs text-[#E5E9F2]/50">{[j.city, j.state].filter(Boolean).join(', ')}</div>
                </td>
                <td className="px-6 py-3 text-xs text-[#E5E9F2]/75">{j.expert_name}</td>
                <td className="px-6 py-3 text-xs text-[#E5E9F2]/70 capitalize">{(j.job_type || '').replace(/_/g, ' ')}</td>
                <td className="px-6 py-3"><StatusPill status={j.status} /></td>
                <td className="px-6 py-3 text-center">{j.drone_report ? <Sparkles className="w-3.5 h-3.5 text-[#3B82F6] inline" /> : ''}</td>
                <td className="px-6 py-3 text-right text-sm font-display text-[#D4A24C]">{j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {list === PLACEHOLDER_JOBS && (
        <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
          <Briefcase className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#E5E9F2]/70">Showing a sample board. Live activity appears as soon as scouts capture leads.</div>
        </div>
      )}
    </main>
  );
}
