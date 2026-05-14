import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Calculator, ArrowRight, ClipboardList } from 'lucide-react';

interface QueueJob {
  id: string;
  job_number: string | null;
  status: string;
  created_at: string;
  estimated_cost: number | null;
  drone_report: { urgency?: string; condition_score?: number; estimated_repair_cost_low?: number; estimated_repair_cost_high?: number } | null;
  revo_customers: { name: string; city: string | null; state: string | null } | null;
}

const PLACEHOLDER_QUEUE: QueueJob[] = [
  { id: 'demo-1', job_number: 'REVO-A4F2K1', status: 'analyzed', created_at: '2026-05-13T14:23:00Z', estimated_cost: 18400, drone_report: { urgency: 'within_30_days', condition_score: 3, estimated_repair_cost_low: 14200, estimated_repair_cost_high: 22600 }, revo_customers: { name: 'Daniel & Maria Rivera', city: 'Aurora', state: 'CO' } },
  { id: 'demo-2', job_number: 'REVO-K2P3MM', status: 'analyzed', created_at: '2026-05-13T16:11:00Z', estimated_cost: 8200, drone_report: { urgency: 'within_6_months', condition_score: 6 }, revo_customers: { name: 'Lakeside Apartments LLC', city: 'Tampa', state: 'FL' } },
  { id: 'demo-3', job_number: 'REVO-RT78QP', status: 'analyzed', created_at: '2026-05-14T08:11:00Z', estimated_cost: 450, drone_report: { urgency: 'immediate', condition_score: 2 }, revo_customers: { name: 'Westview Office Park', city: 'Denver', state: 'CO' } },
];

export default async function EstimatorQueuePage() {
  const { data } = await supabaseAdmin
    .from('revo_jobs')
    .select('id, job_number, status, created_at, estimated_cost, drone_report, revo_customers(name, city, state)')
    .eq('status', 'analyzed')
    .order('created_at', { ascending: false })
    .limit(50);

  const rows: QueueJob[] = (data && data.length > 0)
    ? data.map(j => {
        const c = (j.revo_customers as unknown);
        const customer = Array.isArray(c) ? c[0] : c;
        return { ...j, revo_customers: (customer as QueueJob['revo_customers']) } as QueueJob;
      })
    : PLACEHOLDER_QUEUE;

  const urgent = rows.filter(r => r.drone_report?.urgency === 'immediate').length;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Estimator</span>
        </div>
        <h1 className="font-display text-4xl mb-1">Estimate queue</h1>
        <p className="text-sm text-[#E5E9F2]/60">{rows.length} leads awaiting price · {urgent} urgent</p>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3 w-36">Job #</th>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3 w-24">Condition</th>
              <th className="text-left px-6 py-3 w-32">Urgency</th>
              <th className="text-right px-6 py-3 w-32">AI estimate</th>
              <th className="text-right px-6 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {rows.map(j => {
              const aiRange = j.drone_report?.estimated_repair_cost_low && j.drone_report.estimated_repair_cost_high
                ? `$${j.drone_report.estimated_repair_cost_low.toLocaleString()}–$${j.drone_report.estimated_repair_cost_high.toLocaleString()}`
                : j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—';
              const urgency = j.drone_report?.urgency || 'monitor';
              return (
                <tr key={j.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-mono text-xs text-[#D4A24C]">{j.job_number || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{j.revo_customers?.name || '—'}</div>
                    <div className="text-xs text-[#E5E9F2]/50">{[j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{j.drone_report?.condition_score ?? '—'}/10</td>
                  <td className="px-6 py-4">
                    <StatusPill status={urgency === 'immediate' ? 'rejected' : urgency === 'within_30_days' ? 'assigned' : 'analyzed'} />
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-mono text-[#D4A24C]">{aiRange}</td>
                  <td className="px-6 py-4 text-right">
                    {j.id.startsWith('demo-') ? (
                      <span className="text-xs text-[#E5E9F2]/40">demo</span>
                    ) : (
                      <Link href={`/dashboard/estimator/${j.id}`} className="inline-flex items-center gap-1 text-sm text-[#D4A24C] hover:text-[#E5B366] transition">
                        Price <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows === PLACEHOLDER_QUEUE && (
        <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#E5E9F2]/70">
            Showing a sample queue while scouts seed the pipeline. New leads appear here automatically as soon as a scout submits.
          </div>
        </div>
      )}
    </main>
  );
}
