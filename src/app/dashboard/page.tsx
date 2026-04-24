import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function ExpertDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('revo_users').select('*').eq('id', user.id).maybeSingle();

  if (!profile) redirect('/register');

  const { count: customerCount } = await supabaseAdmin
    .from('revo_customers').select('id', { count: 'exact', head: true }).eq('expert_id', user.id);
  const { count: jobCount } = await supabaseAdmin
    .from('revo_jobs').select('id', { count: 'exact', head: true }).eq('expert_id', user.id);

  return (
    <main className="revo-hero-bg min-h-screen">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#E5E9F2]/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold">R</div>
          <span className="font-display">Revo Expert</span>
        </div>
        <div className="text-sm text-[#E5E9F2]/60">
          {profile.first_name} {profile.last_name} · <span className="text-[#D4A24C]">{profile.expert_affiliate_id}</span>
        </div>
      </nav>
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <h1 className="font-display text-4xl mb-2">Welcome back, {profile.first_name}</h1>
        <p className="text-[#E5E9F2]/60 mb-12">Your service area: {profile.service_area || 'Not set yet'}</p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <div className="text-[#E5E9F2]/60 text-sm mb-2">My Customers</div>
            <div className="font-display text-4xl">{customerCount ?? 0}</div>
          </div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <div className="text-[#E5E9F2]/60 text-sm mb-2">Active Jobs</div>
            <div className="font-display text-4xl">{jobCount ?? 0}</div>
          </div>
          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <div className="text-[#E5E9F2]/60 text-sm mb-2">Affiliate ID</div>
            <div className="font-mono text-2xl text-[#D4A24C]">{profile.expert_affiliate_id}</div>
          </div>
        </div>
        <div className="bg-[#0F1729]/60 border border-[#E5E9F2]/10 rounded-xl p-8">
          <h2 className="font-display text-2xl mb-4">Coming in the next few days</h2>
          <ul className="space-y-3 text-[#E5E9F2]/70">
            <li>• Customer CRM — add, edit, track your pipeline</li>
            <li>• Job board — schedule inspections, upload drone photos, track proposals</li>
            <li>• Property Lookup — ATTOM API integration for instant owner info</li>
            <li>• AI Roof Analysis — Claude / GPT / Gemini roof damage reports</li>
            <li>• 10-module Revo Roofing Course</li>
            <li>• RAG chatbot trained on roofing knowledge</li>
            <li>• Leaderboard — compete with the network</li>
            <li>• Community — post wins, ask questions</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
