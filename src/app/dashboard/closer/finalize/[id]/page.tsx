'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, DollarSign, AlertCircle, Trophy } from 'lucide-react';

interface Job {
  id: string;
  job_number: string | null;
  status: string;
  estimated_cost: number | null;
  sold_amount: number | null;
  estimate_data: { materials_cost?: number; labor_cost?: number; permits_dump?: number } | null;
  revo_customers: { name: string } | null;
}

interface Form {
  gross_sale: number;
  materials_cost: number;
  labor_cost: number;
  permits_dump: number;
  expert_commission: number;
  estimator_fee: number;
  closer_commission: number;
  sc_override: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string;
}

export default function FinalizePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState<Form>({
    gross_sale: 0, materials_cost: 0, labor_cost: 0, permits_dump: 0,
    expert_commission: 0, estimator_fee: 75, closer_commission: 0, sc_override: 0,
    payment_status: 'pending', notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { params.then(p => setJobId(p.id)); }, [params]);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}`).then(r => r.json()).then(d => {
      const j: Job = d.job;
      setJob(j);
      const gross = Number(j.sold_amount || j.estimated_cost || 0);
      const estData = j.estimate_data || {};
      setForm(f => ({
        ...f,
        gross_sale: gross,
        materials_cost: Number(estData.materials_cost || 0) || Math.round(gross * 0.40),
        labor_cost: Number(estData.labor_cost || 0) || Math.round(gross * 0.30),
        permits_dump: Number(estData.permits_dump || 0) || Math.round(gross * 0.05),
        expert_commission: Math.round(gross * 0.05),
        closer_commission: Math.round(gross * 0.10),
      }));
      setLoading(false);
    }).catch(() => { setError('Could not load deal.'); setLoading(false); });
  }, [jobId]);

  const cost = form.materials_cost + form.labor_cost + form.permits_dump;
  const commissionTotal = form.expert_commission + form.estimator_fee + form.closer_commission + form.sc_override;
  const netProfit = form.gross_sale - cost - commissionTotal;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.gross_sale <= 0) { setError('Gross sale must be greater than zero.'); return; }
    setSubmitting(true); setError(null);
    const res = await fetch('/api/role-transition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'admin.finalize', job_id: jobId, ...form }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(body.error || 'Finalize failed'); return; }
    router.push('/admin?finalized=' + jobId);
  };

  if (loading) return <main className="p-8"><Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" /></main>;
  if (!job) return <main className="p-8"><p>Deal not found.</p></main>;

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to admin
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Finalize · {job.job_number}</span>
        </div>
        <h1 className="font-display text-3xl mb-1">{job.revo_customers?.name || 'Deal'}</h1>
        <p className="text-sm text-[#E5E9F2]/60">Lock the numbers, post commissions, mark the deal complete.</p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Revenue">
          <Money label="Final gross sale" value={form.gross_sale} onChange={(v) => setForm({ ...form, gross_sale: v })} highlight />
        </Section>

        <Section title="Costs">
          <div className="grid grid-cols-3 gap-3">
            <Money label="Materials" value={form.materials_cost} onChange={(v) => setForm({ ...form, materials_cost: v })} />
            <Money label="Labor" value={form.labor_cost} onChange={(v) => setForm({ ...form, labor_cost: v })} />
            <Money label="Permits + dump" value={form.permits_dump} onChange={(v) => setForm({ ...form, permits_dump: v })} />
          </div>
        </Section>

        <Section title="Commissions">
          <div className="grid grid-cols-2 gap-3">
            <Money label="Expert (Scout) 5%" value={form.expert_commission} onChange={(v) => setForm({ ...form, expert_commission: v })} />
            <Money label="Estimator fee" value={form.estimator_fee} onChange={(v) => setForm({ ...form, estimator_fee: v })} />
            <Money label="Closer 10%" value={form.closer_commission} onChange={(v) => setForm({ ...form, closer_commission: v })} />
            <Money label="SC override" value={form.sc_override} onChange={(v) => setForm({ ...form, sc_override: v })} />
          </div>
        </Section>

        <Section title="Summary">
          <div className="space-y-2 text-sm">
            <Row label="Gross sale" value={`$${form.gross_sale.toLocaleString()}`} />
            <Row label="Total costs" value={`–$${cost.toLocaleString()}`} muted />
            <Row label="Commissions paid" value={`–$${commissionTotal.toLocaleString()}`} muted />
            <div className="h-px bg-[#E5E9F2]/10 my-1" />
            <Row label="Net profit" value={`$${netProfit.toLocaleString()}`} accent={netProfit >= 0 ? 'green' : 'red'} />
          </div>
        </Section>

        <Section title="Payment status">
          <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as Form['payment_status'] })} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
            <option value="pending">Pending — invoice sent</option>
            <option value="partial">Partial — deposit collected</option>
            <option value="paid">Paid in full</option>
          </select>
          <div className="mt-3">
            <label className="block text-sm text-[#E5E9F2]/70 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none" />
          </div>
        </Section>

        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

        <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold hover:bg-[#E5B366] disabled:opacity-50 transition flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          {submitting ? 'Finalizing…' : 'Finalize deal · post commissions'}
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
        <input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value) || 0)} className={`flex-1 px-2 py-2.5 bg-transparent text-white focus:outline-none ${highlight ? 'font-display text-lg text-[#D4A24C]' : ''}`} />
      </div>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: 'green' | 'red' }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? 'text-[#E5E9F2]/60' : ''}>{label}</span>
      <span className={`font-mono ${accent === 'green' ? 'text-emerald-300' : accent === 'red' ? 'text-red-300' : ''}`}>{value}</span>
    </div>
  );
}
