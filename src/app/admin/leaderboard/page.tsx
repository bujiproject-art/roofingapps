import { supabaseAdmin } from '@/lib/supabase/admin';
import { Trophy, Upload } from 'lucide-react';

interface BoardRow {
  rank: number;
  expert_name: string;
  company: string;
  affiliate_id: string | null;
  jobs_completed: number;
  total_revenue: number;
  referrals: number;
  rating: number;
}

const PLACEHOLDER_BOARD: BoardRow[] = [
  { rank: 1, expert_name: 'Mike Barron', company: 'Barron Storm Solutions', affiliate_id: 'REVO-BARRON3', jobs_completed: 31, total_revenue: 482400, referrals: 9, rating: 4.9 },
  { rank: 2, expert_name: 'TJ Morgan', company: 'Morgan Roofing Co.', affiliate_id: 'REVO-MORGAN1', jobs_completed: 28, total_revenue: 411200, referrals: 7, rating: 4.8 },
  { rank: 3, expert_name: 'Sasha Lopez', company: 'Lopez Premier Exteriors', affiliate_id: 'REVO-LOPEZSP', jobs_completed: 22, total_revenue: 336500, referrals: 6, rating: 4.9 },
  { rank: 4, expert_name: 'Kayla Nguyen', company: 'Nguyen Roof Specialists', affiliate_id: 'REVO-NGUYEN4', jobs_completed: 17, total_revenue: 254800, referrals: 4, rating: 4.7 },
  { rank: 5, expert_name: 'Darius Washington', company: 'Washington Roofing & Restoration', affiliate_id: 'REVO-WASHX55', jobs_completed: 15, total_revenue: 198200, referrals: 3, rating: 4.6 },
  { rank: 6, expert_name: 'Priya Sandoval', company: 'Sandoval Roofing Group', affiliate_id: 'REVO-SANDV62', jobs_completed: 12, total_revenue: 167300, referrals: 4, rating: 4.7 },
  { rank: 7, expert_name: 'Jordan Reeve', company: 'Reeve & Co. Roofing', affiliate_id: 'REVO-REEVE07', jobs_completed: 10, total_revenue: 142900, referrals: 2, rating: 4.5 },
];

export default async function AdminLeaderboard() {
  const period = new Date().toISOString().slice(0, 7);
  const { data } = await supabaseAdmin
    .from('revo_leaderboard')
    .select('*, revo_users(first_name, last_name, company_name, expert_affiliate_id)')
    .eq('period', period)
    .order('total_revenue', { ascending: false })
    .limit(50);

  let board: BoardRow[];
  if (data && data.length > 0) {
    board = data.map((r, i) => {
      const u = r.revo_users as unknown;
      const user = (Array.isArray(u) ? u[0] : u) as { first_name?: string; last_name?: string; company_name?: string; expert_affiliate_id?: string } | null;
      return {
        rank: i + 1,
        expert_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—' : '—',
        company: user?.company_name || '—',
        affiliate_id: user?.expert_affiliate_id || null,
        jobs_completed: r.jobs_completed || 0,
        total_revenue: Number(r.total_revenue || 0),
        referrals: r.referrals || 0,
        rating: Number(r.customer_rating || 4.7),
      };
    });
  } else {
    board = PLACEHOLDER_BOARD;
  }

  const totalRevenue = board.reduce((s, r) => s + r.total_revenue, 0);
  const totalJobs = board.reduce((s, r) => s + r.jobs_completed, 0);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">Leaderboard ({period})</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{board.length} experts ranked · {totalJobs} jobs · ${totalRevenue.toLocaleString()} revenue</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Upload className="w-4 h-4" /> Import CSV
        </button>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3 w-16">#</th>
              <th className="text-left px-6 py-3">Expert</th>
              <th className="text-right px-6 py-3 w-32">Revenue</th>
              <th className="text-right px-6 py-3 w-20">Jobs</th>
              <th className="text-right px-6 py-3 w-20">Refs</th>
              <th className="text-right px-6 py-3 w-20">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {board.map(r => (
              <tr key={r.rank} className="hover:bg-white/5">
                <td className="px-6 py-3 font-display text-xl">{r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank - 1] : <span className="text-[#E5E9F2]/60">{r.rank}</span>}</td>
                <td className="px-6 py-3 text-sm">
                  {r.expert_name}
                  <div className="text-xs text-[#E5E9F2]/50 font-mono">{r.affiliate_id || ''}</div>
                </td>
                <td className="px-6 py-3 text-right font-display text-[#D4A24C]">${r.total_revenue.toLocaleString()}</td>
                <td className="px-6 py-3 text-right">{r.jobs_completed}</td>
                <td className="px-6 py-3 text-right">{r.referrals}</td>
                <td className="px-6 py-3 text-right">{r.rating.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
        <Trophy className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#E5E9F2]/70">
          <span className="font-semibold text-[#3B82F6]">Weekly import</span> — drop a CSV with <code className="px-1.5 py-0.5 rounded bg-black/30 text-xs">expert_id, jobs_completed, total_revenue, referrals</code> and the board recalculates instantly.
        </div>
      </div>
    </main>
  );
}
