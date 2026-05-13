'use client';

// Auto-Capture flow (Iteration 3 Phase 2 stub).
//
// Implements the 9-screen progression from the Iteration 3 plan §5:
//   1. New Customer / Auto-Capture toggle
//   2. GPS lock → property data → satellite checkpoint loader
//   3. Confirmation panel (auto-pulled address + manual fields)
//   4. Analyze with AI → Claude Vision call
//   5. AI report display
//   6. Acknowledgment modal ("Is this analysis accurate?")
//   7. MP3 dictation recorder (only on No path)
//   8. Submit → status='analyzed'
//
// Property data API and MP3 recorder are stubbed — they require ATTOM
// (or BatchData) API key + a voice-note table that lands in a follow-up
// dispatch. The flow still works end-to-end: Nominatim provides the
// address from GPS, satellite renders via /api/satellite, AI runs via
// /api/roof-analyze, status='analyzed' on submit.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Loader2,
  Camera,
  Wand2,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Mic,
} from 'lucide-react';
import { SatelliteView } from '@/components/SatelliteView';

type Step =
  | 'choose'        // 1: Auto-Capture vs Manual
  | 'capturing'     // 2: GPS + property + satellite checkpoints
  | 'confirm'       // 3: confirmation panel
  | 'analyzing'     // 4-5: AI running + report
  | 'acknowledge'   // 6: yes/no modal
  | 'dictate'       // 7: MP3 recorder
  | 'submitting'    // 8: write to DB
  | 'done';         // 9: confirmation

interface AddressData {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lon: number | null;
  // Stubbed property fields — real values arrive once ATTOM/BatchData lands.
  owner_name: string | null;
  year_built: number | null;
  square_feet: number | null;
  estimated_value: number | null;
  tax_plot_id: string | null;
}

interface AIReport {
  condition_score: number;
  estimated_age_years: number;
  urgency: 'immediate' | 'within_30_days' | 'within_6_months' | 'monitor';
  damage_types: string[];
  estimated_repair_cost_low: number;
  estimated_repair_cost_high: number;
  recommended_action: string;
  narrative: string;
}

const EMPTY_ADDRESS: AddressData = {
  address: '',
  city: '',
  state: '',
  zip: '',
  lat: null,
  lon: null,
  owner_name: null,
  year_built: null,
  square_feet: null,
  estimated_value: null,
  tax_plot_id: null,
};

export default function QuickScoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AddressData>(EMPTY_ADDRESS);
  const [report, setReport] = useState<AIReport | null>(null);
  const [dictation, setDictation] = useState('');
  const [checkpoints, setCheckpoints] = useState({ gps: false, property: false, satellite: false });

  const startAutoCapture = () => {
    setStep('capturing');
    setError(null);
    setCheckpoints({ gps: false, property: false, satellite: false });

    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device — switching to manual entry.');
      setStep('confirm');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setCheckpoints((c) => ({ ...c, gps: true }));

        // Reverse geocode via /api/geocode (Nominatim wrapper)
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          const body = await res.json();
          if (!res.ok) throw new Error(body.error || 'Geocoder failed');
          const a = body.address ?? {};
          const address = a.house_number && a.road ? `${a.house_number} ${a.road}` : (a.road || '');

          setData({
            address,
            city: a.city || '',
            state: a.state_code || a.state || '',
            zip: a.postcode || '',
            lat,
            lon,
            // Stubbed: real property data needs ATTOM/BatchData (Dispatch B+)
            owner_name: null,
            year_built: null,
            square_feet: null,
            estimated_value: null,
            tax_plot_id: null,
          });

          setCheckpoints((c) => ({ ...c, property: true }));

          // Satellite stage is a visual checkpoint — the actual tile renders
          // on the confirmation panel via <SatelliteView>.
          await new Promise((r) => setTimeout(r, 400));
          setCheckpoints((c) => ({ ...c, satellite: true }));
          await new Promise((r) => setTimeout(r, 200));
          setStep('confirm');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Address lookup failed');
          setStep('confirm');
        }
      },
      () => {
        setError('Location permission denied — switching to manual entry.');
        setStep('confirm');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const startManual = () => {
    setStep('confirm');
    setError(null);
  };

  const runAI = async () => {
    setStep('analyzing');
    setError(null);
    try {
      // No photos yet for the scout flow MVP — the AI runs against the
      // satellite-rendered roof. Once Pexels-or-upload integration lands
      // we can include ground photos too.
      const res = await fetch('/api/roof-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_urls: [],
          satellite_lat: data.lat,
          satellite_lon: data.lon,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'AI analysis failed');
        setStep('confirm');
        return;
      }
      // Tolerate either {analysis: {...}} or a raw report shape
      const analysis: AIReport = body.analysis ?? body;
      setReport(analysis);
      setStep('acknowledge');
    } catch {
      setError('Network error during AI analysis. Try again.');
      setStep('confirm');
    }
  };

  const submit = async (withDictation = false) => {
    setStep('submitting');
    setError(null);
    try {
      // Create the customer (status='lead' default, scout-mode insert)
      const customerRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.owner_name || `Property at ${data.address || 'unknown address'}`,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          property_type: 'residential',
          status: 'lead',
          notes: withDictation && dictation ? `Scout dictation: ${dictation}` : null,
        }),
      });
      const customerBody = await customerRes.json();
      if (!customerRes.ok) {
        setError(customerBody.error || 'Could not create customer');
        setStep('acknowledge');
        return;
      }

      // Create the job with status='analyzed' (Iteration-3 pipeline entry)
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerBody.customer.id,
          job_type: 'inspection',
          status: 'analyzed',
          description: report
            ? `${report.recommended_action}\n\n${report.narrative}`
            : 'Scout-captured lead — awaiting Estimator review.',
          estimated_cost: report
            ? Math.round((report.estimated_repair_cost_low + report.estimated_repair_cost_high) / 2)
            : null,
        }),
      });
      const jobBody = await jobRes.json();
      if (!jobRes.ok) {
        setError(jobBody.error || 'Could not create job');
        setStep('acknowledge');
        return;
      }

      // Persist the AI report on the job
      if (report && jobBody.job?.id) {
        await fetch(`/api/jobs/${jobBody.job.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drone_report: report }),
        });
      }

      setStep('done');
      setTimeout(() => router.push('/dashboard'), 2400);
    } catch {
      setError('Submission failed — try again.');
      setStep('acknowledge');
    }
  };

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <header className="mb-6">
        <div className="text-[#D4A24C] uppercase tracking-widest text-xs font-semibold mb-1">
          Quick Scout
        </div>
        <h1 className="font-display text-3xl md:text-4xl">Capture a property in under 5 minutes</h1>
        <p className="text-sm text-[#E5E9F2]/60 mt-1">
          GPS → property data → satellite roof photo → AI analysis → acknowledge → submit. Back office handles pricing and closing.
        </p>
      </header>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* STEP 1: Choose path */}
      {step === 'choose' && (
        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={startAutoCapture}
            className="group relative overflow-hidden rounded-2xl border-2 border-[#D4A24C]/50 bg-gradient-to-br from-[#D4A24C]/20 to-[#1F3C88]/10 p-6 text-left transition hover:border-[#D4A24C]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A24C] to-[#E5B366] text-[#0A0F1F]">
                <MapPin className="h-7 w-7" />
              </div>
              <div>
                <div className="font-display text-xl">📍 Auto-Capture (recommended)</div>
                <div className="text-sm text-[#E5E9F2]/70 mt-1">
                  Stand at the property → tap and we lock GPS, pull owner + tax data, and fetch a satellite roof photo automatically.
                </div>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={startManual}
            className="rounded-2xl border border-[#E5E9F2]/15 bg-[#0F1729] p-5 text-left transition hover:border-[#E5E9F2]/30"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/30 text-[#E5E9F2]/70">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-base">✏️ Manual Entry</div>
                <div className="text-xs text-[#E5E9F2]/60 mt-0.5">
                  Type the address yourself. Use this if GPS is wonky or the customer told you the address by phone.
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* STEP 2: Capturing (3 checkpoints) */}
      {step === 'capturing' && (
        <div className="rounded-2xl bg-[#0F1729] border border-[#E5E9F2]/10 p-8">
          <div className="space-y-4">
            <Checkpoint label="GPS location locked" done={checkpoints.gps} />
            <Checkpoint label="Property data retrieved" done={checkpoints.property} />
            <Checkpoint label="Satellite roof image captured" done={checkpoints.satellite} />
          </div>
          <p className="text-xs text-[#E5E9F2]/50 mt-6 text-center">
            Property ownership + tax data lookup is stubbed for now. Real ATTOM data arrives in the next dispatch — your scout still submits.
          </p>
        </div>
      )}

      {/* STEP 3: Confirmation panel */}
      {step === 'confirm' && (
        <div className="space-y-5">
          {data.lat !== null && data.lon !== null && (
            <div className="rounded-2xl border border-[#E5E9F2]/10 bg-[#0F1729] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-2">
                Property satellite view
              </div>
              <SatelliteView
                lat={data.lat}
                lon={data.lon}
                zoom={19}
                className="max-w-md mx-auto"
              />
            </div>
          )}

          <div className="rounded-2xl border border-[#E5E9F2]/10 bg-[#0F1729] p-5 space-y-3">
            <FormField label="Street address" value={data.address} onChange={(v) => setData({ ...data, address: v })} placeholder="123 Main St" />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="City" value={data.city} onChange={(v) => setData({ ...data, city: v })} placeholder="Atlanta" />
              <FormField label="State" value={data.state} onChange={(v) => setData({ ...data, state: v })} placeholder="GA" />
              <FormField label="ZIP" value={data.zip} onChange={(v) => setData({ ...data, zip: v })} placeholder="30309" />
            </div>
            <FormField
              label="Owner name (optional)"
              value={data.owner_name || ''}
              onChange={(v) => setData({ ...data, owner_name: v || null })}
              placeholder="Auto-populates once property API lands"
            />

            {(data.year_built || data.square_feet || data.estimated_value) && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#E5E9F2]/10">
                <ReadOnly label="Year built" value={data.year_built?.toString() || '—'} />
                <ReadOnly label="Square ft" value={data.square_feet?.toString() || '—'} />
                <ReadOnly label="Est. value" value={data.estimated_value ? `$${data.estimated_value.toLocaleString()}` : '—'} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={runAI}
            disabled={!data.address}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-[#D4A24C] to-[#E5B366] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Analyze with AI
          </button>
          <p className="text-center text-xs text-[#E5E9F2]/40">
            Runs Claude Vision against the satellite view + any added photos. About 5–15 seconds.
          </p>
        </div>
      )}

      {/* STEP 4: AI processing */}
      {step === 'analyzing' && (
        <div className="rounded-2xl bg-[#0F1729] border border-[#E5E9F2]/10 p-12 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#D4A24C] mx-auto mb-4" />
          <div className="font-display text-lg mb-1">Running AI roof analysis…</div>
          <p className="text-sm text-[#E5E9F2]/60">Typically 5–15 seconds. Don&apos;t close this tab.</p>
        </div>
      )}

      {/* STEP 5/6: Report + acknowledgment */}
      {step === 'acknowledge' && report && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#D4A24C]" />
              <span className="font-display text-sm uppercase tracking-wider">AI Roof Report</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <ReadOnly label="Condition" value={`${report.condition_score}/10`} />
              <ReadOnly label="Age (est)" value={`${report.estimated_age_years} yrs`} />
              <ReadOnly label="Urgency" value={report.urgency.replace(/_/g, ' ')} />
              <ReadOnly
                label="Repair range"
                value={`$${(report.estimated_repair_cost_low || 0).toLocaleString()}–$${(report.estimated_repair_cost_high || 0).toLocaleString()}`}
              />
            </div>
            {report.damage_types && report.damage_types.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {report.damage_types.map((d) => (
                  <span key={d} className="text-[10px] uppercase tracking-wider bg-[#D4A24C]/10 border border-[#D4A24C]/30 rounded-full px-2 py-1 text-[#D4A24C]">
                    {d.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-[#E5E9F2]/80 whitespace-pre-line">{report.narrative}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/40 mt-4 border-t border-[#E5E9F2]/10 pt-3">
              Generated by Revo AI — for internal estimating only, not a binding quote.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0F1729] border border-[#E5E9F2]/15 p-6">
            <div className="font-display text-lg mb-2">Is this analysis accurate?</div>
            <p className="text-sm text-[#E5E9F2]/60 mb-5">
              You acknowledge the information is correct, or you can dictate a correction for the Estimator.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => submit(false)}
                className="py-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold hover:bg-emerald-500/25 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Yes, submit
              </button>
              <button
                type="button"
                onClick={() => setStep('dictate')}
                className="py-3 rounded-lg bg-[#0F1729] border border-amber-500/40 text-amber-300 font-semibold hover:bg-amber-500/15 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> No, add a correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: Dictation */}
      {step === 'dictate' && (
        <div className="rounded-2xl bg-[#0F1729] border border-[#E5E9F2]/15 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-300" />
            <div className="font-display text-lg">Dictate a correction</div>
          </div>
          <p className="text-sm text-[#E5E9F2]/60">
            Type the note for now — the in-app MP3 recorder lands in the next dispatch. The Estimator sees this verbatim on the lead.
          </p>
          <textarea
            value={dictation}
            onChange={(e) => setDictation(e.target.value)}
            rows={6}
            placeholder='Example: "AI missed the chimney damage on the north slope. Adjuster also flagged hail on the west elevation."'
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('acknowledge')}
              className="px-5 py-2.5 rounded-lg bg-[#0F1729] border border-[#E5E9F2]/15 text-[#E5E9F2]/70 hover:bg-white/5 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={!dictation.trim()}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#D4A24C] to-[#E5B366] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:opacity-90 transition"
            >
              Submit with correction
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: Submitting */}
      {step === 'submitting' && (
        <div className="rounded-2xl bg-[#0F1729] border border-[#E5E9F2]/10 p-12 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#D4A24C] mx-auto mb-4" />
          <div className="font-display text-lg">Submitting lead…</div>
        </div>
      )}

      {/* STEP 9: Done */}
      {step === 'done' && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-[#D4A24C]/10 border border-emerald-500/40 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
            <Check className="w-8 h-8 text-emerald-300" />
          </div>
          <div className="font-display text-2xl mb-1">Lead submitted.</div>
          <p className="text-sm text-[#E5E9F2]/70 mb-4">
            Status: <span className="text-[#D4A24C]">Analyzed</span> — routed to the Estimator queue.
          </p>
          <p className="text-xs text-[#E5E9F2]/50">
            You&apos;ll see your commission post on the dashboard once Paul finalizes the deal.
          </p>
        </div>
      )}
    </main>
  );
}

function Checkpoint({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          done ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-[#E5E9F2]/5 border border-[#E5E9F2]/15'
        }`}
      >
        {done ? <Check className="w-4 h-4 text-emerald-300" /> : <Loader2 className="w-4 h-4 animate-spin text-[#D4A24C]" />}
      </div>
      <div className={done ? 'text-[#E5E9F2]' : 'text-[#E5E9F2]/60'}>{label}</div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-[#E5E9F2]/50 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white text-sm focus:border-[#D4A24C] focus:outline-none"
      />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 border border-[#E5E9F2]/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">{label}</div>
      <div className="text-sm text-[#E5E9F2] mt-0.5">{value}</div>
    </div>
  );
}
