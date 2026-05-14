'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Phone, Calendar, DollarSign, X, AlertCircle, Check } from 'lucide-react';
import { StatusPill } from '@/components/RevoUI';

interface Job {
  id: string;
  job_number: string | null;
  status: string;
  estimated_cost: number | null;
  estimate_notes: string | null;
  drone_report: { condition_score?: number; urgency?: string; narrative?: string; damage_types?: string[] } | null;
  revo_customers: { name: string; address: string | null; city: string | null; state: string | null; phone: string | null; email: string | null } | null;
}

type Modal = null | 'sold' | 'lost';

const LOST_REASONS = [
  { value: 'price', label: 'Price' },
  { value: 'competition', label: 'Went with competitor' },
  { value: 'no_show', label: 'Customer no-show / ghosted' },
  { value: 'not_ready', label: 'Not ready to buy' },
  { value: 'other', label: 'Other' },
];

export default function CloserActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { params.then(p => setJobId(p.id)); }, [params]);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}`).then(r => r.json()).then(d => { setJob(d.job); setLoading(false); }).catch(() => { setError('Could not load deal.'); setLoading(false); });
  }, [jobId]);

  const log = async (action: 'closer.contacted' | 'closer.appointment_set') => {
    if (!jobId) return;
    setBusy(true);
    setError(null);
    await fetch('/api/role-transition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, job_id: jobId }) });
    setBusy(false);
    router.refresh();
  };

  if (loading) return <main className="p-8"><Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" /></main>;
  if (!job) return <main className="p-8"><p className="text-[#E5E9F2]/60">Deal not found.</p></main>;
  const c = job.revo_customers;

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/closer" className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to my deals
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-[#D4A24C]">{job.job_number}</span>
          <StatusPill status={job.status} />
        </div>
        <h1 className="font-display text-3xl mb-1">{c?.name}</h1>
        <p className="text-sm text-[#E5E9F2]/60">{[c?.address, c?.city, c?.state].filter(Boolean).join(', ') || '—'}</p>
      </header>

      <section className="grid sm:grid-cols-2 gap-3 mb-6">
        {c?.phone && (
          <a href={`tel:${c.phone}`} className="flex items-center gap-3 p-4 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 hover:border-[#D4A24C]/40 transition">
            <Phone className="w-4 h-4 text-[#D4A24C]" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">Call</div>
              <div className="text-sm">{c.phone}</div>
            </div>
          </a>
        )}
        {c?.email && (
          <a href={`mailto:${c.email}`} className="flex items-center gap-3 p-4 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 hover:border-[#D4A24C]/40 transition">
            <DollarSign className="w-4 h-4 text-[#D4A24C]" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">Email</div>
              <div className="text-sm">{c.email}</div>
            </div>
          </a>
        )}
      </section>

      {job.drone_report?.narrative && (
        <section className="mb-6 p-5 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10">
          <h2 className="font-display text-lg mb-2">AI report</h2>
          <p className="text-sm text-[#E5E9F2]/80 whitespace-pre-line">{job.drone_report.narrative}</p>
        </section>
      )}

      <section className="mb-6 p-5 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Quoted total</h2>
          <div className="font-display text-3xl text-[#D4A24C]">${Number(job.estimated_cost || 0).toLocaleString()}</div>
        </div>
        {job.estimate_notes && <p className="text-sm text-[#E5E9F2]/80 mt-3 border-l-2 border-[#D4A24C]/30 pl-3">{job.estimate_notes}</p>}
      </section>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => log('closer.contacted')} disabled={busy} className="p-4 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 hover:border-[#D4A24C]/40 transition flex flex-col items-center gap-2 text-sm disabled:opacity-50">
          <Phone className="w-5 h-5 text-[#D4A24C]" /> Contacted
        </button>
        <button onClick={() => log('closer.appointment_set')} disabled={busy} className="p-4 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 hover:border-[#D4A24C]/40 transition flex flex-col items-center gap-2 text-sm disabled:opacity-50">
          <Calendar className="w-5 h-5 text-[#D4A24C]" /> Appointment
        </button>
        <button onClick={() => setModal('sold')} className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition flex flex-col items-center gap-2 text-sm">
          <Check className="w-5 h-5" /> Mark sold
        </button>
        <button onClick={() => setModal('lost')} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition flex flex-col items-center gap-2 text-sm">
          <X className="w-5 h-5" /> Mark lost
        </button>
      </section>

      {modal === 'sold' && <SoldModal jobId={jobId!} suggested={Number(job.estimated_cost || 0)} onClose={() => setModal(null)} onDone={() => router.push('/dashboard/closer')} />}
      {modal === 'lost' && <LostModal jobId={jobId!} onClose={() => setModal(null)} onDone={() => router.push('/dashboard/closer')} />}
    </main>
  );
}

function SoldModal({ jobId, suggested, onClose, onDone }: { jobId: string; suggested: number; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(suggested);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    const res = await fetch('/api/role-transition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'closer.sold', job_id: jobId, sold_amount: amount }) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body.error || 'Failed'); return; }
    onDone();
  };
  return (
    <Modal title="Mark sold" onClose={onClose}>
      <p className="text-sm text-[#E5E9F2]/60 mb-4">Final agreed sale amount with the customer.</p>
      <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white text-lg font-display focus:border-[#D4A24C] focus:outline-none" />
      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
      <button onClick={submit} disabled={busy || amount <= 0} className="w-full mt-4 py-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold disabled:opacity-50 hover:bg-emerald-500/30 transition flex items-center justify-center gap-2">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm sold · ${amount.toLocaleString()}
      </button>
    </Modal>
  );
}

function LostModal({ jobId, onClose, onDone }: { jobId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(LOST_REASONS[0].value);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    const res = await fetch('/api/role-transition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'closer.lost', job_id: jobId, reason, note }) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body.error || 'Failed'); return; }
    onDone();
  };
  return (
    <Modal title="Mark lost" onClose={onClose}>
      <label className="block text-sm text-[#E5E9F2]/70 mb-1">Reason</label>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none mb-3">
        {LOST_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <label className="block text-sm text-[#E5E9F2]/70 mb-1">Note (optional)</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none" />
      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
      <button onClick={submit} disabled={busy} className="w-full mt-4 py-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 font-semibold hover:bg-red-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Mark lost
      </button>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F1729] border border-[#E5E9F2]/15 rounded-2xl">
        <header className="flex items-center justify-between p-5 border-b border-[#E5E9F2]/10">
          <h3 className="font-display text-xl">{title}</h3>
          <button onClick={onClose} className="text-[#E5E9F2]/55 hover:text-white"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
