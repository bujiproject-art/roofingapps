import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { MessageSquare, Heart, MessageCircle, Trophy, Camera, Pin } from 'lucide-react';

interface Post {
  id: string;
  author: string;
  company: string;
  when: string;
  body: string;
  photo: boolean;
  likes: number;
  comments: number;
  badge?: string;
  pinned?: boolean;
}

const PLACEHOLDER_FEED: Post[] = [
  { id: 'demo-1', author: 'Mike Barron', company: 'Barron Storm Solutions', when: '2h ago', body: 'Closed three storm jobs in Tampa today — drone capture + AI report had two of them signed before the adjuster even showed up. The before/after photos in the proposal are the closer.', photo: true, likes: 24, comments: 6, badge: 'Top performer', pinned: true },
  { id: 'demo-2', author: 'TJ Morgan', company: 'Morgan Roofing Co.', when: '5h ago', body: 'Question for the network — anyone supplemented a roof claim for ice & water shield in zone 5 lately? Adjuster pushed back saying it\'s "betterment." Looking for the code citation that wins this one.', photo: false, likes: 12, comments: 9 },
  { id: 'demo-3', author: 'Sasha Lopez', company: 'Lopez Premier Exteriors', when: '1d ago', body: 'Just earned my Revo Certified badge 🎉 30 days, 6 inspections, 4 signed proposals. The course modules on insurance claims paid for the entire enrollment in one job.', photo: false, likes: 31, comments: 11, badge: 'Newly certified' },
  { id: 'demo-4', author: 'Kayla Nguyen', company: 'Nguyen Roof Specialists', when: '2d ago', body: 'Heads up — Owens Corning announced a 6% price increase on Duration shingles starting June 1. Lock your big jobs now and order materials early.', photo: false, likes: 18, comments: 4 },
  { id: 'demo-5', author: 'Darius Washington', company: 'Washington Roofing & Restoration', when: '3d ago', body: 'First commercial flat-roof job in the bag — 18,000 sq ft TPO on a Marietta office park. Massive thanks to whoever wrote the TPO section in the handbook, that saved me a week of research.', photo: true, likes: 27, comments: 8, badge: 'First commercial' },
];

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

  const real = posts || [];

  const feed: Post[] = real.length > 0
    ? real.map(p => {
        const u = p.revo_users as unknown;
        const user = (Array.isArray(u) ? u[0] : u) as { first_name?: string; last_name?: string; company_name?: string } | null;
        return {
          id: p.id,
          author: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Expert' : 'Expert',
          company: user?.company_name || '',
          when: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          body: p.content,
          photo: false,
          likes: p.likes || 0,
          comments: 0,
          pinned: p.is_pinned,
        };
      })
    : PLACEHOLDER_FEED;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <header className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Network</span></div>
          <h1 className="font-display text-4xl mb-1">Community</h1>
          <p className="text-sm text-[#E5E9F2]/60">{feed.length} posts · founding circle</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <MessageSquare className="w-4 h-4" /> New post
        </button>
      </header>

      <div className="space-y-4">
        {feed.map(p => (
          <article key={p.id} className={`bg-[#0F1729] border rounded-xl p-5 ${p.pinned ? 'border-[#D4A24C]/40' : 'border-[#E5E9F2]/10'}`}>
            <header className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold">{p.author.charAt(0)}</div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {p.pinned && <Pin className="w-3 h-3 text-[#D4A24C]" />}
                    {p.author}
                    {p.badge && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4A24C]/15 text-[#D4A24C] uppercase tracking-wider"><Trophy className="w-3 h-3" />{p.badge}</span>}
                  </div>
                  <div className="text-xs text-[#E5E9F2]/50">{p.company} · {p.when}</div>
                </div>
              </div>
            </header>
            <p className="text-sm text-[#E5E9F2]/85 leading-relaxed mb-3 whitespace-pre-wrap">{p.body}</p>
            {p.photo && (
              <div className="mb-3 h-40 rounded-lg bg-gradient-to-br from-[#1F3C88]/30 to-[#D4A24C]/10 border border-[#E5E9F2]/5 flex items-center justify-center">
                <Camera className="w-8 h-8 text-[#E5E9F2]/30" />
              </div>
            )}
            <footer className="flex items-center gap-5 text-sm text-[#E5E9F2]/55">
              <button className="flex items-center gap-1.5 hover:text-[#D4A24C] transition"><Heart className="w-4 h-4" />{p.likes}</button>
              <button className="flex items-center gap-1.5 hover:text-[#D4A24C] transition"><MessageCircle className="w-4 h-4" />{p.comments}</button>
            </footer>
          </article>
        ))}
      </div>
    </main>
  );
}
