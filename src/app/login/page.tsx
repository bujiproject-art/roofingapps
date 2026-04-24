'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const sendCode = async () => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setLoading(false);
    if (error) return setError(error.message);
    setStage('otp');
  };

  const verifyCode = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data.user) return setError('Verification failed. Check your code.');
    const { data: profile } = await supabase.from('revo_users').select('role').eq('id', data.user.id).maybeSingle();
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
    router.refresh();
  };

  return (
    <main className="revo-hero-bg min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-12 text-[#E5E9F2]/60 hover:text-white transition text-sm">← Back to home</Link>
        <div className="bg-[#0F1729]/60 border border-[#E5E9F2]/10 rounded-2xl p-10 backdrop-blur-xl">
          <h1 className="font-display text-3xl mb-2">Welcome back</h1>
          <p className="text-[#E5E9F2]/60 mb-8 text-sm">{stage === 'email' ? 'Enter your email to receive a sign-in code.' : 'We sent a 6-digit code to ' + email}</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
          {stage === 'email' ? (
            <>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-4 py-3 mb-4 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none transition" />
              <button onClick={sendCode} disabled={loading || !email} className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition">{loading ? 'Sending…' : 'Send sign-in code'}</button>
              <p className="text-center text-xs text-[#E5E9F2]/50 mt-6">New expert? <Link href="/register" className="text-[#D4A24C] hover:underline">Apply here</Link></p>
            </>
          ) : (
            <>
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-full px-4 py-4 mb-4 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white text-2xl tracking-[0.5em] text-center font-mono focus:border-[#D4A24C] focus:outline-none transition" />
              <button onClick={verifyCode} disabled={loading || code.length !== 6} className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition">{loading ? 'Verifying…' : 'Sign in'}</button>
              <button onClick={() => { setStage('email'); setCode(''); }} className="w-full mt-3 text-sm text-[#E5E9F2]/60 hover:text-white transition">← Use a different email</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
