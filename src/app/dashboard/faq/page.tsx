import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { HelpCircle } from 'lucide-react';

interface FaqRow { id: string; category: string | null; question: string; answer: string; }

const PLACEHOLDER_FAQS: FaqRow[] = [
  { id: 'p1', category: 'Getting Started', question: 'How do I start my first roof inspection?', answer: 'Add the customer in the CRM, schedule the inspection, then capture drone photos. The AI analysis runs automatically once photos are uploaded and is ready in your dashboard within minutes.' },
  { id: 'p2', category: 'Getting Started', question: 'What gear do I need on day one?', answer: 'A Part-107-rated drone (DJI Mini 3 or Mavic 3 are most common), an iPad or phone for capture, a ladder for safety, and your laptop. The platform handles everything else digitally.' },
  { id: 'p3', category: 'Pricing', question: 'What does a typical proposal include?', answer: 'Material breakdown, labor cost, removal of existing roof, underlayment, flashing, ventilation, and warranty terms. The platform auto-generates every section from your drone capture.' },
  { id: 'p4', category: 'Insurance', question: 'How long does an insurance claim take?', answer: '14 to 30 days from filing to approval on a clean storm claim. Supplemental claims add 7 to 14 days. The Claim Toolkit walks you through each step and pre-fills the supplement forms.' },
  { id: 'p5', category: 'Insurance', question: 'Can I bill the homeowner directly while waiting on insurance?', answer: 'Yes — most experts collect ACV up front and the depreciation check on completion. The platform tracks both checks and reminds the homeowner when the second is due.' },
  { id: 'p6', category: 'Certification', question: 'How long until I earn my Revo Certified badge?', answer: '30 days if you complete all 10 modules and pass the practical assessment. The badge shows on your public profile, your proposals, and your leaderboard listing.' },
  { id: 'p7', category: 'Payouts', question: 'When do affiliate referrals pay out?', answer: 'Net-30 from your referred job closing. Track every referral in the Leaderboard tab. Payouts hit on the 15th of each month via direct deposit.' },
];

export default async function FaqPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: items } = await supabaseAdmin
    .from('revo_faq')
    .select('id, category, question, answer, is_published')
    .eq('is_published', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  const faqs: FaqRow[] = (items && items.length > 0) ? items : PLACEHOLDER_FAQS;

  const grouped = faqs.reduce<Record<string, FaqRow[]>>((acc, item) => {
    const key = item.category || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><HelpCircle className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Knowledge base</span></div>
        <h1 className="font-display text-4xl mb-1">Frequently asked questions</h1>
        <p className="text-[#E5E9F2]/60">The questions that come up most often from new experts and homeowners. Ask Revo AI for anything not covered here.</p>
      </header>

      <div className="space-y-8">
        {categories.map(cat => (
          <section key={cat}>
            <h2 className="font-display text-lg mb-3 text-[#D4A24C]">{cat}</h2>
            <div className="space-y-3">
              {grouped[cat].map(item => (
                <details key={item.id} className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-4 group">
                  <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between list-none">
                    <span>{item.question}</span>
                    <span className="text-[#D4A24C] group-open:rotate-180 transition">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-[#E5E9F2]/80 leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
