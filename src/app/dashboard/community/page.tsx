import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { MessageSquare, Heart, Pin } from 'lucide-react';

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: posts } = await supabaseAdmin
    .from('revo_community_posts')
    .select('*, revo_users!revo_community_posts_author_id_fkey(first_name, last_name, company_name, expert_affiliate_id)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40);

  const list = posts || [];

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Network</span></div>
        <h1 className="font-display text-4xl mb-1">Community</h1>
        <p className="text-[#E5E9F2]/60">What the rest of the Revo experts are talking about today.</p>
      </header>

      {list.length === 0 ? (
        <div className="text-center py-16 text-[#E5E9F2]/50 border border-dashed border-[#E5E9F2]/20 rounded-2xl">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[#E5E9F2]/30" />
          <p>No posts yet. Be the first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(p => {
            const u = p.revo_users;
            const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.company_name || 'Expert' : 'Expert';
            return (
              <article key={p.id} className={`bg-[#0F1729] border rounded-xl p-5 ${p.is_pinned ? 'border-[#D4A24C]/40' : 'border-[#E5E9F2]/10'}`}>
                <header className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {p.is_pinned && <Pin className="w-3 h-3 text-[#D4A24C]" />}
                      {name}
                    </div>
                    <div className="text-xs text-[#E5E9F2]/50">{u?.company_name || u?.expert_affiliate_id || ''} · {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  </div>
                </header>
                <p className="text-sm text-[#E5E9F2]/85 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                <footer className="flex items-center gap-4 mt-4 pt-3 border-t border-[#E5E9F2]/5 text-xs text-[#E5E9F2]/60">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likes || 0}</span>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
