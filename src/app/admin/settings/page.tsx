import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin.from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: settings } = await supabaseAdmin.from('revo_settings').select('*').eq('id', 1).single();

  return (
    <main className="revo-hero-bg min-h-screen">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#E5E9F2]/10">
        <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold">R</div>
          <span className="font-display">Revo Admin · Settings</span>
        </Link>
      </nav>
      <section className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        <h1 className="font-display text-4xl mb-2">API Keys & Configuration</h1>
        <p className="text-[#E5E9F2]/60 mb-10">Paste your API keys here. They're stored server-side and used by every expert on the platform.</p>
        <form action="/api/admin/settings" method="POST" className="space-y-6">
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <h2 className="font-display text-xl mb-4">Property Lookup</h2>
            <label className="block text-sm text-[#E5E9F2]/70 mb-2">ATTOM Data API Key</label>
            <input name="attom_api_key" type="password" defaultValue={settings?.attom_api_key || ''} placeholder="Paste ATTOM API key" className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono text-sm" />
            <p className="text-xs text-[#E5E9F2]/40 mt-2">Sign up: attomdata.com · Gives experts owner lookups by address + drone GPS.</p>
          </div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <h2 className="font-display text-xl mb-4">AI Roof Analysis</h2>
            <label className="block text-sm text-[#E5E9F2]/70 mb-2">Active LLM Provider</label>
            <select name="active_llm_provider" defaultValue={settings?.active_llm_provider || 'anthropic'} className="w-full px-4 py-3 mb-4 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
              <option value="anthropic">Anthropic Claude (recommended for vision)</option>
              <option value="openai">OpenAI GPT-4o</option>
              <option value="gemini">Google Gemini</option>
            </select>
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="block text-xs text-[#E5E9F2]/70 mb-1">Anthropic</label><input name="anthropic_api_key" type="password" defaultValue={settings?.anthropic_api_key || ''} placeholder="sk-ant-…" className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono text-xs" /></div>
              <div><label className="block text-xs text-[#E5E9F2]/70 mb-1">OpenAI</label><input name="openai_api_key" type="password" defaultValue={settings?.openai_api_key || ''} placeholder="sk-…" className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono text-xs" /></div>
              <div><label className="block text-xs text-[#E5E9F2]/70 mb-1">Gemini</label><input name="gemini_api_key" type="password" defaultValue={settings?.gemini_api_key || ''} placeholder="AIza…" className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono text-xs" /></div>
            </div>
          </div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <h2 className="font-display text-xl mb-4">Email (Resend)</h2>
            <label className="block text-sm text-[#E5E9F2]/70 mb-2">Resend API Key</label>
            <input name="resend_api_key" type="password" defaultValue={settings?.resend_api_key || ''} placeholder="re_…" className="w-full px-4 py-3 mb-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono text-sm" />
            <label className="block text-sm text-[#E5E9F2]/70 mb-2">Verified Sending Domain</label>
            <input name="resend_domain" type="text" defaultValue={settings?.resend_domain || ''} placeholder="revoroofing.com" className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none text-sm" />
            <p className="text-xs text-[#E5E9F2]/40 mt-2">Activates the 10-step contractor onboarding sequence + customer quote follow-ups + admin notifications.</p>
          </div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <h2 className="font-display text-xl mb-4">Branding</h2>
            <label className="block text-sm text-[#E5E9F2]/70 mb-2">Company Name</label>
            <input name="company_name" type="text" defaultValue={settings?.company_name || 'Revo Roofing AI'} className="w-full px-4 py-3 mb-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none" />
            <label className="block text-sm text-[#E5E9F2]/70 mb-2">Primary Brand Color</label>
            <input name="primary_color" type="text" defaultValue={settings?.primary_color || '#1F3C88'} className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none font-mono" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold hover:bg-[#E5B366] transition">Save Settings</button>
        </form>
      </section>
    </main>
  );
}
