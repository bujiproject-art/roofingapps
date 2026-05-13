'use client';
import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload, Sparkles, Loader2, MapPin, Phone, Mail, ImageIcon, Trash2, ChevronDown, Mic, ShieldCheck, Satellite, Brain } from 'lucide-react';
import { StatusPill } from '@/components/RevoUI';
import { SatelliteView } from '@/components/SatelliteView';

interface Customer { id: string; name: string; email: string | null; phone: string | null; address: string | null; city: string | null; state: string | null; zip: string | null; status: string; property_type: string | null; notes: string | null; roof_type: string | null; roof_age_years: number | null; damage_type: string | null; estimated_value: number | null; }
interface Job { id: string; job_number: string | null; status: string; job_type: string | null; description: string | null; estimated_cost: number | null; scheduled_date: string | null; before_photos: string[]; after_photos: string[]; drone_photos: string[]; drone_report: { condition_score?: number; damage_types?: string[]; estimated_age_years?: number; urgency?: string; recommended_action?: string; estimated_repair_cost_low?: number; estimated_repair_cost_high?: number; narrative?: string; } | null; created_at: string; }

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewJob, setShowNewJob] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/customers/${id}`);
    const data = await res.json();
    if (res.ok) {
      setCustomer(data.customer);
      setJobs(data.jobs || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const updateCustomer = async (updates: Partial<Customer>) => {
    const res = await fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) {
      const data = await res.json();
      setCustomer(data.customer);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" /></div>;
  if (!customer) return <div className="p-8 text-red-300">Customer not found</div>;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <Link href="/dashboard/customers" className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white mb-6 transition"><ArrowLeft className="w-4 h-4" /> All customers</Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-2">{customer.name}</h1>
          <div className="flex items-center gap-4 text-sm text-[#E5E9F2]/70">
            {customer.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{[customer.address, customer.city, customer.state].filter(Boolean).join(', ')}</span>}
            {customer.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>}
            {customer.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{customer.email}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={customer.status} />
          <select value={customer.status} onChange={e => updateCustomer({ status: e.target.value })} className="px-3 py-1.5 text-sm rounded-lg bg-[#0F1729] border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
            <option value="lead">Lead</option><option value="scheduled">Scheduled</option><option value="inspected">Inspected</option><option value="proposal_sent">Proposal Sent</option><option value="signed">Signed</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Iteration 3 — collapsible intel panels. Native <details> for zero-JS
          surgical add. Each panel is independent and degrades gracefully
          when its data source isn't wired yet. */}
      <div className="mb-8 space-y-3">
        {/* Satellite view of the property — auto-fetched from address */}
        {customer.address && (
          <details className="group bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden" open>
            <summary className="flex items-center justify-between px-5 py-3 border-b border-[#E5E9F2]/10 cursor-pointer hover:bg-white/5 transition list-none">
              <div className="flex items-center gap-3">
                <Satellite className="w-4 h-4 text-[#D4A24C]" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#D4A24C] font-semibold">Property satellite view</div>
                  <div className="text-xs text-[#E5E9F2]/50">Auto-fetched from address · rooftop zoom</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#E5E9F2]/50 transition group-open:rotate-180" />
            </summary>
            <div className="p-4">
              <SatelliteView
                address={[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}
                zoom={19}
                className="max-w-xl mx-auto"
              />
            </div>
          </details>
        )}

        {/* AI Report rollup — most recent job's drone_report */}
        <details className="group bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/5 transition list-none">
            <div className="flex items-center gap-3">
              <Brain className="w-4 h-4 text-[#3B82F6]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#3B82F6] font-semibold">AI Report rollup</div>
                <div className="text-xs text-[#E5E9F2]/50">
                  {(() => {
                    const latest = jobs.find(j => j.drone_report);
                    return latest?.drone_report
                      ? `Latest analysis: condition ${latest.drone_report.condition_score}/10 · urgency ${latest.drone_report.urgency?.replace(/_/g, ' ') || '—'}`
                      : 'No AI analysis yet. Run one from a job below.';
                  })()}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#E5E9F2]/50 transition group-open:rotate-180" />
          </summary>
          <div className="p-5 border-t border-[#E5E9F2]/10">
            {(() => {
              const latest = jobs.find(j => j.drone_report);
              if (!latest?.drone_report) {
                return (
                  <p className="text-sm text-[#E5E9F2]/50 text-center py-4">
                    No AI roof report on file. Add a job below and tap <span className="text-[#D4A24C]">Run AI Roof Analysis</span> to generate one.
                  </p>
                );
              }
              const r = latest.drone_report;
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Condition" value={`${r.condition_score}/10`} />
                    <Stat label="Est. age" value={`${r.estimated_age_years ?? '?'} yrs`} />
                    <Stat label="Urgency" value={(r.urgency || '—').replace(/_/g, ' ')} />
                    <Stat label="Repair range" value={r.estimated_repair_cost_low ? `$${r.estimated_repair_cost_low.toLocaleString()}–$${(r.estimated_repair_cost_high || 0).toLocaleString()}` : '—'} />
                  </div>
                  {r.damage_types && r.damage_types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.damage_types.map((d) => (
                        <span key={d} className="text-[10px] uppercase tracking-wider bg-[#D4A24C]/10 border border-[#D4A24C]/30 rounded-full px-2 py-1 text-[#D4A24C]">
                          {d.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.narrative && <p className="text-sm text-[#E5E9F2]/80 whitespace-pre-line">{r.narrative}</p>}
                </div>
              );
            })()}
          </div>
        </details>

        {/* Voice Notes (Scout dictation) — placeholder, table lands in next dispatch */}
        <details className="group bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/5 transition list-none">
            <div className="flex items-center gap-3">
              <Mic className="w-4 h-4 text-amber-300" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">Voice notes</div>
                <div className="text-xs text-[#E5E9F2]/50">Scout dictations attached to this customer record</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#E5E9F2]/50 transition group-open:rotate-180" />
          </summary>
          <div className="p-5 border-t border-[#E5E9F2]/10 text-center text-sm text-[#E5E9F2]/50">
            <Mic className="w-8 h-8 mx-auto mb-2 text-[#E5E9F2]/20" />
            <p>
              No voice notes yet. When a scout submits a dictation correction with their capture, it will appear here for the Estimator to review.
            </p>
          </div>
        </details>

        {/* Soft Credit / Background — placeholder, BatchData API in next dispatch */}
        <details className="group bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/5 transition list-none">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">Soft credit & background</div>
                <div className="text-xs text-[#E5E9F2]/50">Property ownership · equity · liens · soft credit indicator</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#E5E9F2]/50 transition group-open:rotate-180" />
          </summary>
          <div className="p-5 border-t border-[#E5E9F2]/10 text-center text-sm text-[#E5E9F2]/50">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#E5E9F2]/20" />
            <p className="mb-1">Soft credit report not configured.</p>
            <p className="text-xs text-[#E5E9F2]/40">
              Wire BatchData (or chosen provider) in Admin → Settings to enable property + equity + lien lookups for closers.
            </p>
          </div>
        </details>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">Jobs</h2>
        <button onClick={() => setShowNewJob(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="border border-dashed border-[#E5E9F2]/20 rounded-xl p-10 text-center text-[#E5E9F2]/60">
          <p className="mb-4">No jobs yet for this customer.</p>
          <button onClick={() => setShowNewJob(true)} className="px-5 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">Create first job</button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => <JobCard key={job.id} job={job} onUpdate={load} />)}
        </div>
      )}

      {showNewJob && <NewJobModal customerId={id} onClose={() => setShowNewJob(false)} onCreated={() => { setShowNewJob(false); load(); }} />}
    </main>
  );
}

function JobCard({ job, onUpdate }: { job: Job; onUpdate: () => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const uploadPhoto = async (kind: 'before_photos' | 'after_photos' | 'drone_photos', file: File) => {
    setUploading(kind);
    const form = new FormData();
    form.append('file', file);
    form.append('folder', kind);
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
    const upData = await uploadRes.json();
    if (!uploadRes.ok) { setUploading(null); alert(upData.error || 'Upload failed'); return; }
    const current = job[kind] || [];
    await fetch(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [kind]: [...current, upData.url] }) });
    setUploading(null);
    onUpdate();
  };

  const analyzeRoof = async () => {
    const imagesToSend = [...(job.drone_photos || []), ...(job.before_photos || [])].slice(0, 4);
    if (imagesToSend.length === 0) { setAnalysisError('Upload at least one photo first.'); return; }
    setAnalyzing(true); setAnalysisError('');
    const res = await fetch('/api/roof-analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_urls: imagesToSend }) });
    const data = await res.json();
    setAnalyzing(false);
    if (!res.ok) { setAnalysisError(data.error || 'Analysis failed'); return; }
    await fetch(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drone_report: data.analysis || { narrative: data.raw } }) });
    onUpdate();
  };

  return (
    <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs text-[#D4A24C]">{job.job_number}</span>
            <StatusPill status={job.status} />
            {job.job_type && <span className="text-xs text-[#E5E9F2]/50">· {job.job_type.replace(/_/g, ' ')}</span>}
          </div>
          {job.description && <p className="text-sm text-[#E5E9F2]/80 max-w-2xl">{job.description}</p>}
        </div>
        {job.estimated_cost && <div className="text-right"><div className="text-xs text-[#E5E9F2]/50">Estimated</div><div className="font-display text-2xl text-[#D4A24C]">${Number(job.estimated_cost).toLocaleString()}</div></div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {(['before_photos','drone_photos','after_photos'] as const).map(kind => (
          <PhotoSection key={kind} label={kind.replace('_photos','').replace(/^\w/, c => c.toUpperCase())} photos={job[kind] || []} uploading={uploading === kind} onUpload={(f) => uploadPhoto(kind, f)} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#E5E9F2]/10">
        <button onClick={analyzeRoof} disabled={analyzing || (job.before_photos.length + job.drone_photos.length === 0)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4A24C] to-[#3B82F6] text-[#0A0F1F] font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analyzing ? 'Analyzing roof…' : 'Run AI Roof Analysis'}
        </button>
        {analysisError && <span className="text-xs text-red-300">{analysisError}</span>}
      </div>

      {job.drone_report && (
        <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-[#D4A24C]" /><span className="font-display text-lg">AI Roof Analysis</span></div>
          {job.drone_report.condition_score !== undefined && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Condition" value={`${job.drone_report.condition_score}/10`} />
              <Stat label="Est. age" value={`${job.drone_report.estimated_age_years ?? '?'} yrs`} />
              <Stat label="Urgency" value={job.drone_report.urgency?.replace(/_/g,' ') || '—'} />
              <Stat label="Repair range" value={job.drone_report.estimated_repair_cost_low ? `$${job.drone_report.estimated_repair_cost_low.toLocaleString()}–$${(job.drone_report.estimated_repair_cost_high || 0).toLocaleString()}` : '—'} />
            </div>
          )}
          {job.drone_report.damage_types && job.drone_report.damage_types.length > 0 && (
            <div className="mb-3"><div className="text-xs text-[#E5E9F2]/60 mb-1">Damage detected</div><div className="flex gap-2 flex-wrap">{job.drone_report.damage_types.map((d, i) => <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-red-500/10 text-red-300 border border-red-500/30">{d.replace(/_/g, ' ')}</span>)}</div></div>
          )}
          {job.drone_report.recommended_action && <p className="text-sm mb-2"><strong>Recommendation:</strong> {job.drone_report.recommended_action}</p>}
          {job.drone_report.narrative && <p className="text-sm text-[#E5E9F2]/80 whitespace-pre-wrap leading-relaxed">{job.drone_report.narrative}</p>}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-black/30 rounded-lg px-3 py-2"><div className="text-[10px] uppercase tracking-wider text-[#E5E9F2]/50">{label}</div><div className="font-semibold text-sm text-white">{value}</div></div>;
}

function PhotoSection({ label, photos, uploading, onUpload }: { label: string; photos: string[]; uploading: boolean; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-[#E5E9F2]/70 uppercase tracking-wider">{label}</div>
        <button onClick={() => ref.current?.click()} disabled={uploading} className="text-xs text-[#D4A24C] hover:text-[#E5B366] transition flex items-center gap-1">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? 'Uploading…' : 'Add photo'}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
      </div>
      {photos.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[#E5E9F2]/30"><ImageIcon className="w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded" />
          ))}
        </div>
      )}
    </div>
  );
}

function NewJobModal({ customerId, onClose, onCreated }: { customerId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ job_type: 'inspection', description: '', estimated_cost: '', scheduled_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    const payload = { customer_id: customerId, job_type: form.job_type, description: form.description, estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null, scheduled_date: form.scheduled_date || null, status: 'pending' };
    const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Save failed');
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-[#0F1729] border border-[#E5E9F2]/10 rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E9F2]/10"><h2 className="font-display text-2xl">New Job</h2><button onClick={onClose}><Trash2 className="w-5 h-5 text-[#E5E9F2]/60 hover:text-white" /></button></div>
        <div className="p-6 space-y-3">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
          <select value={form.job_type} onChange={e => setForm({...form, job_type: e.target.value})} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"><option value="inspection">Inspection</option><option value="repair">Repair</option><option value="full_replacement">Full Replacement</option><option value="storm_damage">Storm Damage</option><option value="maintenance">Maintenance</option></select>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3"><input type="number" value={form.estimated_cost} onChange={e => setForm({...form, estimated_cost: e.target.value})} placeholder="Estimated cost" className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" /><input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none" /></div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-[#E5E9F2]/10"><button onClick={onClose} className="px-5 py-2 text-[#E5E9F2]/60 hover:text-white">Cancel</button><button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Creating…' : 'Create Job'}</button></div>
      </div>
    </div>
  );
}
