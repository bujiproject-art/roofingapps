// Scout-mode dashboard timeline.
//
// Renders the scout's captured leads chronologically with status pills and
// commission rollup. Replaces the operator KPI dashboard for users whose
// revo_users.role='scout'. Pure server component — fetches via supabaseAdmin
// to bypass RLS noise. The Estimator/SC/Closer/Admin pipeline data is
// summarized but read-only for scouts; they can't edit customer records.

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Camera, MapPin, ArrowRight, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface Props {
  expertId: string;
  firstName: string | null;
  serviceArea: string | null;
}

interface JobRow {
  id: string;
  job_number: string | null;
  status: string;
  job_type: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  drone_report: { urgency?: string; condition_score?: number } | null;
  revo_customers: { name: string; address: string | null; city: string | null; state: string | null } | null;
}

export default async function ScoutTimeline({ expertId, firstName, serviceArea }: Props) {
  const { data: jobs } = await supabaseAdmin
    .from('revo_jobs')
    .select(
      'id, job_number, status, job_type, estimated_cost, actual_cost, created_at, drone_report, revo_customers(name, address, city, state)',
    )
    .eq('expert_id', expertId)
    .order('created_at', { ascending: false })
    .limit(100);

  const list = (jobs as unknown as JobRow[] | null) || [];
  const scoutCount = list.length;
  const completed = list.filter((j) => j.status === 'completed');
  const inPipeline = list.filter((j) => ['analyzed', 'estimated', 'pending', 'approved', 'in_progress'].includes(j.status));

  // Placeholder commission — real ledger lands in a future dispatch.
  const estimatedCommissions = completed.reduce(
    (s, j) => s + ((Number(j.actual_cost ?? j.estimated_cost) || 0) * 0.05),
    0,
  );

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <div className="text-[#D4A24C] uppercase tracking-widest text-xs font-semibold mb-1">
          Scout Workspace
        </div>
        <h1 className="font-display text-3xl md:text-4xl">
          {firstName ? `Hey, ${firstName}.` : 'Welcome back.'}
        </h1>
        <p className="text-sm text-[#E5E9F2]/60 mt-1">
          {serviceArea ? `${serviceArea} · ` : ''}
          {scoutCount} {scoutCount === 1 ? 'property scouted' : 'properties scouted'}
        </p>
      </header>

      {/* Primary CTA — Quick Scout */}
      <Link
        href="/dashboard/scout/new"
        className="group relative block mb-8 overflow-hidden rounded-2xl border border-[#D4A24C]/40 bg-gradient-to-br from-[#D4A24C]/15 via-[#1F3C88]/10 to-[#0A0F1F] p-6 transition hover:border-[#D4A24C]/70"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A24C] to-[#E5B366] text-[#0A0F1F] shadow-lg shadow-[#D4A24C]/30">
              <Camera className="h-7 w-7" />
            </div>
            <div>
              <div className="font-display text-xl leading-tight">Quick Scout</div>
              <div className="text-xs text-[#E5E9F2]/70 mt-1">
                Stand at a property → GPS → satellite → AI scan → submit. Back office handles the rest.
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-[#D4A24C] transition group-hover:translate-x-1" />
        </div>
      </Link>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat icon={Camera} label="Scouted" value={scoutCount} />
        <Stat icon={Clock} label="In pipeline" value={inPipeline.length} />
        <Stat
          icon={DollarSign}
          label="Est. commissions"
          value={`$${Math.round(estimatedCommissions).toLocaleString()}`}
        />
      </div>

      {/* Timeline */}
      <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <div className="bg-black/30 px-6 py-3 border-b border-[#E5E9F2]/10">
          <h2 className="font-display text-lg">Your scouted properties</h2>
          <p className="text-xs text-[#E5E9F2]/50">
            Most recent first. Click a row to view the AI report (read-only — back office handles edits).
          </p>
        </div>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A24C]/10">
              <AlertCircle className="h-7 w-7 text-[#D4A24C]" />
            </div>
            <p className="text-[#E5E9F2]/60 mb-4">No scouts yet. Tap Quick Scout to capture your first property.</p>
            <Link
              href="/dashboard/scout/new"
              className="inline-block px-5 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition"
            >
              Start scouting
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#E5E9F2]/5">
            {list.map((j) => {
              const customer = j.revo_customers;
              const location = customer
                ? [customer.city, customer.state].filter(Boolean).join(', ')
                : '';
              const isCompleted = j.status === 'completed';
              const commission = isCompleted
                ? (Number(j.actual_cost ?? j.estimated_cost) || 0) * 0.05
                : null;
              return (
                <li key={j.id} className="px-6 py-4 hover:bg-white/5">
                  <Link href={`/dashboard/customers`} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-[#D4A24C]">{j.job_number || '—'}</span>
                        <StatusPill status={j.status} />
                        {j.drone_report?.urgency === 'immediate' && (
                          <span className="text-[10px] uppercase tracking-wider text-red-300 bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-sm truncate">{customer?.name || 'Property'}</div>
                      <div className="text-xs text-[#E5E9F2]/50 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {customer?.address ? `${customer.address}${location ? ' · ' + location : ''}` : (location || 'No address yet')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {commission !== null ? (
                        <div className="text-[#D4A24C] font-display text-lg flex items-center justify-end gap-1">
                          💰 ${Math.round(commission).toLocaleString()}
                        </div>
                      ) : j.estimated_cost ? (
                        <div className="text-[#E5E9F2]/60 text-sm">
                          Est. ${Number(j.estimated_cost).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-[#E5E9F2]/40 text-xs">Awaiting estimate</div>
                      )}
                      <div className="text-[10px] text-[#E5E9F2]/40 mt-1">
                        {new Date(j.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-[#E5E9F2]/40 mt-6">
        Commission estimates above use the default 5% scout rate. Final amounts post once Paul finalizes each deal.
      </p>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="p-4 bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#D4A24C] mb-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}
