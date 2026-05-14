// Cross-promo Tier 4 CTA — Iteration 3 P5.
// Reads copy and affiliate code from revo_admin_settings so Paul tunes
// without a redeploy. Renders on the expert dashboard footer and the
// scout timeline.
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getSettings, DEFAULTS } from '@/lib/revo/admin-settings';

export async function CrossPromoCTA({ variant = 'wide' }: { variant?: 'wide' | 'card' }) {
  const s = await getSettings(['cross_promo_copy', 'paul_affiliate_code']);
  const copy = s.cross_promo_copy || DEFAULTS.cross_promo_copy;
  const affiliate = s.paul_affiliate_code || DEFAULTS.paul_affiliate_code;
  const href = `https://agentmidas.xyz/signup?ref=${encodeURIComponent(affiliate)}&tier=4`;

  if (variant === 'card') {
    return (
      <Link href={href} target="_blank" rel="noopener" className="group block p-5 rounded-xl bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30 hover:border-[#D4A24C]/60 transition">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C] font-semibold">Grow your business</span>
        </div>
        <p className="text-sm text-[#E5E9F2]/80 mb-3 line-clamp-3">{copy}</p>
        <div className="inline-flex items-center gap-1 text-sm text-[#D4A24C] group-hover:text-[#E5B366]">
          Start Tier 4 — $300/mo <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
        </div>
      </Link>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-[#D4A24C]/30 bg-gradient-to-br from-[#D4A24C]/12 via-[#1F3C88]/8 to-[#0A0F1F] p-6 md:p-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#D4A24C]" />
        <span className="text-xs uppercase tracking-widest text-[#D4A24C] font-semibold">Cross-promo · Agent Midas</span>
      </div>
      <div className="md:flex items-center justify-between gap-6">
        <div className="flex-1 mb-4 md:mb-0">
          <h3 className="font-display text-2xl mb-2">Grow your business with Agent Midas</h3>
          <p className="text-sm text-[#E5E9F2]/75 max-w-2xl">{copy}</p>
        </div>
        <Link
          href={href}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition whitespace-nowrap"
        >
          Start Tier 4 — $300/mo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
