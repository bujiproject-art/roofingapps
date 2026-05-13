'use client';
import { useState } from 'react';
import { LifeBuoy, X, Send, Loader2, CheckCircle } from 'lucide-react';

export default function RevoSupportWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', category: 'general', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Name, email, and message are required.');
      return;
    }
    setStatus('sending'); setError('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setStatus('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
      setStatus('error');
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setStatus('idle'); setError('');
      setForm({ name: '', email: '', subject: '', category: 'general', message: '' });
    }, 300);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open support"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full revo-btn-primary font-semibold text-sm shadow-2xl"
      >
        <LifeBuoy className="w-4 h-4" />
        <span className="hidden sm:inline">Support</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={close}>
          <div className="w-full max-w-lg revo-glass-strong rounded-2xl overflow-hidden revo-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E5E9F2]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5 text-[#0A0F1F]" />
                </div>
                <div>
                  <h3 className="font-display text-lg">Revo Support</h3>
                  <p className="text-xs text-[#E5E9F2]/55">We reply within 4 business hours.</p>
                </div>
              </div>
              <button onClick={close} aria-label="Close" className="text-[#E5E9F2]/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === 'sent' ? (
              <div className="p-10 text-center">
                <CheckCircle className="w-12 h-12 text-[#D4A24C] mx-auto mb-4" />
                <h3 className="font-display text-2xl mb-2">Ticket received</h3>
                <p className="text-[#E5E9F2]/65 text-sm mb-6">
                  Paul and the Revo support team have been notified. A confirmation is on its way to <span className="text-[#D4A24C]">{form.email}</span>.
                </p>
                <button onClick={close} className="px-6 py-2.5 rounded-full revo-btn-ghost text-sm">Close</button>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Full name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
                  <Input placeholder="Email *" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                </div>
                <Input placeholder="Subject" value={form.subject} onChange={v => setForm({ ...form, subject: v })} />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none text-sm">
                  <option value="general">General Question</option>
                  <option value="application">Expert Application</option>
                  <option value="inspection">Book an Inspection</option>
                  <option value="insurance">Insurance Claim Help</option>
                  <option value="training">Course / Training</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                </select>
                <textarea
                  placeholder="How can we help? *"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none text-sm resize-none"
                />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/40">Protected by MidasHelp</span>
                  <button
                    onClick={submit}
                    disabled={status === 'sending'}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full revo-btn-primary font-semibold text-sm disabled:opacity-60"
                  >
                    {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {status === 'sending' ? 'Sending…' : 'Send Ticket'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Input({ placeholder, value, onChange, type = 'text' }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none text-sm"
    />
  );
}
