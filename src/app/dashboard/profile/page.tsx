'use client';
import { useEffect, useState } from 'react';
import { Loader2, Save, User as UserIcon, MapPin, Phone, Mail, Building2, Sparkles, Award } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  service_area: string | null;
  bio: string | null;
  avatar_url: string | null;
  expert_affiliate_id: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.profile) setProfile(d.profile);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true); setError('');
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: profile.first_name, last_name: profile.last_name,
        phone: profile.phone, company_name: profile.company_name,
        service_area: profile.service_area, bio: profile.bio,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); return; }
    setSavedAt(new Date());
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4A24C]" /></div>;
  if (!profile) return <div className="p-8 text-red-300">Profile not found.</div>;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-1">My Profile</h1>
          <p className="text-[#E5E9F2]/60 text-sm">This is what customers see when they get your shareable expert page.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#E5E9F2]/50 mb-1">Affiliate ID</div>
          <div className="font-mono text-lg text-[#D4A24C]">{profile.expert_affiliate_id || '—'}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
          {savedAt && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">Saved at {savedAt.toLocaleTimeString()}.</div>}

          <Card title="Contact" icon={UserIcon}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" value={profile.first_name || ''} onChange={v => setProfile({...profile, first_name: v})} />
              <Field label="Last name" value={profile.last_name || ''} onChange={v => setProfile({...profile, last_name: v})} />
            </div>
            <Field label="Phone" value={profile.phone || ''} onChange={v => setProfile({...profile, phone: v})} icon={Phone} placeholder="(404) 555-1212" />
            <Field label="Email" value={profile.email} icon={Mail} disabled />
          </Card>

          <Card title="Business" icon={Building2}>
            <Field label="Company name" value={profile.company_name || ''} onChange={v => setProfile({...profile, company_name: v})} placeholder="Revolution Roofing" />
            <Field label="Service area" value={profile.service_area || ''} onChange={v => setProfile({...profile, service_area: v})} icon={MapPin} placeholder="Atlanta metro · Marietta · Roswell · Kennesaw" />
          </Card>

          <Card title="About me" icon={Sparkles}>
            <textarea
              value={profile.bio || ''}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              rows={6}
              placeholder="Tell customers about your experience, certifications, what you specialize in. This shows up on your shareable expert page and in proposal PDFs."
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none resize-none"
            />
            <p className="text-xs text-[#E5E9F2]/50 mt-2">{(profile.bio || '').length} / 600 characters · auto-included on customer-facing pages</p>
          </Card>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-7 py-3 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Card title="Status" icon={Award}>
            <Pair label="Account" value={<span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">{profile.status}</span>} />
            <Pair label="Role" value={profile.role} />
            <Pair label="Member since" value={new Date(profile.created_at).toLocaleDateString()} />
          </Card>

          <Card title="Shareable page" icon={Sparkles}>
            <p className="text-sm text-[#E5E9F2]/70 mb-3">Customers can scan this code or visit your expert page to book an inspection directly.</p>
            <div className="font-mono text-xs text-[#D4A24C] break-all">revo.agentmidas.xyz/expert/{profile.expert_affiliate_id || '...'}</div>
            <p className="text-xs text-[#E5E9F2]/40 mt-2">QR code generation arrives in next sprint.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[#D4A24C]" />
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, icon: Icon, disabled }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; icon?: React.ComponentType<{ className?: string }>; disabled?: boolean }) {
  return (
    <div>
      <label className="text-xs text-[#E5E9F2]/60 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#E5E9F2]/40" />}
        <input
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none disabled:opacity-50`}
        />
      </div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-[#E5E9F2]/50">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
