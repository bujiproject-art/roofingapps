import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ClipboardList, Calculator, Wand2, DollarSign, ArrowRight, AlertCircle, Sparkles, MapPin } from 'lucide-react';
import { StatusPill } from '@/components/RevoUI';

interface AnalyzedLead {
  id: string;
  job_number: string | null;
  customer_id: string;
  created_at: string;
  job_type: string | null;
  estimated_cost: number | null;
  drone_report: { urgency?: string; condition_score?: number; estimated_repair_cost_low?: number; estimated_repair_cost_high?: number } | null;
  revo_customers: { name: string; address: string | null; city: string | null; state: string | null } | null;
}

export default async function EstimatorOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Iteration 3 — primary view is the queue of `Analyzed` leads waiting for
  // pricing. Falls back to my-own-drafts list as a secondary section so the
  // estimator who builds a quote from scratch still has a workspace.
  const [{ data: analyzedRaw }, { data: assigned }, { data: drafts }] = await Promise.all([
    supabaseAdmin
      .from('revo_jobs')
      .select('id, job_number, customer_id, created_at, job_type, estimated_cost, drone_report, revo_customers(name, address, city, state)')
      .eq('status', 'analyzed')
      .order('created_at', { ascending: true })
      .limit(50),
    supabaseAdmin
      .from('revo_jobs')
      .select('*, revo_customers(name, address, city, state)')
      .eq('estimator_id', user.id)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('revo_jobs')
      .select('id, job_number, estimated_cost, status, created_at')
      .eq('estimator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const analyzedLeads = (analyzedRaw as unknown as AnalyzedLead[] | null) || [];
  const assignedList = assigned || [];
  const draftList = drafts || [];
  const pipelineValue = draftList.reduce((s, j) => s + (Number(j.estimated_cost) || 0), 0);
  const submitted = draftList.filter((j) => j.status !== 'pending').length;

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="text-[#D4A24C] uppercase tracking-widest text-xs font-semibold mb-1">Estimator workspace</div>
        <h1 className="font-display text-3xl md:text-4xl">Your estimates</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={AlertCircle} label="Awaiting pricing" value={analyzedLeads.length} suffix="scout-captured leads" />
        <Stat icon={ClipboardList} label="Assigned to me" value={assignedList.length} />
        <Stat icon={Calculator} label="Total estimates" value={draftList.length} suffix={`${submitted} submitted`} />
        <Stat icon={DollarSign} label="Pipeline value" value={`$${Math.round(pipelineValue).toLocaleString()}`} />
      </div>

      {/* PRIMARY: Analyzed leads queue (Iteration 3 §8) */}
      <section className="bg-[#0F1729] border border-[#D4A24C]/30 rounded-xl overflow-hidden mb-10">
        <div className="bg-gradient-to-r from-[#D4A24C]/15 to-transparent px-6 py-4 border-b border-[#D4A24C]/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-1">Iteration 3 Pipeline</div>
            <h2 className="font-display text-xl">Analyzed leads — awaiting your pricing</h2>
            <p className="text-xs text-[#E5E9F2]/60 mt-1">Sorted oldest first. Click a row to review the AI report + scout dictation and generate an estimate.</p>
          </div>
        </div>
        {analyzedLeads.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A24C]/10">
              <Sparkles className="h-6 w-6 text-[#D4A24C]" />
            </div>
            <p className="text-[#E5E9F2]/60 text-sm">Queue is clear. When scouts capture leads they&apos;ll land here for you to price.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E5E9F2]/5">
            {analyzedLeads.map((j) => {
              const c = j.revo_customers;
              const r = j.drone_report;
              const repairRange = r?.estimated_repair_cost_low
                ? `$${r.estimated_repair_cost_low.toLocaleString()}–$${(r.estimated_repair_cost_high || 0).toLocaleString()}`
                : null;
              return (
                <li key={j.id} className="px-6 py-4 hover:bg-white/5 transition">
                  <Link href={`/dashboard/customers/${j.customer_id}`} className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#D4A24C]">{j.job_number || '—'}</span>
                        <StatusPill status="analyzed" />
                        {r?.urgency === 'immediate' && (
                          <span className="text-[10px] uppercase tracking-wider text-red-300 bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5">
                            Urgent
                          </span>
                        )}
                        {r?.condition_score !== undefined && (
                          <span className="text-[10px] uppercase tracking-wider text-[#E5E9F2]/60">
                            Condition {r.condition_score}/10
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium truncate">{c?.name || 'Property'}</div>
                      <div className="text-xs text-[#E5E9F2]/50 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[c?.address, c?.city, c?.state].filter(Boolean).join(', ') || 'No address yet'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {repairRange ? (
                        <div className="text-sm text-[#D4A24C]">AI est. {repairRange}</div>
                      ) : (
                        <div className="text-xs text-[#E5E9F2]/40">Ready to price</div>
                      )}
                      <div className="text-[10px] text-[#E5E9F2]/40 mt-1">
                        {new Date(j.created_at).toLocaleDateString()}
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-[#D4A24C] mt-1" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* SECONDARY: free-form quote builder (existing flow, demoted) */}
      <div className="mb-3 text-xs uppercase tracking-widest text-[#E5E9F2]/40">Other tools</div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link
          href="/estimator/new"
          className="group flex items-center justify-between p-6 bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl hover:border-[#D4A24C]/50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center">
              <Calculator className="w-6 h-6 text-[#0A0F1F]" />
            </div>
            <div>
              <div className="font-display text-lg">New estimate</div>
              <div className="text-sm text-[#E5E9F2]/60">Build a quote from a customer + measurements</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#D4A24C] group-hover:translate-x-1 transition" />
        </Link>
        <Link
          href="/estimator/roof-analyze"
          className="group flex items-center justify-between p-6 bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl hover:border-[#D4A24C]/50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-[#0A0F1F]" />
            </div>
            <div>
              <div className="font-display text-lg">AI roof analysis</div>
              <div className="text-sm text-[#E5E9F2]/60">Upload photos · 3-second damage report</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#D4A24C] group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Assigned list */}
      <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <div className="bg-black/30 px-6 py-3 border-b border-[#E5E9F2]/10 flex items-center justify-between">
          <h2 className="font-display text-lg">Assigned to me</h2>
          <Link href="/estimator/estimates" className="text-xs text-[#D4A24C] hover:underline">
            View all →
          </Link>
        </div>
        {assignedList.length === 0 ? (
          <div className="p-10 text-center text-[#E5E9F2]/40 text-sm">
            No jobs assigned yet. New estimates you start are saved automatically.
          </div>
        ) : (
          <ul className="divide-y divide-[#E5E9F2]/5">
            {assignedList.map((j) => (
              <li key={j.id} className="px-6 py-4 hover:bg-white/5">
                <Link href={`/estimator/estimates/${j.id}`} className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm text-[#D4A24C]">{j.job_number}</div>
                    <div className="text-sm">{j.revo_customers?.name || 'Unknown customer'}</div>
                    <div className="text-xs text-[#E5E9F2]/50">
                      {[j.revo_customers?.address, j.revo_customers?.city, j.revo_customers?.state]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#D4A24C]">
                      {j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—'}
                    </div>
                    <div className="text-xs text-[#E5E9F2]/50 capitalize">{j.status}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="p-5 bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#D4A24C] mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="font-display text-3xl">{value}</div>
      {suffix && <div className="text-xs text-[#E5E9F2]/50 mt-1">{suffix}</div>}
    </div>
  );
}
