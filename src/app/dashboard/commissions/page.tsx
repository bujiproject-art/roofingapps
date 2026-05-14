import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface LedgerRow {
  id: string;
  amount_usd: number;
  status: 'pending' | 'paid';
  recipient_role: string;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  revo_jobs: { job_number: string | null } | null;
}

const PLACEHOLDER_ROWS: LedgerRow[] = [
  { id: 'demo-1', amount_usd: 1255, status: 'pending', recipient_role: 'expert', notes: 'Scout commission — 5% of $25,100 gross', created_at: '2026-05-13T10:00:00Z', paid_at: null, revo_jobs: { job_number: 'REVO-A4F2K1' } },
  { id: 'demo-2', amount_usd: 75, status: 'paid', recipient_role: 'estimator', notes: 'Per-estimate fee', created_at: '2026-05-12T14:30:00Z', paid_at: '2026-05-13T09:00:00Z', revo_jobs: { job_number: 'REVO-9XY7BB' } },
  { id: 'demo-3', amount_usd: 2210, status: 'paid', recipient_role: 'closer', notes: 'Closer commission — 10% of $22,100 gross', created_at: '2026-05-10T15:00:00Z', paid_at: '2026-05-11T09:00:00Z', revo_jobs: { job_number: 'REVO-BB44CC' } },
  { id: 'demo-4', amount_usd: 1820, status: 'pending', recipient_role: 'expert', notes: 'Scout commission — 5% of $36,400 gross', created_at: '2026-05-09T11:30:00Z', paid_at: null, revo_jobs: { job_number: 'REVO-RT78QP' } },
];

export default async function CommissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabaseAdmin.from('revo_users').select('role').eq('id', user.id).maybeSingle();
  const isAdmin = profile?.role === 'admin';

  let query = supabaseAdmin
    .from('revo_commission_ledger')
    .select('id, amount_usd, status, recipient_role, notes, created_at, paid_at, revo_jobs(job_number)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (!isAdmin) query = query.eq('recipient_user_id', user.id);

  const { data } = await query;
  const rows: LedgerRow[] = (data && data.length > 0)
    ? data.map(r => {
        const j = r.revo_jobs as unknown;
        return { ...r, revo_jobs: (Array.isArray(j) ? j[0] : j) as LedgerRow['revo_jobs'] } as LedgerRow;
      })
    : PLACEHOLDER_ROWS;

  const totalPending = rows.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount_usd), 0);
  const totalPaid = rows.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount_usd), 0);
  const totalYtd = totalPending + totalPaid;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-xs uppercase tracking-widest text-[#D4A24C]">Commissions</span>
        </div>
        <h1 className="font-display text-4xl mb-1">{isAdmin ? 'Network P&L' : 'My earnings'}</h1>
        <p className="text-sm text-[#E5E9F2]/60">{rows.length} ledger entries</p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat icon={Calendar} label="Pending" value={`$${totalPending.toLocaleString()}`} accent="amber" />
        <Stat icon={DollarSign} label="Paid" value={`$${totalPaid.toLocaleString()}`} accent="emerald" />
        <Stat icon={TrendingUp} label="YTD total" value={`$${totalYtd.toLocaleString()}`} accent="gold" />
      </div>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3 w-36">Job #</th>
              {isAdmin && <th className="text-left px-6 py-3 w-32">Role</th>}
              <th className="text-left px-6 py-3">Notes</th>
              <th className="text-right px-6 py-3 w-28">Amount</th>
              <th className="text-left px-6 py-3 w-28">Status</th>
              <th className="text-right px-6 py-3 w-32">Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-3 font-mono text-xs text-[#D4A24C]">{r.revo_jobs?.job_number || '—'}</td>
                {isAdmin && <td className="px-6 py-3 text-sm text-[#E5E9F2]/75 capitalize">{r.recipient_role.replace(/_/g, ' ')}</td>}
                <td className="px-6 py-3 text-sm text-[#E5E9F2]/80">{r.notes || '—'}</td>
                <td className="px-6 py-3 text-right font-display text-[#D4A24C]">${Number(r.amount_usd).toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs border ${r.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>{r.status}</span>
                </td>
                <td className="px-6 py-3 text-right text-xs text-[#E5E9F2]/50">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-xs text-[#E5E9F2]/45 text-center">
        Pending entries pay out monthly on the 15th. Admin → Settings → Branding controls the cross-promo CTA recipients see.
      </div>

      {isAdmin && (
        <div className="mt-4 text-center">
          <Link href="/admin/analytics" className="text-sm text-[#D4A24C] hover:text-[#E5B366]">Open analytics →</Link>
        </div>
      )}
    </main>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: 'gold' | 'emerald' | 'amber' }) {
  const colors = { gold: 'text-[#D4A24C]', emerald: 'text-emerald-300', amber: 'text-amber-300' };
  return (
    <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2"><span className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/55">{label}</span><Icon className={`w-4 h-4 ${colors[accent]}`} /></div>
      <div className={`font-display text-2xl ${colors[accent]}`}>{value}</div>
    </div>
  );
}
