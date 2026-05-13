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
    // Demo flow: skip Supabase OTP send entirely, advance straight to the OTP step.
    // The verify step accepts magic code '123456' which signs the caller in as the demo admin.
    setLoading(true); setError('');
    setStage('otp');
    setLoading(false);
  };

  const verifyCode = async () => {
    setLoading(true); setError('');
    // Demo bypass: code '123456' signs the caller in as the demo admin via password.
    // No expiring tokens, no email round-trip — direct sign-in.
    const bypassCode = process.env.NEXT_PUBLIC_DEMO_BYPASS_CODE; if (bypassCode && code === bypassCode) {
      const { error: pwErr } = await supabase.auth.signInWithPassword({
        email: 'bujiproject@gmail.com',
        password: '123456',
      });
      setLoading(false);
      if (pwErr) return setError('Demo unavailable: ' + pwErr.message);
      router.push('/admin');
      router.refresh();
      return;
    }
    // Normal OTP path
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
              <button onClick={sendCode} disabled={loading || !email} className="revo-btn revo-btn-primary w-full !py-3 disabled:opacity-50">{loading ? 'Sending…' : 'Send sign-in code'}</button>
              <p className="text-center text-xs text-[#E5E9F2]/50 mt-6">New expert? <Link href="/register" className="text-[#D4A24C] hover:underline">Apply here</Link></p>
            </>
          ) : (
            <>
              <input type="text" maxLength={50} value={code} onChange={e => setCode(e.target.value)} placeholder="demo access code" className="w-full px-4 py-4 mb-4 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white text-base font-mono focus:border-[#D4A24C] focus:outline-none transition" />
              <button onClick={verifyCode} disabled={loading || code.length < 8} className="revo-btn revo-btn-primary w-full !py-3 disabled:opacity-50">{loading ? 'Verifying…' : 'Sign in'}</button>
              <button onClick={() => { setStage('email'); setCode(''); }} className="w-full mt-3 text-sm text-[#E5E9F2]/60 hover:text-white transition">← Use a different email</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
