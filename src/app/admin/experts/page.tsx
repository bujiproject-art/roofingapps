import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function AdminExperts() {
  const { data: experts } = await supabaseAdmin
    .from('revo_users')
    .select('*')
    .eq('role', 'expert')
    .order('created_at', { ascending: false });

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">Experts</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{(experts || []).length} experts in the network</p>
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
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {(experts || []).map(e => {
              const name = `${e.first_name || ''} ${e.last_name || ''}`.trim() || '—';
              return (
                <tr key={e.id} className="hover:bg-white/5">
                  <td className="px-6 py-3 font-mono text-xs text-[#D4A24C]">{e.expert_affiliate_id || '—'}</td>
                  <td className="px-6 py-3 text-sm">{name}<div className="text-xs text-[#E5E9F2]/50">{e.email}</div></td>
                  <td className="px-6 py-3 text-sm">{e.company_name || '—'}</td>
                  <td className="px-6 py-3 text-xs text-[#E5E9F2]/70">{e.service_area || '—'}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-gray-500/10 text-gray-300 border border-gray-500/30'}`}>{e.status}</span></td>
                  <td className="px-6 py-3 text-right text-xs text-[#E5E9F2]/50">{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
