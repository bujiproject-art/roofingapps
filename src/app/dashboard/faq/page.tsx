import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { HelpCircle } from 'lucide-react';

export default async function FaqPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: items } = await supabaseAdmin
    .from('revo_faq')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  const grouped = (items || []).reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.category || 'General';
    if (!acc[key]) acc[key] = [] as never;
    (acc[key] as never[]).push(item as never);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><HelpCircle className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Knowledge base</span></div>
        <h1 className="font-display text-4xl mb-1">Frequently asked questions</h1>
        <p className="text-[#E5E9F2]/60">The questions that come up most often from new experts and homeowners.</p>
      </header>

      {categories.length === 0 ? (
        <p className="text-center text-[#E5E9F2]/50 py-12">FAQ entries are loading. Check back soon.</p>
      ) : (
        <div className="space-y-8">
          {categories.map(cat => (
            <section key={cat}>
              <h2 className="font-display text-lg mb-3 text-[#D4A24C]">{cat}</h2>
              <div className="space-y-3">
                {(grouped[cat] || []).map((item: { id: string; question: string; answer: string }) => (
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
      )}
    </main>
  );
}
