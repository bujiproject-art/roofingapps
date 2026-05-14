import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Phone, ArrowRight, Trophy } from 'lucide-react';

interface CloserJob {
  id: string;
  job_number: string | null;
  status: string;
  estimated_cost: number | null;
  estimate_notes: string | null;
  drone_report: { urgency?: string; condition_score?: number } | null;
  created_at: string;
  revo_customers: { name: string; address: string | null; city: string | null; state: string | null; phone: string | null } | null;
}

const PLACEHOLDER_BOARD: CloserJob[] = [
  { id: 'demo-1', job_number: 'REVO-9XY7BB', status: 'assigned', estimated_cost: 8200, estimate_notes: 'Storm scope. Adjuster pre-approved.', drone_report: { urgency: 'within_30_days', condition_score: 5 }, created_at: '2026-05-13T11:00:00Z', revo_customers: { name: 'Ashley Park', address: '4218 Hawthorne Dr', city: 'Round Rock', state: 'TX', phone: '(512) 555-0166' } },
  { id: 'demo-2', job_number: 'REVO-BB44CC', status: 'assigned', estimated_cost: 22100, estimate_notes: 'Cash-pay possible if 5% discount offered. Customer expressed urgency.', drone_report: { urgency: 'immediate', condition_score: 2 }, created_at: '2026-05-13T13:30:00Z', revo_customers: { name: 'Greta Hollis', address: '2807 Powers Ferry Rd', city: 'Marietta', state: 'GA', phone: '(404) 555-0189' } },
  { id: 'demo-3', job_number: 'REVO-77LMNP', status: 'sold', estimated_cost: 14600, estimate_notes: 'Sold yesterday — awaiting admin finalize.', drone_report: { urgency: 'within_30_days' }, created_at: '2026-05-12T14:30:00Z', revo_customers: { name: 'Sandra Ezell', address: '912 Lakeshore Pl', city: 'Charlotte', state: 'NC', phone: '(704) 555-0123' } },
];

export default async function CloserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const myId = user?.id;

  const { data } = await supabaseAdmin
    .from('revo_jobs')
    .select('id, job_number, status, estimated_cost, estimate_notes, drone_report, created_at, revo_customers(name, address, city, state, phone)')
    .in('status', ['assigned', 'sold'])
    .eq('closer_id', myId || '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false });

  const rows: CloserJob[] = (data && data.length > 0)
    ? data.map(j => {
        const c = j.revo_customers as unknown;
        return { ...j, revo_customers: (Array.isArray(c) ? c[0] : c) as CloserJob['revo_customers'] } as CloserJob;
      })
    : PLACEHOLDER_BOARD;

  // Sort: urgent first, then by date
  rows.sort((a, b) => {
    const aUrgent = a.drone_report?.urgency === 'immediate' ? 0 : 1;
    const bUrgent = b.drone_report?.urgency === 'immediate' ? 0 : 1;
    if (aUrgent !== bUrgent) return aUrgent - bUrgent;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const assignedCount = rows.filter(r => r.status === 'assigned').length;
  const soldCount = rows.filter(r => r.status === 'sold').length;
  const totalPipeline = rows.filter(r => r.status === 'assigned').reduce((s, r) => s + (Number(r.estimated_cost) || 0), 0);

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Closer</span>
        </div>
        <h1 className="font-display text-4xl mb-1">My deals</h1>
        <p className="text-sm text-[#E5E9F2]/60">{assignedCount} active · {soldCount} sold awaiting finalize · ${totalPipeline.toLocaleString()} pipeline</p>
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
                <div className="text-xs text-[#E5E9F2]/55">
                  {[j.revo_customers?.address, j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ')}
                </div>
                {j.revo_customers?.phone && (
                  <a href={`tel:${j.revo_customers.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#D4A24C] hover:text-[#E5B366]">
                    <Phone className="w-3.5 h-3.5" /> {j.revo_customers.phone}
                  </a>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">Quoted total</div>
                <div className="font-display text-2xl text-[#D4A24C]">${Number(j.estimated_cost || 0).toLocaleString()}</div>
              </div>
            </header>

            {j.estimate_notes && (
              <p className="text-sm text-[#E5E9F2]/80 border-l-2 border-[#D4A24C]/30 pl-3 mb-4">{j.estimate_notes}</p>
            )}

            {j.id.startsWith('demo-') ? (
              <div className="text-xs text-[#E5E9F2]/40">Demo card — live actions activate once SC assigns you a real deal.</div>
            ) : (
              <Link href={`/dashboard/closer/${j.id}`} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
                Open actions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </article>
        ))}
      </div>

      {rows === PLACEHOLDER_BOARD && (
        <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
          <Trophy className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#E5E9F2]/70">
            Showing a sample board so you can see how it'll look. Real deals land here as the sales coordinator assigns them to you.
          </div>
        </div>
      )}
    </main>
  );
}
