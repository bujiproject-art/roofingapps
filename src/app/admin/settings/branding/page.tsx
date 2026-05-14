import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { getSettings, DEFAULTS } from '@/lib/revo/admin-settings';
import { Palette, Save } from 'lucide-react';

export default async function AdminBrandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin.from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const keys = ['brand_company_name', 'brand_logo_url', 'brand_primary_color', 'brand_accent_color', 'cross_promo_copy', 'paul_affiliate_code'];
  const v = await getSettings(keys);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Admin · Settings</span>
        </div>
        <h1 className="font-display text-4xl mb-1">Branding & cross-promo</h1>
        <p className="text-sm text-[#E5E9F2]/60">
          Company name, logo, colors, and the cross-promo copy the Tier 4 Agent Midas CTA shows on the expert dashboard. All edits live without a redeploy.
        </p>
      </header>

      <form action="/api/admin/settings/branding" method="POST" className="space-y-5">
        <Section title="Identity">
          <Field name="brand_company_name" label="Company name" defaultValue={v.brand_company_name || DEFAULTS.brand_company_name} />
          <Field name="brand_logo_url" label="Logo URL" defaultValue={v.brand_logo_url || ''} placeholder="https://…/logo.png — leave blank for default" />
        </Section>

        <Section title="Colors">
          <div className="grid grid-cols-2 gap-4">
            <ColorField name="brand_primary_color" label="Primary" defaultValue={v.brand_primary_color || DEFAULTS.brand_primary_color} />
            <ColorField name="brand_accent_color" label="Accent" defaultValue={v.brand_accent_color || DEFAULTS.brand_accent_color} />
          </div>
        </Section>

        <Section title="Cross-promo">
          <div>
            <label className="block text-sm text-[#E5E9F2]/70 mb-1">Affiliate code (embedded in Agent Midas Tier 4 deep link)</label>
            <input
              name="paul_affiliate_code"
              defaultValue={v.paul_affiliate_code || DEFAULTS.paul_affiliate_code}
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-[#E5E9F2]/70 mb-1">CTA copy (Markdown allowed)</label>
            <textarea
              name="cross_promo_copy"
              rows={4}
              defaultValue={v.cross_promo_copy || DEFAULTS.cross_promo_copy}
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none"
            />
          </div>
        </Section>

        <button type="submit" className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold hover:bg-[#E5B366] transition flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save branding
        </button>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-5 space-y-3">
      <h2 className="font-display text-lg mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-[#E5E9F2]/70 mb-1">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none"
      />
    </div>
  );
}

function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-sm text-[#E5E9F2]/70 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg border border-[#E5E9F2]/15" style={{ background: defaultValue }} />
        <input
          name={name}
          defaultValue={defaultValue}
          className="flex-1 px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono"
        />
      </div>
    </div>
  );
}
