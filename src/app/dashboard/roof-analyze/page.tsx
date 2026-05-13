'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Upload, Loader2, X, Camera, AlertTriangle, CheckCircle2, Clock, ImageIcon, Wand2 } from 'lucide-react';

interface RoofAnalysis {
  condition_score: number;
  estimated_age_years: number;
  urgency: 'immediate' | 'within_30_days' | 'within_6_months' | 'monitor';
  damage_types: string[];
  estimated_repair_cost_low: number;
  estimated_repair_cost_high: number;
  recommended_action: string;
  narrative: string;
}

interface Slot { id: number; label: string; hint: string; file: File | null; url: string | null; previewUrl: string | null; uploading: boolean; }

const SLOTS: Omit<Slot, 'file' | 'url' | 'previewUrl' | 'uploading'>[] = [
  { id: 0, label: 'Front view', hint: 'Wide shot from the street' },
  { id: 1, label: 'Damage close-up', hint: 'Tight on the worst area' },
  { id: 2, label: 'Drone / aerial', hint: 'Top-down or oblique' },
  { id: 3, label: 'Edge or flashing', hint: 'Ridge, valley, chimney base' },
];

const URGENCY_META = {
  immediate: { label: 'Immediate', color: 'bg-red-500/15 text-red-300 border-red-500/40', icon: AlertTriangle },
  within_30_days: { label: '30 days', color: 'bg-orange-500/15 text-orange-300 border-orange-500/40', icon: Clock },
  within_6_months: { label: '6 months', color: 'bg-amber-500/15 text-amber-300 border-amber-500/40', icon: Clock },
  monitor: { label: 'Monitor', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
};

export default function RoofAnalyzePage() {
  const [slots, setSlots] = useState<Slot[]>(SLOTS.map(s => ({ ...s, file: null, url: null, previewUrl: null, uploading: false })));
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RoofAnalysis | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState('');

  const updateSlot = (id: number, patch: Partial<Slot>) => setSlots(s => s.map(slot => slot.id === id ? { ...slot, ...patch } : slot));

  const handleFile = async (id: number, file: File) => {
    updateSlot(id, { file, previewUrl: URL.createObjectURL(file), uploading: true, url: null });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'roof_analyze');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      updateSlot(id, { uploading: false });
      setError(data.error || 'Upload failed');
      return;
    }
    updateSlot(id, { url: data.url, uploading: false });
  };

  const removeSlot = (id: number) => updateSlot(id, { file: null, url: null, previewUrl: null });

  const filledUrls = slots.map(s => s.url).filter((u): u is string => !!u);

  const analyze = async () => {
    if (filledUrls.length === 0) { setError('Upload at least one photo first.'); return; }
    setAnalyzing(true); setError(''); setResult(null); setProvider(null);
    const res = await fetch('/api/roof-analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_urls: filledUrls }),
    });
    const data = await res.json();
    setAnalyzing(false);
    if (!res.ok) { setError(data.error || 'Analysis failed'); return; }
    setResult(data.analysis);
    setProvider(data.provider);
  };

  const reset = () => { setSlots(SLOTS.map(s => ({ ...s, file: null, url: null, previewUrl: null, uploading: false }))); setResult(null); setError(''); setProvider(null); };

  const condition = result?.condition_score ?? 0;
  const conditionColor = condition >= 7 ? 'text-emerald-400' : condition >= 4 ? 'text-amber-400' : 'text-red-400';
  const urgency = result ? URGENCY_META[result.urgency] : null;

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">AI Vision</span></div>
        <h1 className="font-display text-3xl md:text-4xl mb-1">AI Roof Analysis</h1>
        <p className="text-[#E5E9F2]/60 text-sm">Upload up to four photos. Claude reads the roof and returns a damage report in under five seconds.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {slots.map(slot => <PhotoSlot key={slot.id} slot={slot} onPick={f => handleFile(slot.id, f)} onRemove={() => removeSlot(slot.id)} />)}
          </div>

          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={analyze} disabled={analyzing || filledUrls.length === 0 || slots.some(s => s.uploading)} className="revo-btn revo-btn-primary flex-1 disabled:opacity-40 disabled:animate-none">
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing roof…</> : <><Wand2 className="w-4 h-4" /> Analyze with Claude</>}
            </button>
            {(filledUrls.length > 0 || result) && (
              <button onClick={reset} className="revo-btn revo-btn-ghost">Start over</button>
            )}
          </div>

          <p className="text-xs text-[#E5E9F2]/50 leading-relaxed">Powered by Anthropic Claude vision. The active model and key are configurable from <Link href="/admin/settings" className="text-[#D4A24C] hover:underline">Admin → Settings</Link>. If no key is configured, demo samples are used.</p>
        </section>

        <section>
          {!result && !analyzing && (
            <div className="h-full border border-dashed border-[#E5E9F2]/15 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Camera className="w-10 h-10 text-[#E5E9F2]/25 mb-4" />
              <h3 className="font-display text-xl mb-2">Awaiting photos</h3>
              <p className="text-sm text-[#E5E9F2]/55 max-w-xs">Drop in 1-4 photos on the left. The clearer the roof and the closer the damage, the better the report.</p>
            </div>
          )}

          {analyzing && (
            <div className="h-full bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#D4A24C]/20 blur-2xl" />
                <Loader2 className="w-12 h-12 animate-spin text-[#D4A24C] relative" />
              </div>
              <h3 className="font-display text-xl mt-6 mb-2">Claude is reading the roof</h3>
              <p className="text-sm text-[#E5E9F2]/65 max-w-sm">Looking for missing shingles, flashing failures, granule loss, and storm-correlated damage patterns.</p>
            </div>
          )}

          {result && (
            <div className="bg-gradient-to-br from-[#D4A24C]/8 to-[#3B82F6]/8 border border-[#D4A24C]/30 rounded-2xl p-6 md:p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4A24C]" />
                  <span className="font-display text-base md:text-lg">Roof report</span>
                </div>
                {provider && (
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${provider === 'anthropic' ? 'bg-[#D4A24C]/10 text-[#D4A24C] border-[#D4A24C]/30' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'}`}>
                    {provider === 'anthropic' ? 'Claude vision' : 'Demo sample'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <ScoreTile label="Condition" value={`${condition}/10`} valueClass={conditionColor} />
                <ScoreTile label="Est. age" value={`${result.estimated_age_years} yrs`} />
                <ScoreTile label="Urgency" value={urgency?.label || '—'} valueClass={`px-2 py-0.5 rounded-full text-xs border inline-block ${urgency?.color || ''}`} raw />
                <ScoreTile label="Repair range" value={`$${result.estimated_repair_cost_low.toLocaleString()}–$${result.estimated_repair_cost_high.toLocaleString()}`} valueClass="text-[#D4A24C]" small />
              </div>

              {result.damage_types.length > 0 && (
                <div className="mb-5">
                  <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/55 mb-2">Damage detected</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.damage_types.map((d, i) => <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-red-500/10 text-red-300 border border-red-500/30">{d.replace(/_/g, ' ')}</span>)}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/55 mb-2">Recommended action</div>
                <p className="text-sm text-[#E5E9F2]/90 leading-relaxed">{result.recommended_action}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/55 mb-2">Inspector narrative</div>
                <p className="text-sm text-[#E5E9F2]/85 leading-relaxed whitespace-pre-wrap">{result.narrative}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PhotoSlot({ slot, onPick, onRemove }: { slot: Slot; onPick: (f: File) => void; onRemove: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const filled = !!slot.previewUrl;
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  return (
    <div className={`relative rounded-2xl border transition aspect-square overflow-hidden ${filled ? 'border-[#D4A24C]/40 bg-black/40' : 'border-dashed border-[#E5E9F2]/20 bg-[#0F1729]/50 hover:border-[#D4A24C]/40 hover:bg-[#0F1729]'}`}
         onDragOver={e => { e.preventDefault(); }} onDrop={onDrop}>
      {filled ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.previewUrl!} alt={slot.label} className="w-full h-full object-cover" />
          {slot.uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" />
            </div>
          )}
          <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black transition" aria-label="Remove">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="text-xs font-semibold">{slot.label}</div>
          </div>
        </>
      ) : (
        <button onClick={() => ref.current?.click()} className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-[#E5E9F2]/55 hover:text-[#E5E9F2]/90 transition">
          <ImageIcon className="w-8 h-8 mb-3" />
          <div className="text-sm font-semibold">{slot.label}</div>
          <div className="text-[11px] mt-1 text-[#E5E9F2]/45">{slot.hint}</div>
          <div className="text-[10px] mt-3 uppercase tracking-widest text-[#D4A24C] flex items-center gap-1">
            <Upload className="w-3 h-3" /> Tap or drop
          </div>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }} />
    </div>
  );
}

function ScoreTile({ label, value, valueClass = 'text-white', small, raw }: { label: string; value: string; valueClass?: string; small?: boolean; raw?: boolean }) {
  return (
    <div className="bg-black/30 rounded-xl px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/55 mb-0.5">{label}</div>
      {raw ? <div className={`font-semibold ${small ? 'text-sm' : 'text-base'}`}><span className={valueClass}>{value}</span></div> : <div className={`font-display ${small ? 'text-base' : 'text-2xl'} ${valueClass}`}>{value}</div>}
    </div>
  );
}
