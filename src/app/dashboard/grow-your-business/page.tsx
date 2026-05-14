import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, Briefcase, Users, BarChart3, Zap } from 'lucide-react';
import { getSettings, DEFAULTS } from '@/lib/revo/admin-settings';

const FEATURES = [
  { icon: Users, title: 'Hosted sales team', body: 'Closers from the Agent Midas network qualify and pitch on your behalf — you stay in the field.' },
  { icon: Briefcase, title: 'Full SaaS suite', body: 'CRM, invoicing, dispatch, e-sign, dropbox-style file vault — all wired together, all branded as you.' },
  { icon: BarChart3, title: 'Automation + reporting', body: 'Lead-routing rules, drip sequences, weekly P&L digests delivered automatically.' },
  { icon: Zap, title: 'Priority Revo support', body: 'Direct line to a Revo success rep + first access to new AI capabilities the moment they ship.' },
];

const TIER_INCLUDES = [
  'Dedicated success rep (Slack + weekly check-in)',
  'White-label sales hosting — your domain, your branding',
  'Closer team handles inbound calls within 2 minutes',
  'Pre-built integrations: Stripe, Resend, Twilio, DocuSign',
  'AI roof analysis quota — 500 properties/mo included',
  'Cross-promo featured slot in the Revo Roofing AI newsletter',
];

export default async function GrowYourBusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const s = await getSettings(['cross_promo_copy', 'paul_affiliate_code']);
  const copy = s.cross_promo_copy || DEFAULTS.cross_promo_copy;
  const affiliate = s.paul_affiliate_code || DEFAULTS.paul_affiliate_code;
  const href = `https://agentmidas.xyz/signup?ref=${encodeURIComponent(affiliate)}&tier=4`;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Cross-promo · Agent Midas</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Grow your business with Agent Midas Tier 4</h1>
        <p className="text-[#E5E9F2]/70 max-w-2xl">{copy}</p>
      </header>

      <section className="grid md:grid-cols-2 gap-4 mb-8">
        {FEATURES.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="p-5 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#D4A24C]/15 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#D4A24C]" />
                </div>
                <h2 className="font-display text-lg">{f.title}</h2>
              </div>
              <p className="text-sm text-[#E5E9F2]/65 leading-relaxed">{f.body}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#D4A24C]/40 bg-gradient-to-br from-[#D4A24C]/12 via-[#1F3C88]/10 to-[#0A0F1F] p-6 md:p-8 mb-8">
        <div className="md:flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-2">Tier 4 includes</div>
            <ul className="space-y-2">
              {TIER_INCLUDES.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#E5E9F2]/85">
                  <CheckCircle2 className="w-4 h-4 text-[#D4A24C] flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 md:mt-0 md:w-72 flex flex-col items-stretch gap-3">
            <div className="text-center p-5 rounded-xl bg-[#0A0F1F]/60 border border-[#D4A24C]/30">
              <div className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/60">Tier 4</div>
              <div className="font-display text-4xl text-[#D4A24C] mt-1">$300<span className="text-base text-[#E5E9F2]/55">/mo</span></div>
              <div className="text-xs text-[#E5E9F2]/55 mt-1">Cancel anytime. 30-day free trial.</div>
            </div>
            <Link
              href={href}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition"
            >
              Start Tier 4 — $300/mo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="text-center text-xs text-[#E5E9F2]/55 hover:text-white transition">Back to dashboard</Link>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-[#E5E9F2]/45">
        Powered by Agent Midas · Tracking ref <span className="font-mono text-[#D4A24C]">{affiliate}</span>
      </p>
    </main>
  );
}
