'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function MarkCompleteButton({ moduleId, initiallyComplete }: { moduleId: string; initiallyComplete: boolean }) {
  const router = useRouter();
  const [isComplete, setComplete] = useState(initiallyComplete);
  const [pending, startTransition] = useTransition();

  const mark = async () => {
    if (isComplete) return;
    const res = await fetch('/api/course-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId }),
    });
    if (res.ok) {
      setComplete(true);
      startTransition(() => router.refresh());
    }
  };

  return (
    <button onClick={mark} disabled={isComplete || pending} className={`revo-btn ${isComplete ? '!bg-emerald-500/15 !text-emerald-300 !border-emerald-500/40 !animation-none' : 'revo-btn-primary'} disabled:opacity-100`}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      {isComplete ? 'Module complete' : 'Mark complete'}
    </button>
  );
}
