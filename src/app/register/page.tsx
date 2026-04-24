'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company_name: '', service_area: '' });
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'form' | 'otp' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Registration failed');
    setStage('otp');
  };

  const verify = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, token: otp }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Verification failed');
    setStage('done');
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  return (
    <main className="revo-hero-bg min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-block mb-8 text-[#E5E9F2]/60 hover:text-white transition text-sm">← Back to home</Link>
        <div className="bg-[#0F1729]/60 border border-[#E5E9F2]/10 rounded-2xl p-10 backdrop-blur-xl">
          {stage === 'form' && (<>
            <div className="text-[#D4A24C] uppercase tracking-widest text-xs font-semibold mb-2">Expert Application</div>
            <h1 className="font-display text-3xl mb-3">Join the network</h1>
            <p className="text-[#E5E9F2]/60 mb-8 text-sm">First 100 experts define the brand. Paul reviews every application.</p>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="First name" className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
              <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Last name" className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            </div>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full px-4 py-3 mb-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full px-4 py-3 mb-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Company name (optional)" className="w-full px-4 py-3 mb-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <input value={form.service_area} onChange={e => setForm({...form, service_area: e.target.value})} placeholder="Service area (city, state)" className="w-full px-4 py-3 mb-6 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <button onClick={submit} disabled={loading || !form.email || !form.first_name} className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition">{loading ? 'Submitting…' : 'Submit application →'}</button>
            <p className="text-center text-xs text-[#E5E9F2]/50 mt-6">Already an expert? <Link href="/login" className="text-[#D4A24C] hover:underline">Sign in</Link></p>
          </>)}
          {stage === 'otp' && (<>
            <h1 className="font-display text-3xl mb-2">Verify your email</h1>
            <p className="text-[#E5E9F2]/60 mb-8 text-sm">We sent a 6-digit code to <strong>{form.email}</strong></p>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
            <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-full px-4 py-4 mb-4 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white text-2xl tracking-[0.5em] text-center font-mono focus:border-[#D4A24C] focus:outline-none" />
            <button onClick={verify} disabled={loading || otp.length !== 6} className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition">{loading ? 'Verifying…' : 'Verify & enter dashboard'}</button>
          </>)}
          {stage === 'done' && (<div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] mx-auto mb-6 flex items-center justify-center text-3xl text-[#0A0F1F]">✓</div>
            <h1 className="font-display text-3xl mb-3">Welcome, {form.first_name}!</h1>
            <p className="text-[#E5E9F2]/60">Your expert dashboard is loading…</p>
          </div>)}
        </div>
      </div>
    </main>
  );
}
