'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

interface CloserOption {
  id: string;
  name: string;
  active_load: number;
}

export default function AssignCloserForm({ jobId, closers }: { jobId: string; closers: CloserOption[] }) {
  const router = useRouter();
  const [closerId, setCloserId] = useState(closers[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async () => {
    if (!closerId) return setError('Pick a closer first.');
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/role-transition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sc.assign', job_id: jobId, closer_id: closerId, note: notes }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(body.error || 'Assign failed'); return; }
    router.refresh();
  };

  return (
    <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-start">
      <div className="space-y-2">
        <select
          value={closerId}
          onChange={(e) => setCloserId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none text-sm"
        >
          {closers.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.active_load} active</option>
          ))}
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note for the closer…"
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none text-sm"
        />
        {error && <div className="text-xs text-red-300">{error}</div>}
      </div>
      <button
        onClick={assign}
        disabled={submitting}
        className="self-start flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] disabled:opacity-50 transition"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Assign
      </button>
    </div>
  );
}
