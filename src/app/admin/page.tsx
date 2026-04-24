import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin.from('revo_users').select('role, first_name').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { count: expertCount } = await supabaseAdmin.from('revo_users').select('id', { count: 'exact', head: true }).eq('role', 'expert');
  const { count: customerCount } = await supabaseAdmin.from('revo_customers').select('id', { count: 'exact', head: true });
  const { count: jobCount } = await supabaseAdmin.from('revo_jobs').select('id', { count: 'exact', head: true });

  return (
    <main className="revo-hero-bg min-h-screen">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#E5E9F2]/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold">R</div>
          <span className="font-display">Revo Admin</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/admin/settings" className="text-[#E5E9F2]/60 hover:text-white transition">Settings</Link>
          <div className="text-[#D4A24C]">{profile?.first_name || 'Admin'}</div>
        </div>
      </nav>
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <h1 className="font-display text-4xl mb-12">Revo Network Overview</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6"><div className="text-[#E5E9F2]/60 text-sm mb-2">Roofing Experts</div><div className="font-display text-4xl">{expertCount ?? 0}</div></div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6"><div className="text-[#E5E9F2]/60 text-sm mb-2">Total Customers</div><div className="font-display text-4xl">{customerCount ?? 0}</div></div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6"><div className="text-[#E5E9F2]/60 text-sm mb-2">Active Jobs</div><div className="font-display text-4xl">{jobCount ?? 0}</div></div>
        </div>
        <div className="bg-[#0F1729]/60 border border-[#E5E9F2]/10 rounded-xl p-8">
          <h2 className="font-display text-2xl mb-4">Admin features (rolling out this week)</h2>
          <ul className="space-y-3 text-[#E5E9F2]/70">
            <li>• Full expert CRM — view/edit every expert, suspend/activate</li>
            <li>• Global customer + job view across all experts</li>
            <li>• Leaderboard import — CSV upload of performance data</li>
            <li>• RAG document ingestion — Google Doc URL to live chatbot</li>
            <li>• FAQ + Course module editor</li>
            <li>• Email catalog + sequence builder (10-step contractor onboarding)</li>
            <li>• LLM provider selector (Anthropic / OpenAI / Gemini)</li>
            <li>• API key management — ATTOM, Resend, LLM providers</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
