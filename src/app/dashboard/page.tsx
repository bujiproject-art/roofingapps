import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { StatusPill } from '@/components/RevoUI';
import { CrossPromoCTA } from '@/components/RevoCrossPromo';
import { Briefcase, Users, DollarSign, AlertTriangle, Cloud, Sparkles, ArrowRight, Plus, Camera, MapPin, Wand2 } from 'lucide-react';
import ScoutTimeline from './scout/_components/ScoutTimeline';

export default async function ExpertDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('revo_users').select('*').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/register');

  // Iteration 3 — Scout-mode users see the timeline view, not the operator
  // KPI dashboard. Defer to a dedicated component so the operator path stays
  // unchanged for backward-compat.
  if (profile.role === 'scout') {
    return <ScoutTimeline expertId={user.id} firstName={profile.first_name} serviceArea={profile.service_area} />;
  }

  const [{ data: customers }, { data: jobs }] = await Promise.all([
    supabaseAdmin.from('revo_customers').select('*').eq('expert_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('revo_jobs').select('*, revo_customers(name, address, city, state)').eq('expert_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  const customerCount = customers?.length || 0;
  const jobCount = jobs?.length || 0;
  const activeJobs = (jobs || []).filter(j => ['pending','approved','in_progress'].includes(j.status)).length;
  const completedJobs = (jobs || []).filter(j => j.status === 'completed');
  const pipelineValue = (jobs || []).filter(j => ['pending','approved','in_progress'].includes(j.status))
    .reduce((s, j) => s + (Number(j.estimated_cost) || 0), 0);
  const closedRevenue = completedJobs.reduce((s, j) => s + (Number(j.actual_cost ?? j.estimated_cost) || 0), 0);
  const urgentJobs = (jobs || []).filter(j => j.drone_report?.urgency === 'immediate' || j.drone_report?.urgency === 'within_30_days');

  const recentJobs = (jobs || []).slice(0, 5);

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl mb-1">Welcome back, {profile.first_name || 'Expert'}.</h1>
          <p className="text-[#E5E9F2]/60">Service area: {profile.service_area || 'Set your service area in your profile →'}</p>
        </div>
        <Link href="/dashboard/customers" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Plus className="w-4 h-4" /> Add customer
        </Link>
      </header>

      {/* Iteration 3 — Quick Scout CTA. Visible to all operators; lets any
          field rep capture a lead the fast way (GPS → property → satellite →
          AI → submit) without leaving the dashboard. Stays above the KPI fold. */}
      <Link
        href="/dashboard/scout/new"
        className="group relative block mb-8 overflow-hidden rounded-2xl border border-[#D4A24C]/30 bg-gradient-to-br from-[#D4A24C]/15 via-[#1F3C88]/10 to-[#0A0F1F] p-5 transition hover:border-[#D4A24C]/60"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A24C] to-[#E5B366] text-[#0A0F1F] shadow-lg shadow-[#D4A24C]/30">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg leading-tight">Quick Scout</div>
              <div className="text-xs text-[#E5E9F2]/70">
                <MapPin className="mr-1 inline h-3 w-3" /> GPS the address ·{' '}
                <Wand2 className="mr-1 inline h-3 w-3" /> Run AI on the roof · submit in under 5 min
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-[#D4A24C] transition group-hover:translate-x-1" />
        </div>
      </Link>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Users} label="Customers" value={customerCount.toString()} sub={`${activeJobs} active jobs`} accent="gold" />
        <Kpi icon={Briefcase} label="Pipeline value" value={`$${Math.round(pipelineValue).toLocaleString()}`} sub="active estimates" accent="blue" />
        <Kpi icon={DollarSign} label="Closed revenue" value={`$${Math.round(closedRevenue).toLocaleString()}`} sub={`${completedJobs.length} jobs done`} accent="emerald" />
        <Kpi icon={AlertTriangle} label="Urgent" value={urgentJobs.length.toString()} sub="need response now" accent={urgentJobs.length > 0 ? 'red' : 'gray'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Recent activity</h2>
            <Link href="/dashboard/jobs" className="text-xs text-[#D4A24C] hover:text-[#E5B366] flex items-center gap-1">All jobs <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center text-[#E5E9F2]/50 py-12">
              <p className="mb-4">No jobs yet. Add your first customer to get started.</p>
              <Link href="/dashboard/customers" className="px-5 py-2 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition inline-block">Go to Customers</Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#E5E9F2]/5">
              {recentJobs.map(j => (
                <li key={j.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-[#D4A24C]">{j.job_number || '—'}</span>
                      <StatusPill status={j.status} />
                      {j.drone_report && <span className="text-[10px] uppercase tracking-wider text-[#3B82F6]"><Sparkles className="w-3 h-3 inline mr-0.5" />AI analyzed</span>}
                    </div>
                    <div className="text-sm">{j.revo_customers?.name || 'Customer'}</div>
                    <div className="text-xs text-[#E5E9F2]/50">{[j.revo_customers?.city, j.revo_customers?.state].filter(Boolean).join(', ') || (j.job_type || 'job').replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-right">
                    {j.estimated_cost && <div className="font-display text-lg text-[#D4A24C]">${Number(j.estimated_cost).toLocaleString()}</div>}
                    {j.scheduled_date && <div className="text-xs text-[#E5E9F2]/50">{new Date(j.scheduled_date).toLocaleDateString()}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-[#D4A24C]" /><span className="font-display text-sm uppercase tracking-wider">AI Roof Analysis</span></div>
            <p className="text-sm text-[#E5E9F2]/80 mb-4">Drag drone or ground photos into any job and get a GPT-4o Vision damage report in under 3 seconds. Condition score, damage types, repair-cost range, insurance-claim viability.</p>
            <Link href="/dashboard/customers" className="text-xs text-[#D4A24C] hover:text-[#E5B366] flex items-center gap-1">Try it on a customer <ArrowRight className="w-3 h-3" /></Link>
          </div>

          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3"><Cloud className="w-4 h-4 text-[#3B82F6]" /><span className="font-display text-sm uppercase tracking-wider">Storm watch</span></div>
            <p className="text-sm text-[#E5E9F2]/80">No active severe-weather alerts in your service area today.</p>
            <p className="text-xs text-[#E5E9F2]/50 mt-2">Wind, hail, and storm-correlated lead alerts arrive in the next sprint.</p>
          </div>

          <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="font-display text-sm uppercase tracking-wider">Quick links</span></div>
            <div className="space-y-2 text-sm">
              <Link href="/dashboard/courses" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white">10-module course <ArrowRight className="w-3 h-3" /></Link>
              <Link href="/dashboard/chatbot" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white">Ask Revo AI <ArrowRight className="w-3 h-3" /></Link>
              <Link href="/dashboard/leaderboard" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white">Leaderboard <ArrowRight className="w-3 h-3" /></Link>
              <Link href="/dashboard/profile" className="flex items-center justify-between text-[#E5E9F2]/80 hover:text-white">Edit profile <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </div>
        </section>
      </div>

      <CrossPromoCTA variant="wide" />
    </main>
  );
}

function Kpi({ icon: Icon, label, value, sub, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; accent: 'gold' | 'blue' | 'emerald' | 'red' | 'gray' }) {
  const colors = {
    gold: 'text-[#D4A24C]',
    blue: 'text-[#3B82F6]',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    gray: 'text-[#E5E9F2]/60',
  };
  return (
    <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/50">{label}</span>
        <Icon className={`w-4 h-4 ${colors[accent]}`} />
      </div>
      <div className={`font-display text-3xl mb-0.5 ${colors[accent]}`}>{value}</div>
      <div className="text-xs text-[#E5E9F2]/50">{sub}</div>
    </div>
  );
}
