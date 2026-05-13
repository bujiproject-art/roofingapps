import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusPill } from '@/components/RevoUI';

export default async function EstimatorEstimates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: jobs } = await supabaseAdmin
    .from('revo_jobs')
    .select('*, revo_customers(name, city, state)')
    .eq('estimator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const list = jobs || [];

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">My estimates</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{list.length} estimates</p>
        </div>
        <Link
          href="/estimator/new"
          className="px-5 py-2.5 rounded-lg bg-[#D4A24C] text-[#0A0F1F] font-semibold hover:bg-[#E5B366] transition text-sm"
        >
          + New estimate
        </Link>
      </header>

      {list.length === 0 ? (
        <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-12 text-center">
          <p className="text-[#E5E9F2]/50">No estimates yet. Start your first one.</p>
        </div>
      ) : (
        <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Job #</th>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Location</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Estimate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F2]/5">
              {list.map((j) => (
                <tr key={j.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 font-mono text-sm text-[#D4A24C]">{j.job_number}</td>
                  <td className="px-6 py-4">{j.revo_customers?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">
                    {[j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={j.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {j.estimated_cost ? `$${Number(j.estimated_cost).toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
