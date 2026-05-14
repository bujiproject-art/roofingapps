import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, MapPin } from 'lucide-react';

interface ExpertRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  service_area: string | null;
  expert_affiliate_id: string | null;
  status: string;
  created_at: string;
}

const PLACEHOLDER_EXPERTS: ExpertRow[] = [
  { id: 'demo-1', email: 'tj.morgan@example.com', first_name: 'TJ', last_name: 'Morgan', company_name: 'Morgan Roofing Co.', service_area: 'Denver, CO', expert_affiliate_id: 'REVO-MORGAN1', status: 'active', created_at: '2026-04-02T15:11:00Z' },
  { id: 'demo-2', email: 'sasha.lopez@example.com', first_name: 'Sasha', last_name: 'Lopez', company_name: 'Lopez Premier Exteriors', service_area: 'Austin, TX', expert_affiliate_id: 'REVO-LOPEZSP', status: 'active', created_at: '2026-04-09T18:42:00Z' },
  { id: 'demo-3', email: 'mike.barron@example.com', first_name: 'Mike', last_name: 'Barron', company_name: 'Barron Storm Solutions', service_area: 'Tampa, FL', expert_affiliate_id: 'REVO-BARRON3', status: 'active', created_at: '2026-04-15T09:30:00Z' },
  { id: 'demo-4', email: 'kayla.nguyen@example.com', first_name: 'Kayla', last_name: 'Nguyen', company_name: 'Nguyen Roof Specialists', service_area: 'Cleveland, OH', expert_affiliate_id: 'REVO-NGUYEN4', status: 'active', created_at: '2026-04-22T12:14:00Z' },
  { id: 'demo-5', email: 'darius.washington@example.com', first_name: 'Darius', last_name: 'Washington', company_name: 'Washington Roofing & Restoration', service_area: 'Atlanta, GA', expert_affiliate_id: 'REVO-WASHX55', status: 'suspended', created_at: '2026-03-28T20:00:00Z' },
];

export default async function AdminExperts() {
  const { data: real } = await supabaseAdmin
    .from('revo_users')
    .select('id, email, first_name, last_name, company_name, service_area, expert_affiliate_id, status, created_at')
    .eq('role', 'expert')
    .order('created_at', { ascending: false });

  const experts: ExpertRow[] = (real && real.length > 0) ? real : PLACEHOLDER_EXPERTS;
  const active = experts.filter(e => e.status === 'active').length;

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">Experts</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{experts.length} total · {active} active</p>
        </div>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Affiliate ID</th>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Company</th>
              <th className="text-left px-6 py-3">Service area</th>
              <th className="text-left px-6 py-3 w-28">Status</th>
              <th className="text-right px-6 py-3 w-28">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {experts.map(e => {
              const name = [e.first_name, e.last_name].filter(Boolean).join(' ') || '—';
              const isReal = !e.id.startsWith('demo-');
              return (
                <tr key={e.id} className="hover:bg-white/5">
                  <td className="px-6 py-3 font-mono text-xs text-[#D4A24C]">{e.expert_affiliate_id || '—'}</td>
                  <td className="px-6 py-3 text-sm">
                    {isReal ? <Link href={`/admin/experts/${e.id}`} className="hover:text-[#D4A24C] transition">{name}</Link> : name}
                    <div className="text-xs text-[#E5E9F2]/50">{e.email}</div>
                  </td>
                  <td className="px-6 py-3 text-sm">{e.company_name || '—'}</td>
                  <td className="px-6 py-3 text-xs text-[#E5E9F2]/70"><div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{e.service_area || '—'}</div></td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : e.status === 'suspended' ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-gray-500/10 text-gray-300 border border-gray-500/30'}`}>{e.status}</span></td>
                  <td className="px-6 py-3 text-right text-xs text-[#E5E9F2]/50">{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {experts === PLACEHOLDER_EXPERTS && (
        <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
          <Users className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#E5E9F2]/70">Showing a sample roster. Real experts appear here automatically as they complete registration.</div>
        </div>
      )}
    </main>
  );
}
