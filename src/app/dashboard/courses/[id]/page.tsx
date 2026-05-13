import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, GraduationCap, Lock } from 'lucide-react';
import MarkCompleteButton from './MarkCompleteButton';

function md(text: string): string {
  // Tiny markdown → HTML for headings, bold, italic, lists
  const lines = text.split('\n');
  const out: string[] = [];
  let inList = false;
  let inOl = false;
  const closeLists = () => { if (inList) { out.push('</ul>'); inList = false; } if (inOl) { out.push('</ol>'); inOl = false; } };
  for (const raw of lines) {
    const line = raw;
    if (/^### (.+)/.test(line)) { closeLists(); out.push(`<h3 class="font-display text-lg md:text-xl mt-6 mb-2 text-[#D4A24C]">${RegExp.$1}</h3>`); continue; }
    if (/^## (.+)/.test(line)) { closeLists(); out.push(`<h2 class="font-display text-xl md:text-2xl mt-8 mb-3">${RegExp.$1}</h2>`); continue; }
    if (/^# (.+)/.test(line)) { closeLists(); out.push(`<h1 class="font-display text-2xl md:text-3xl mt-8 mb-4">${RegExp.$1}</h1>`); continue; }
    if (/^- (.+)/.test(line)) {
      if (!inList) { closeLists(); out.push('<ul class="list-disc pl-6 space-y-1.5 my-3 marker:text-[#D4A24C]">'); inList = true; }
      out.push(`<li>${inline(RegExp.$1)}</li>`);
      continue;
    }
    if (/^(\d+)\. (.+)/.test(line)) {
      if (!inOl) { closeLists(); out.push('<ol class="list-decimal pl-6 space-y-1.5 my-3 marker:text-[#D4A24C]">'); inOl = true; }
      out.push(`<li>${inline(RegExp.$2)}</li>`);
      continue;
    }
    if (line.trim() === '') { closeLists(); continue; }
    closeLists();
    out.push(`<p class="my-3 leading-relaxed text-[#E5E9F2]/85">${inline(line)}</p>`);
  }
  closeLists();
  return out.join('\n');
}

function inline(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: module } = await supabaseAdmin.from('revo_course_modules').select('*').eq('id', id).eq('is_published', true).maybeSingle();
  if (!module) notFound();

  const { data: allModules } = await supabaseAdmin.from('revo_course_modules').select('id, module_number, title').eq('is_published', true).order('module_number');
  const list = allModules || [];
  const idx = list.findIndex(m => m.id === id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx < list.length - 1 ? list[idx + 1] : null;

  const { data: progress } = await supabaseAdmin.from('revo_course_progress').select('module_id, completed_at').eq('expert_id', user.id);
  const completedSet = new Set((progress || []).filter(p => p.completed_at).map(p => p.module_id));
  const isComplete = completedSet.has(id);
  // Lock check: previous module must be done (or this is module 1)
  const prevDone = idx === 0 || completedSet.has(list[idx - 1].id);
  if (!prevDone) {
    return (
      <main className="p-6 md:p-8 max-w-3xl mx-auto">
        <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Course</Link>
        <div className="text-center py-16 border border-dashed border-[#E5E9F2]/15 rounded-2xl">
          <Lock className="w-10 h-10 text-[#E5E9F2]/30 mx-auto mb-4" />
          <h3 className="font-display text-xl mb-2">Module locked</h3>
          <p className="text-sm text-[#E5E9F2]/60">Complete the previous module to unlock this one.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm text-[#E5E9F2]/60 hover:text-white mb-6 transition"><ArrowLeft className="w-4 h-4" /> Course overview</Link>

      <header className="mb-8 pb-6 border-b border-[#E5E9F2]/10">
        <div className="flex items-center gap-2 mb-2"><GraduationCap className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Module {module.module_number} of {list.length}</span></div>
        <h1 className="font-display text-3xl md:text-4xl leading-tight">{module.title}</h1>
        {module.description && <p className="text-[#E5E9F2]/65 mt-2">{module.description}</p>}
      </header>

      <article className="prose-revo" dangerouslySetInnerHTML={{ __html: md(module.content || '') }} />

      <div className="mt-10 pt-6 border-t border-[#E5E9F2]/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <MarkCompleteButton moduleId={id} initiallyComplete={isComplete} />
        <div className="flex items-center gap-2">
          {prev && <Link href={`/dashboard/courses/${prev.id}`} className="revo-btn revo-btn-ghost !py-2 !px-4 !text-sm"><ArrowLeft className="w-4 h-4" /> {prev.title}</Link>}
          {next && <Link href={`/dashboard/courses/${next.id}`} className="revo-btn revo-btn-ghost !py-2 !px-4 !text-sm">{next.title} <ArrowRight className="w-4 h-4" /></Link>}
        </div>
      </div>
    </main>
  );
}
