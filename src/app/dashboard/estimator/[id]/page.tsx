'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calculator, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  job_number: string | null;
  status: string;
  description: string | null;
  drone_report: { condition_score?: number; urgency?: string; narrative?: string; estimated_repair_cost_low?: number; estimated_repair_cost_high?: number; damage_types?: string[] } | null;
  revo_customers: { name: string; address: string | null; city: string | null; state: string | null; phone: string | null; email: string | null } | null;
}

interface EstimateForm {
  roof_type: 'asphalt' | 'metal' | 'tile' | 'flat_tpo' | 'flat_epdm';
  total_sqft: number;
  scope_of_work: string;
  materials_cost: number;
  labor_cost: number;
  permits_dump: number;
  insurance_claim: boolean;
  claim_number: string;
  customer_total: number;
  notes_for_closer: string;
  acknowledged: boolean;
}

const DEFAULTS: EstimateForm = {
  roof_type: 'asphalt',
  total_sqft: 2400,
  scope_of_work: '',
  materials_cost: 0,
  labor_cost: 0,
  permits_dump: 0,
  insurance_claim: false,
  claim_number: '',
  customer_total: 0,
  notes_for_closer: '',
  acknowledged: false,
};

export default function EstimatorEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EstimateForm>(DEFAULTS);

  useEffect(() => { params.then(p => setJobId(p.id)); }, [params]);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}`)
      .then(r => r.json())
      .then(data => {
        const j: Lead = data.job;
        setLead(j);
        // Pre-fill from AI report if present
        const report = j?.drone_report;
        if (report) {
          const mid = Math.round(((report.estimated_repair_cost_low || 0) + (report.estimated_repair_cost_high || 0)) / 2) || 0;
          setForm(f => ({
            ...f,
            scope_of_work: report.narrative || f.scope_of_work,
            materials_cost: Math.round(mid * 0.45),
            labor_cost: Math.round(mid * 0.40),
            permits_dump: Math.round(mid * 0.05),
            customer_total: Math.round(mid * 1.18),
          }));
        }
        setLoading(false);
      })
      .catch(() => { setError('Could not load lead.'); setLoading(false); });
  }, [jobId]);

  const subtotal = form.materials_cost + form.labor_cost + form.permits_dump;
  const margin = form.customer_total - subtotal;
  const marginPct = subtotal > 0 ? (margin / subtotal) * 100 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acknowledged) { setError('You must acknowledge the estimate is accurate.'); return; }
    if (form.customer_total <= 0) { setError('Customer total must be greater than zero.'); return; }
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/role-transition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'estimator.submit',
        job_id: jobId,
        customer_total: form.customer_total,
        notes: form.notes_for_closer,
        estimate_data: { ...form },
      }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(body.error || 'Submit failed'); return; }
    router.push('/dashboard/estimator?submitted=' + jobId);
  };

  if (loading) {
    return (
      <main className="p-8 max-w-3xl mx-auto"><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" /></div></main>
    );
  }
  if (!lead) {
    return (
      <main className="p-8 max-w-3xl mx-auto"><p className="text-[#E5E9F2]/60">Lead not found.</p></main>
    );
  }

  const customer = lead.revo_customers;

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/estimator" className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to estimator queue
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Generate estimate</span>
        </div>
        <h1 className="font-display text-3xl mb-1">{customer?.name || 'Lead'}</h1>
        <p className="text-sm text-[#E5E9F2]/60">
          {[customer?.address, customer?.city, customer?.state].filter(Boolean).join(', ') || '—'} · Job <span className="font-mono">{lead.job_number || '—'}</span>
        </p>
      </header>

      {lead.drone_report && (
        <section className="mb-6 rounded-xl border border-[#D4A24C]/30 bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/8 p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-2">AI report context</div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Read label="Condition" value={`${lead.drone_report.condition_score ?? '—'}/10`} />
            <Read label="Urgency" value={(lead.drone_report.urgency || '').replace(/_/g, ' ') || '—'} />
            <Read label="Damage" value={lead.drone_report.damage_types?.length ? `${lead.drone_report.damage_types.length} types` : '—'} />
          </div>
        </section>
      )}

      <form onSubmit={submit} className="space-y-5">
        <Section title="Roof scope">
          <label className="block text-sm text-[#E5E9F2]/70 mb-1">Roof type</label>
          <select
            value={form.roof_type}
            onChange={(e) => setForm({ ...form, roof_type: e.target.value as EstimateForm['roof_type'] })}
            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
          >
            <option value="asphalt">Asphalt shingle</option>
            <option value="metal">Metal (standing seam)</option>
            <option value="tile">Tile</option>
            <option value="flat_tpo">Flat — TPO</option>
            <option value="flat_epdm">Flat — EPDM</option>
          </select>

          <div>
            <label className="block text-sm text-[#E5E9F2]/70 mt-3 mb-1">Total sqft</label>
            <input
              type="number"
              value={form.total_sqft || ''}
              onChange={(e) => setForm({ ...form, total_sqft: Number(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm text-[#E5E9F2]/70 mb-1">Scope of work</label>
            <textarea
              value={form.scope_of_work}
              onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })}
              rows={4}
              placeholder="Materials, methods, what's included…"
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none"
            />
          </div>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-3 gap-3">
            <Money label="Materials" value={form.materials_cost} onChange={(v) => setForm({ ...form, materials_cost: v })} />
            <Money label="Labor" value={form.labor_cost} onChange={(v) => setForm({ ...form, labor_cost: v })} />
            <Money label="Permits + dump" value={form.permits_dump} onChange={(v) => setForm({ ...form, permits_dump: v })} />
          </div>
          <div className="mt-4 pt-4 border-t border-[#E5E9F2]/10 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#E5E9F2]/60">Subtotal</span><span className="font-mono">${subtotal.toLocaleString()}</span></div>
            <Money label="Customer-facing total" value={form.customer_total} onChange={(v) => setForm({ ...form, customer_total: v })} highlight />
            <div className="flex justify-between text-xs">
              <span className="text-[#E5E9F2]/60">Internal margin</span>
              <span className={margin >= 0 ? 'text-emerald-300 font-mono' : 'text-red-300 font-mono'}>${margin.toLocaleString()} ({marginPct.toFixed(1)}%)</span>
            </div>
          </div>
        </Section>

        <Section title="Insurance claim">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.insurance_claim}
              onChange={(e) => setForm({ ...form, insurance_claim: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">This is an insurance-claim deal</span>
          </label>
          {form.insurance_claim && (
            <div className="mt-3">
              <label className="block text-sm text-[#E5E9F2]/70 mb-1">Claim number</label>
              <input
                value={form.claim_number}
                onChange={(e) => setForm({ ...form, claim_number: e.target.value })}
                placeholder="e.g. CLM-1834792"
                className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono"
              />
            </div>
          )}
        </Section>

        <Section title="Hand-off to closer">
          <label className="block text-sm text-[#E5E9F2]/70 mb-1">Notes for closer</label>
          <textarea
            value={form.notes_for_closer}
            onChange={(e) => setForm({ ...form, notes_for_closer: e.target.value })}
            rows={4}
            placeholder="Things the closer should know before the first call…"
            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none"
          />
        </Section>

        <label className="flex items-start gap-3 p-4 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acknowledged}
            onChange={(e) => setForm({ ...form, acknowledged: e.target.checked })}
            className="mt-0.5 w-4 h-4"
          />
          <span className="text-sm text-[#E5E9F2]/80">I acknowledge this estimate is accurate to the best of my knowledge and ready to hand to the sales coordinator.</span>
        </label>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !form.acknowledged}
          className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
          {submitting ? 'Submitting…' : 'Submit estimate'}
        </button>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 p-5 space-y-3">
      <h2 className="font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Money({ label, value, onChange, highlight }: { label: string; value: number; onChange: (v: number) => void; highlight?: boolean }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-[#E5E9F2]/50 mb-1">{label}</label>
      <div className={`flex items-center rounded-lg border ${highlight ? 'border-[#D4A24C]/40' : 'border-[#E5E9F2]/10'} bg-black/30`}>
        <span className="pl-3 text-[#E5E9F2]/55">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`flex-1 px-2 py-2.5 bg-transparent text-white focus:outline-none ${highlight ? 'font-display text-lg text-[#D4A24C]' : ''}`}
        />
      </div>
    </div>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 border border-[#E5E9F2]/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/55">{label}</div>
      <div className="text-sm capitalize">{value}</div>
    </div>
  );
}
