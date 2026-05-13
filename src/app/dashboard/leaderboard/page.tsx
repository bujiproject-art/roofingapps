import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Trophy, TrendingUp, DollarSign, Star } from 'lucide-react';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: rows } = await supabaseAdmin
    .from('revo_leaderboard')
    .select('*, revo_users(first_name, last_name, company_name, expert_affiliate_id)')
    .eq('period', period)
    .order('total_revenue', { ascending: false })
    .limit(25);

  const list = rows || [];

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">{period}</span></div>
        <h1 className="font-display text-4xl">Leaderboard</h1>
        <p className="text-[#E5E9F2]/60 text-sm">The top experts in the Revo network this month, ranked by revenue closed.</p>
      </header>

      {list.length === 0 ? (
        <div className="text-center py-20 text-[#E5E9F2]/50 border border-dashed border-[#E5E9F2]/20 rounded-2xl">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-[#E5E9F2]/30" />
          <p>Leaderboard refreshes weekly. Check back soon.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {list.slice(0, 3).map((r, i) => {
            const u = r.revo_users;
            const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.company_name || 'Expert' : 'Expert';
            const medals = ['from-yellow-400 to-amber-600', 'from-gray-300 to-gray-500', 'from-amber-700 to-amber-900'];
            return (
              <div key={r.id} className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-gradient-to-br ${medals[i]} opacity-30 blur-2xl`} />
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`font-display text-3xl bg-gradient-to-br ${medals[i]} bg-clip-text text-transparent`}>#{i+1}</span>
                  <span className="text-xs text-[#E5E9F2]/50 font-mono">{u?.expert_affiliate_id}</span>
                </div>
                <div className="font-display text-lg mb-1">{name}</div>
                <div className="text-xs text-[#E5E9F2]/60 mb-4">{u?.company_name || '—'}</div>
                <div className="space-y-1.5">
                  <Row label="Revenue" value={`$${Math.round(Number(r.total_revenue || 0)).toLocaleString()}`} />
                  <Row label="Jobs closed" value={r.jobs_completed?.toString() || '0'} />
                  <Row label="Referrals" value={r.referrals?.toString() || '0'} />
                  {r.customer_rating && <Row label="Rating" value={`${Number(r.customer_rating).toFixed(1)} ★`} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {list.length > 3 && (
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
              {list.slice(3).map((r, i) => {
                const u = r.revo_users;
                const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.company_name || 'Expert' : 'Expert';
                return (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="px-6 py-3 font-display text-sm">#{i + 4}</td>
                    <td className="px-6 py-3">
                      <div className="text-sm">{name}</div>
                      <div className="text-xs text-[#E5E9F2]/50">{u?.company_name}</div>
                    </td>
                    <td className="px-6 py-3 text-right font-display text-[#D4A24C]">${Math.round(Number(r.total_revenue || 0)).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-sm">{r.jobs_completed || 0}</td>
                    <td className="px-6 py-3 text-right text-sm">{r.referrals || 0}</td>
                    <td className="px-6 py-3 text-right text-sm">{r.customer_rating ? Number(r.customer_rating).toFixed(1) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#E5E9F2]/50">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
