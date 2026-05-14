import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';
import { Users } from 'lucide-react';

interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string;
  estimated_value: number | null;
  created_at: string;
  expert_name: string;
}

const PLACEHOLDER_CUSTOMERS: CustomerRow[] = [
  { id: 'demo-1', name: 'Daniel & Maria Rivera', email: 'driver@example.com', phone: '(720) 555-0214', city: 'Aurora', state: 'CO', status: 'signed', estimated_value: 18400, created_at: '2026-05-08T13:21:00Z', expert_name: 'TJ Morgan' },
  { id: 'demo-2', name: 'Ashley Park', email: 'apark@example.com', phone: '(512) 555-0166', city: 'Round Rock', state: 'TX', status: 'proposal_sent', estimated_value: 8200, created_at: '2026-05-09T09:04:00Z', expert_name: 'Sasha Lopez' },
  { id: 'demo-3', name: 'Lakeside Apartments LLC', email: 'pm@lakeside.example', phone: '(813) 555-0102', city: 'Tampa', state: 'FL', status: 'inspected', estimated_value: 26800, created_at: '2026-05-05T18:00:00Z', expert_name: 'Mike Barron' },
  { id: 'demo-4', name: 'Robert Chen', email: 'rchen@example.com', phone: '(216) 555-0173', city: 'Lakewood', state: 'OH', status: 'lead', estimated_value: 4200, created_at: '2026-05-11T11:30:00Z', expert_name: 'Kayla Nguyen' },
  { id: 'demo-5', name: 'Greta Hollis', email: 'ghollis@example.com', phone: '(404) 555-0189', city: 'Marietta', state: 'GA', status: 'in_progress', estimated_value: 22100, created_at: '2026-04-30T15:45:00Z', expert_name: 'Darius Washington' },
  { id: 'demo-6', name: 'Westview Office Park', email: 'ops@westview.example', phone: '(720) 555-0214', city: 'Denver', state: 'CO', status: 'scheduled', estimated_value: 14600, created_at: '2026-05-10T08:11:00Z', expert_name: 'TJ Morgan' },
  { id: 'demo-7', name: 'Maya Patel', email: 'mpatel@example.com', phone: '(512) 555-0301', city: 'Austin', state: 'TX', status: 'completed', estimated_value: 6300, created_at: '2026-04-21T14:50:00Z', expert_name: 'Sasha Lopez' },
];

export default async function AdminCustomers() {
  const { data: real } = await supabaseAdmin
    .from('revo_customers')
    .select('id, name, email, phone, city, state, status, estimated_value, created_at, revo_users!expert_id(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  let list: CustomerRow[];
  if (real && real.length > 0) {
    list = real.map(c => {
      const u = c.revo_users as unknown;
      const user = Array.isArray(u) ? u[0] : u;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        state: c.state,
        status: c.status,
        estimated_value: c.estimated_value,
        created_at: c.created_at,
        expert_name: user ? `${(user as { first_name?: string }).first_name || ''} ${(user as { last_name?: string }).last_name || ''}`.trim() || '—' : '—',
      } as CustomerRow;
    });
  } else {
    list = PLACEHOLDER_CUSTOMERS;
  }

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
              <th className="text-left px-6 py-3 w-32">Status</th>
              <th className="text-right px-6 py-3 w-28">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {list.map(c => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-6 py-3 text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-[#E5E9F2]/50">{c.email || c.phone || ''}</div>
                </td>
                <td className="px-6 py-3 text-sm text-[#E5E9F2]/80">{c.expert_name}</td>
                <td className="px-6 py-3 text-xs text-[#E5E9F2]/70">{[c.city, c.state].filter(Boolean).join(', ')}</td>
                <td className="px-6 py-3"><StatusPill status={c.status} /></td>
                <td className="px-6 py-3 text-right text-sm font-display text-[#D4A24C]">{c.estimated_value ? `$${Number(c.estimated_value).toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list === PLACEHOLDER_CUSTOMERS && (
        <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
          <Users className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#E5E9F2]/70">Showing a sample pipeline. Real customer activity flows in as experts add records in their CRMs.</div>
        </div>
      )}
    </main>
  );
}
