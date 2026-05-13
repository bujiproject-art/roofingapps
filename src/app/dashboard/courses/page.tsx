import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { GraduationCap, PlayCircle, Lock, CheckCircle, ArrowRight } from 'lucide-react';

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: modules } = await supabaseAdmin.from('revo_course_modules').select('*').eq('is_published', true).order('module_number');
  const { data: progress } = await supabaseAdmin.from('revo_course_progress').select('module_id, completed_at').eq('expert_id', user.id);
  const completedSet = new Set((progress || []).filter(p => p.completed_at).map(p => p.module_id));
  const list = modules || [];
  const completedCount = list.filter(m => completedSet.has(m.id)).length;
  const pct = list.length > 0 ? Math.round((completedCount / list.length) * 100) : 0;

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Certification</span></div>
        <h1 className="font-display text-3xl md:text-4xl mb-1">Revo Roofing Course</h1>
        <p className="text-[#E5E9F2]/60 text-sm md:text-base">10 modules · self-paced · certificate on completion</p>
        {list.length > 0 && (
          <div className="mt-5 max-w-md">
            <div className="flex justify-between text-xs text-[#E5E9F2]/55 mb-1.5">
              <span>{completedCount} of {list.length} modules complete</span>
              <span className="font-display text-[#D4A24C]">{pct}%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#D4A24C] to-[#3B82F6] transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </header>

      <div className="space-y-3">
        {list.map((m, i) => {
          const done = completedSet.has(m.id);
          const prevDone = i === 0 || completedSet.has(list[i - 1].id);
          const locked = i > 0 && !prevDone;
          return (
            <Link key={m.id} href={locked ? '#' : `/dashboard/courses/${m.id}`} className={`flex items-center gap-4 p-5 rounded-xl border transition group ${done ? 'bg-[#D4A24C]/5 border-[#D4A24C]/30' : locked ? 'bg-[#0F1729] border-[#E5E9F2]/10 opacity-50 pointer-events-none' : 'bg-[#0F1729] border-[#E5E9F2]/10 hover:border-[#D4A24C]/50 hover:bg-[#0F1729]/80'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#D4A24C] text-[#0A0F1F]' : locked ? 'bg-white/5' : 'bg-white/5 group-hover:bg-[#D4A24C]/15 group-hover:text-[#D4A24C] transition'}`}>
                {done ? <CheckCircle className="w-5 h-5" /> : locked ? <Lock className="w-4 h-4 text-[#E5E9F2]/40" /> : <span className="font-display text-lg">{m.module_number}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base md:text-lg leading-tight">{m.title}</h3>
                <p className="text-sm text-[#E5E9F2]/60 mt-0.5 line-clamp-2">{m.description}</p>
              </div>
              {!locked && (
                <span className="flex items-center gap-1.5 text-sm text-[#D4A24C] shrink-0">
                  {done ? 'Review' : 'Start'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {pct === 100 && (
        <div className="mt-8 bg-gradient-to-br from-[#D4A24C]/10 to-[#3B82F6]/10 border border-[#D4A24C]/30 rounded-2xl p-6 md:p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#D4A24C] mx-auto mb-3" />
          <h3 className="font-display text-2xl mb-2">Course complete</h3>
          <p className="text-[#E5E9F2]/75 mb-4">You're a certified Revo Roofing Expert. Go close some deals.</p>
          <Link href="/dashboard" className="revo-btn revo-btn-primary inline-flex">Back to dashboard <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}
    </main>
  );
}
