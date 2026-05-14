import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Users, ClipboardList } from 'lucide-react';
import AssignCloserForm from './_components/AssignCloserForm';

interface QueueJob {
  id: string;
  job_number: string | null;
  status: string;
  estimated_cost: number | null;
  estimate_notes: string | null;
  created_at: string;
  drone_report: { urgency?: string; condition_score?: number } | null;
  revo_customers: { name: string; city: string | null; state: string | null; phone: string | null } | null;
}

interface CloserOption {
  id: string;
  name: string;
  active_load: number;
}

const PLACEHOLDER_QUEUE: QueueJob[] = [
  { id: 'demo-1', job_number: 'REVO-9XY7BB', status: 'estimated', estimated_cost: 8200, estimate_notes: 'Storm-only scope. Adjuster approved supplement for ice-and-water at eaves.', created_at: '2026-05-13T11:00:00Z', drone_report: { urgency: 'within_30_days', condition_score: 5 }, revo_customers: { name: 'Ashley Park', city: 'Round Rock', state: 'TX', phone: '(512) 555-0166' } },
  { id: 'demo-2', job_number: 'REVO-BB44CC', status: 'estimated', estimated_cost: 22100, estimate_notes: 'High-margin full replacement. Customer indicated they will pay cash if discount offered.', created_at: '2026-05-13T13:30:00Z', drone_report: { urgency: 'immediate', condition_score: 2 }, revo_customers: { name: 'Greta Hollis', city: 'Marietta', state: 'GA', phone: '(404) 555-0189' } },
  { id: 'demo-3', job_number: 'REVO-1QW55T', status: 'estimated', estimated_cost: 6300, estimate_notes: 'Insurance-claim, 50/50 ACV/depreciation. Closer needs to confirm deductible coverage.', created_at: '2026-05-13T16:45:00Z', drone_report: { urgency: 'within_6_months', condition_score: 6 }, revo_customers: { name: 'Maya Patel', city: 'Austin', state: 'TX', phone: '(512) 555-0301' } },
];

const PLACEHOLDER_CLOSERS: CloserOption[] = [
  { id: 'demo-c1', name: 'Renzo Hayes', active_load: 4 },
  { id: 'demo-c2', name: 'Ari Vasquez', active_load: 6 },
  { id: 'demo-c3', name: 'Brett Stockton', active_load: 2 },
];

export default async function SalesCoordinatorPage() {
  const [{ data: jobs }, { data: closers }] = await Promise.all([
    supabaseAdmin
      .from('revo_jobs')
      .select('id, job_number, status, estimated_cost, estimate_notes, created_at, drone_report, revo_customers(name, city, state, phone)')
      .eq('status', 'estimated')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('revo_users')
      .select('id, first_name, last_name')
      .or('role.eq.closer,role.eq.admin')
      .eq('status', 'active'),
  ]);

  const rows: QueueJob[] = (jobs && jobs.length > 0)
    ? jobs.map(j => {
        const c = j.revo_customers as unknown;
        const customer = Array.isArray(c) ? c[0] : c;
        return { ...j, revo_customers: customer as QueueJob['revo_customers'] } as QueueJob;
      })
    : PLACEHOLDER_QUEUE;

  const closerOptions: CloserOption[] = (closers && closers.length > 0)
    ? await Promise.all(closers.map(async (u) => {
        const { count } = await supabaseAdmin.from('revo_jobs').select('id', { count: 'exact', head: true }).eq('closer_id', u.id).in('status', ['assigned', 'sold']);
        return {
          id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Closer',
          active_load: count || 0,
        };
      }))
    : PLACEHOLDER_CLOSERS;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Sales coordinator</span>
        </div>
        <h1 className="font-display text-4xl mb-1">Assign queue</h1>
        <p className="text-sm text-[#E5E9F2]/60">{rows.length} priced leads awaiting closer assignment · {closerOptions.length} active closers</p>
      </header>

      <div className="space-y-4">
        {rows.map(j => (
          <article key={j.id} className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-5">
            <header className="flex items-start justify-between gap-4 mb-3 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-mono text-xs text-[#D4A24C]">{j.job_number}</span>
                  <StatusPill status={j.status} />
                  {j.drone_report?.urgency === 'immediate' && (
                    <span className="text-[10px] uppercase tracking-wider text-red-300 bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5">Urgent</span>
                  )}
                </div>
                <h3 className="font-display text-xl">{j.revo_customers?.name}</h3>
                <div className="text-xs text-[#E5E9F2]/55">{[j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ')} · {j.revo_customers?.phone || 'no phone'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">Customer total</div>
                <div className="font-display text-2xl text-[#D4A24C]">${Number(j.estimated_cost || 0).toLocaleString()}</div>
              </div>
            </header>
            {j.estimate_notes && (
              <p className="text-sm text-[#E5E9F2]/80 border-l-2 border-[#D4A24C]/30 pl-3 mb-4">{j.estimate_notes}</p>
            )}
            {j.id.startsWith('demo-') ? (
              <div className="text-xs text-[#E5E9F2]/40">Demo row — real Assign button activates once scouts seed the pipeline.</div>
            ) : (
              <AssignCloserForm jobId={j.id} closers={closerOptions} />
            )}
          </article>
        ))}
      </div>

      {rows === PLACEHOLDER_QUEUE && (
        <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#E5E9F2]/70">
            Showing a sample queue. New estimated leads will arrive automatically and live Assign actions kick in.
          </div>
        </div>
      )}
    </main>
  );
}
