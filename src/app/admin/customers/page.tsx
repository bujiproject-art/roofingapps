import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';

export default async function AdminCustomers() {
  const { data: customers } = await supabaseAdmin
    .from('revo_customers')
    .select('*, revo_users(first_name, last_name, company_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  const list = customers || [];

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-4xl mb-1">All customers</h1>
        <p className="text-[#E5E9F2]/60 text-sm">{list.length} customers across the network</p>
      </header>
      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Expert</th>
              <th className="text-left px-6 py-3">Location</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {list.map(c => {
              const expert = c.revo_users ? `${c.revo_users.first_name || ''} ${c.revo_users.last_name || ''}`.trim() : '—';
              return (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="px-6 py-3 text-sm">{c.name}<div className="text-xs text-[#E5E9F2]/50">{c.email || c.phone || ''}</div></td>
                  <td className="px-6 py-3 text-sm text-[#E5E9F2]/80">{expert}</td>
                  <td className="px-6 py-3 text-xs text-[#E5E9F2]/70">{[c.city, c.state].filter(Boolean).join(', ')}</td>
                  <td className="px-6 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-6 py-3 text-right text-sm font-display text-[#D4A24C]">{c.estimated_value ? `$${Number(c.estimated_value).toLocaleString()}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
