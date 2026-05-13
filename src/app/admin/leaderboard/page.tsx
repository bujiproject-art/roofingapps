import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminLeaderboard() {
  const period = new Date().toISOString().slice(0, 7);
  const { data: rows } = await supabaseAdmin
    .from('revo_leaderboard')
    .select('*, revo_users(first_name, last_name, company_name, expert_affiliate_id)')
    .eq('period', period)
    .order('total_revenue', { ascending: false });
  const list = rows || [];

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl mb-1">Leaderboard ({period})</h1>
        <p className="text-[#E5E9F2]/60 text-sm">Edit network rankings. Numbers feed the public leaderboard immediately.</p>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">#</th>
              <th className="text-left px-6 py-3">Expert</th>
              <th className="text-right px-6 py-3">Revenue</th>
              <th className="text-right px-6 py-3">Jobs</th>
              <th className="text-right px-6 py-3">Refs</th>
              <th className="text-right px-6 py-3">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {list.map((r, i) => {
              const u = r.revo_users;
              const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.company_name : 'Expert';
              return (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-6 py-3 font-display">#{i+1}</td>
                  <td className="px-6 py-3 text-sm">{name}<div className="text-xs text-[#E5E9F2]/50 font-mono">{u?.expert_affiliate_id}</div></td>
                  <td className="px-6 py-3 text-right font-display text-[#D4A24C]">${Math.round(Number(r.total_revenue || 0)).toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">{r.jobs_completed || 0}</td>
                  <td className="px-6 py-3 text-right">{r.referrals || 0}</td>
                  <td className="px-6 py-3 text-right">{r.customer_rating ? Number(r.customer_rating).toFixed(2) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
