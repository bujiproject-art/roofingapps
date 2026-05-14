import { supabaseAdmin } from '@/lib/supabase/admin';
import { HelpCircle, Plus, Pencil } from 'lucide-react';

interface FaqRow {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

const PLACEHOLDER_FAQS: FaqRow[] = [
  { id: 'demo-1', category: 'Getting Started', question: 'How do I start my first roof inspection?', answer: 'Add the customer in the CRM, schedule the inspection, then capture drone photos. The AI analysis runs automatically once photos are uploaded and is ready in your dashboard within minutes.', sort_order: 1, is_published: true },
  { id: 'demo-2', category: 'Pricing', question: 'What does a typical proposal include?', answer: 'Material breakdown, labor cost, removal of existing roof, underlayment, flashing, ventilation, and warranty terms. AI-generated from your drone capture and regional benchmarks.', sort_order: 2, is_published: true },
  { id: 'demo-3', category: 'Insurance', question: 'How long does an insurance claim take?', answer: '14 to 30 days from filing to approval on a clean storm claim. Supplemental claims add 7 to 14 days. The Claim Toolkit walks you through each step and pre-fills supplements.', sort_order: 3, is_published: true },
  { id: 'demo-4', category: 'Certification', question: 'How long until I earn my Revo Certified badge?', answer: '30 days if you complete all 10 modules and pass the practical assessment. The badge shows on your public profile, proposals, and leaderboard listing.', sort_order: 4, is_published: true },
  { id: 'demo-5', category: 'Payouts', question: 'When do affiliate referrals pay out?', answer: 'Net-30 from your referred job closing. Track every referral in the Leaderboard tab. Payouts hit on the 15th of each month via direct deposit.', sort_order: 5, is_published: false },
];

export default async function AdminFaqPage() {
  const { data } = await supabaseAdmin
    .from('revo_faq')
    .select('id, category, question, answer, sort_order, is_published')
    .order('category')
    .order('sort_order');

  const faqs: FaqRow[] = (data && data.length > 0) ? data : PLACEHOLDER_FAQS;
  const categories = Array.from(new Set(faqs.map(f => f.category || 'General')));

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">FAQ</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{faqs.length} entries · {categories.length} categories</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Plus className="w-4 h-4" /> New question
        </button>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3 w-40">Category</th>
              <th className="text-left px-6 py-3">Question</th>
              <th className="text-left px-6 py-3 w-28">Status</th>
              <th className="text-right px-6 py-3 w-24">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {faqs.map(f => (
              <tr key={f.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4"><span className="inline-block px-2.5 py-1 rounded-full text-xs bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20">{f.category || 'General'}</span></td>
                <td className="px-6 py-4">
                  <div className="font-medium">{f.question}</div>
                  <div className="text-xs text-[#E5E9F2]/55 mt-1 line-clamp-2 max-w-xl">{f.answer}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${f.is_published ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-gray-500/15 text-gray-300 border-gray-500/30'}`}>{f.is_published ? 'published' : 'draft'}</span>
                </td>
                <td className="px-6 py-4 text-right"><button className="p-2 rounded-lg hover:bg-white/5 text-[#E5E9F2]/60 hover:text-[#D4A24C] transition" title="Edit"><Pencil className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#E5E9F2]/70">
          Published entries surface on the expert dashboard FAQ and the public route. Drafts stay admin-only until you flip them live.
        </div>
      </div>
    </main>
  );
}
