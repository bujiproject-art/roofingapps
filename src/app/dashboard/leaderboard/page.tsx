import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Trophy, TrendingUp, DollarSign, Star } from 'lucide-react';

interface Row { rank: number; name: string; company: string; affiliate: string; revenue: number; jobs: number; referrals: number; rating: number; }

const PLACEHOLDER_BOARD: Row[] = [
  { rank: 1, name: 'Mike Barron', company: 'Barron Storm Solutions', affiliate: 'REVO-BARRON3', revenue: 482400, jobs: 31, referrals: 9, rating: 4.9 },
  { rank: 2, name: 'TJ Morgan', company: 'Morgan Roofing Co.', affiliate: 'REVO-MORGAN1', revenue: 411200, jobs: 28, referrals: 7, rating: 4.8 },
  { rank: 3, name: 'Sasha Lopez', company: 'Lopez Premier Exteriors', affiliate: 'REVO-LOPEZSP', revenue: 336500, jobs: 22, referrals: 6, rating: 4.9 },
  { rank: 4, name: 'Kayla Nguyen', company: 'Nguyen Roof Specialists', affiliate: 'REVO-NGUYEN4', revenue: 254800, jobs: 17, referrals: 4, rating: 4.7 },
  { rank: 5, name: 'Darius Washington', company: 'Washington Roofing & Restoration', affiliate: 'REVO-WASHX55', revenue: 198200, jobs: 15, referrals: 3, rating: 4.6 },
  { rank: 6, name: 'Priya Sandoval', company: 'Sandoval Roofing Group', affiliate: 'REVO-SANDV62', revenue: 167300, jobs: 12, referrals: 4, rating: 4.7 },
  { rank: 7, name: 'Jordan Reeve', company: 'Reeve & Co. Roofing', affiliate: 'REVO-REEVE07', revenue: 142900, jobs: 10, referrals: 2, rating: 4.5 },
];

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const period = new Date().toISOString().slice(0, 7);
  const { data: rows } = await supabaseAdmin
    .from('revo_leaderboard')
    .select('*, revo_users(first_name, last_name, company_name, expert_affiliate_id)')
    .eq('period', period)
    .order('total_revenue', { ascending: false })
    .limit(25);

  const board: Row[] = (rows && rows.length > 0)
    ? rows.map((r, i) => {
        const u = r.revo_users as unknown;
        const user = (Array.isArray(u) ? u[0] : u) as { first_name?: string; last_name?: string; company_name?: string; expert_affiliate_id?: string } | null;
        return {
          rank: i + 1,
          name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—' : '—',
          company: user?.company_name || '',
          affiliate: user?.expert_affiliate_id || '',
          revenue: Number(r.total_revenue || 0),
          jobs: r.jobs_completed || 0,
          referrals: r.referrals || 0,
          rating: Number(r.customer_rating || 0),
        };
      })
    : PLACEHOLDER_BOARD;

  const medals = ['from-yellow-400 to-amber-600', 'from-gray-300 to-gray-500', 'from-amber-700 to-amber-900'];

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">{period}</span></div>
        <h1 className="font-display text-4xl">Leaderboard</h1>
        <p className="text-[#E5E9F2]/60 text-sm">The top experts in the Revo network this month, ranked by revenue closed.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {board.slice(0, 3).map((r, i) => (
          <div key={r.rank} className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-gradient-to-br ${medals[i]} opacity-30 blur-2xl`} />
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`font-display text-3xl bg-gradient-to-br ${medals[i]} bg-clip-text text-transparent`}>#{r.rank}</span>
              <span className="text-xs text-[#E5E9F2]/50 font-mono">{r.affiliate}</span>
            </div>
            <div className="font-display text-lg mb-1">{r.name}</div>
            <div className="text-xs text-[#E5E9F2]/60 mb-4">{r.company || '—'}</div>
            <div className="space-y-1.5">
              <Detail label="Revenue" value={`$${r.revenue.toLocaleString()}`} />
              <Detail label="Jobs closed" value={r.jobs.toString()} />
              <Detail label="Referrals" value={r.referrals.toString()} />
              {r.rating > 0 && <Detail label="Rating" value={`${r.rating.toFixed(1)} ★`} />}
            </div>
          </div>
        ))}
      </div>

      {board.length > 3 && (
        <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Rank</th>
                <th className="text-left px-6 py-3">Expert</th>
                <th className="text-right px-6 py-3"><DollarSign className="w-3 h-3 inline" /> Revenue</th>
                <th className="text-right px-6 py-3"><TrendingUp className="w-3 h-3 inline" /> Jobs</th>
                <th className="text-right px-6 py-3">Referrals</th>
                <th className="text-right px-6 py-3"><Star className="w-3 h-3 inline" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F2]/5">
              {board.slice(3).map(r => (
                <tr key={r.rank} className="hover:bg-white/5">
                  <td className="px-6 py-3 font-display text-sm">#{r.rank}</td>
                  <td className="px-6 py-3">
                    <div className="text-sm">{r.name}</div>
                    <div className="text-xs text-[#E5E9F2]/50">{r.company}</div>
                  </td>
                  <td className="px-6 py-3 text-right font-display text-[#D4A24C]">${r.revenue.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-sm">{r.jobs}</td>
                  <td className="px-6 py-3 text-right text-sm">{r.referrals}</td>
                  <td className="px-6 py-3 text-right text-sm">{r.rating > 0 ? r.rating.toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-[#E5E9F2]/50">{label}</span><span className="font-semibold">{value}</span></div>;
}
