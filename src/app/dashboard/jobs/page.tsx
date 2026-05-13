'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Loader2 } from 'lucide-react';
import { StatusPill, EmptyState } from '@/components/RevoUI';

interface Job {
  id: string;
  job_number: string;
  status: string;
  job_type: string | null;
  estimated_cost: number | null;
  scheduled_date: string | null;
  created_at: string;
  revo_customers: { name: string; address: string | null; city: string | null; state: string | null } | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(d => {
      setJobs(d.jobs || []);
      setLoading(false);
    });
  }, []);

  const filtered = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-1">Jobs</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{jobs.length} total · {filtered.length} showing</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0F1729] border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#D4A24C]" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          body="Jobs are created from a customer's detail page. Start by adding a customer."
          cta={<Link href="/dashboard/customers" className="px-5 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition inline-block">Go to Customers</Link>}
        />
      ) : (
        <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Job #</th>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Estimate</th>
                <th className="text-right px-6 py-3">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F2]/5">
              {filtered.map(j => (
                <tr key={j.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-mono text-xs text-[#D4A24C]">{j.job_number}</td>
                  <td className="px-6 py-4">
                    {j.revo_customers?.name || '—'}
                    <div className="text-xs text-[#E5E9F2]/50">{[j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">{j.job_type?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-6 py-4"><StatusPill status={j.status} /></td>
                  <td className="px-6 py-4 text-right">{j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—'}</td>
                  <td className="px-6 py-4 text-right text-sm text-[#E5E9F2]/60">{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
