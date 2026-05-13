'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, X, Loader2 } from 'lucide-react';
import { StatusPill, EmptyState } from '@/components/RevoUI';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
  property_type: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.address || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-1">Customers</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{customers.length} total · {filtered.length} showing</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#E5E9F2]/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, address…" className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-[#0F1729] border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0F1729] border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
          <option value="all">All statuses</option>
          <option value="lead">Lead</option>
          <option value="scheduled">Scheduled</option>
          <option value="inspected">Inspected</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="signed">Signed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={customers.length === 0 ? 'No customers yet' : 'No matches'} body={customers.length === 0 ? 'Add your first customer to start building your pipeline.' : 'Try a different search or status.'} cta={customers.length === 0 ? <button onClick={() => setShowNew(true)} className="px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">Add your first customer</button> : null} />
      ) : (
        <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Location</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Contact</th>
                <th className="text-right px-6 py-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F2]/5">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4"><Link href={`/dashboard/customers/${c.id}`} className="font-medium hover:text-[#D4A24C] transition">{c.name}</Link></td>
                  <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-6 py-4"><StatusPill status={c.status} /></td>
                  <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">{c.phone || c.email || '—'}</td>
                  <td className="px-6 py-4 text-right text-sm text-[#E5E9F2]/50">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewCustomerModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}
    </main>
  );
}

function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', property_type: 'residential', status: 'lead', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.name.trim()) return setError('Name required');
    setSaving(true); setError('');
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Save failed');
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-[#0F1729] border border-[#E5E9F2]/10 rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E9F2]/10">
          <h2 className="font-display text-2xl">Add Customer</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#E5E9F2]/60 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name *" className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
          </div>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address" className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
          <div className="grid grid-cols-3 gap-3">
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
            <input value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} placeholder="ZIP" className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
              <option value="lead">Lead</option>
              <option value="scheduled">Scheduled</option>
              <option value="inspected">Inspected</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="signed">Signed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes" rows={3} className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-[#E5E9F2]/10">
          <button onClick={onClose} className="px-5 py-2 text-[#E5E9F2]/60 hover:text-white transition">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:bg-[#E5B366] transition flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
