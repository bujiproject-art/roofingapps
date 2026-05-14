import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { getSettings, mask } from '@/lib/revo/admin-settings';
import { Key, Save, ShieldCheck } from 'lucide-react';

const KEY_FIELDS: { key: string; label: string; help: string }[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude)', help: 'Powers AI roof analysis (Claude Vision) and the Revo AI chatbot.' },
  { key: 'ATTOM_API_KEY', label: 'ATTOM Data', help: 'Property + owner + tax lookup by lat/lng.' },
  { key: 'GOOGLE_MAPS_API_KEY', label: 'Google Maps Static', help: 'Satellite roof tiles at zoom 19. Fallback uses free Esri imagery.' },
  { key: 'BATCHDATA_API_KEY', label: 'BatchData', help: 'Customer background, equity, soft credit qualifier.' },
  { key: 'RESEND_API_KEY', label: 'Resend', help: 'Role-transition emails (Analyzed → Estimator, Sold → Admin, etc).' },
  { key: 'NEARMAP_API_KEY', label: 'Nearmap (optional)', help: 'Higher-resolution satellite. Overrides Google when set.' },
  { key: 'EAGLEVIEW_API_KEY', label: 'EagleView (optional)', help: 'Aerial measurements and roof reports. Overrides Nearmap when set.' },
];

export default async function AdminKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin.from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const values = await getSettings(KEY_FIELDS.map(f => f.key));

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Admin · Settings</span>
        </div>
        <h1 className="font-display text-4xl mb-1">API Keys</h1>
        <p className="text-sm text-[#E5E9F2]/60">
          Paste your provider keys. Values are stored server-side, never bundled into the client, and surfaced to API routes at request time. Last 4 characters shown after save.
        </p>
      </header>

      <div className="mb-6 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#E5E9F2]/75">
          <span className="font-semibold text-emerald-300">Safe to leave blank.</span> Every endpoint that depends on a key auto-falls back to a realistic placeholder so the demo path keeps working without secrets attached.
        </div>
      </div>

      <form action="/api/admin/settings/keys" method="POST" className="space-y-5">
        {KEY_FIELDS.map(f => (
          <div key={f.key} className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-5">
            <label className="block">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{f.label}</span>
                {values[f.key] && (
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    set · {mask(values[f.key])}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#E5E9F2]/55 mb-3">{f.help}</p>
              <input
                type="password"
                name={f.key}
                placeholder={values[f.key] ? 'Leave blank to keep current value' : 'Paste key here'}
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none font-mono text-sm"
              />
            </label>
          </div>
        ))}

        <button type="submit" className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold hover:bg-[#E5B366] transition flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save keys
        </button>
      </form>
    </main>
  );
}
