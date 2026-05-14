import { supabaseAdmin } from '@/lib/supabase/admin';
import { GraduationCap, Plus, Pencil, Clock, Users, BookOpen, Video } from 'lucide-react';

interface CourseRow {
  id: string;
  module_number: number;
  title: string;
  description: string | null;
  duration_min: number;
  enrolled: number;
  status: 'published' | 'draft';
  completion_rate: number;
  format: 'video' | 'reading' | 'mixed';
}

const PLACEHOLDER_COURSES: CourseRow[] = [
  { id: 'demo-1', module_number: 1, title: 'Drone Inspection Fundamentals', description: 'FAA Part 107 essentials, capture patterns, photo protocols, GPS metadata, and platform integration.', duration_min: 95, enrolled: 48, status: 'published', completion_rate: 0.74, format: 'video' },
  { id: 'demo-2', module_number: 2, title: 'Insurance Claim Process', description: 'Filing storm/wind/hail claims, working with adjusters, supplementing for code upgrades, ACV vs RCV.', duration_min: 110, enrolled: 36, status: 'published', completion_rate: 0.61, format: 'mixed' },
  { id: 'demo-3', module_number: 3, title: 'Storm Damage Assessment', description: 'Identify hail bruising, wind uplift, granular loss, and impact patterns for credible documentation.', duration_min: 80, enrolled: 41, status: 'draft', completion_rate: 0, format: 'video' },
];

function FormatIcon({ format }: { format: 'video' | 'reading' | 'mixed' }) {
  if (format === 'video') return <Video className="w-3.5 h-3.5" />;
  if (format === 'reading') return <BookOpen className="w-3.5 h-3.5" />;
  return <GraduationCap className="w-3.5 h-3.5" />;
}

export default async function AdminCoursesPage() {
  const { data } = await supabaseAdmin
    .from('revo_course_modules')
    .select('id, module_number, title, description, is_published')
    .order('module_number');

  const real: CourseRow[] = (data || []).map(c => ({
    id: c.id,
    module_number: c.module_number,
    title: c.title,
    description: c.description,
    duration_min: 0,
    enrolled: 0,
    status: c.is_published ? 'published' : 'draft',
    completion_rate: 0,
    format: 'mixed' as const,
  }));
  const courses = real.length > 0 ? real : PLACEHOLDER_COURSES;
  const totalEnrolled = courses.reduce((s, c) => s + c.enrolled, 0);
  const published = courses.filter(c => c.status === 'published').length;
  const avgCompletion = courses.length ? courses.reduce((s, c) => s + c.completion_rate, 0) / courses.length : 0;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">Courses</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{courses.length} modules · {published} published · {totalEnrolled.toLocaleString()} enrollments · {(avgCompletion * 100).toFixed(0)}% avg completion</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Plus className="w-4 h-4" /> New module
        </button>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3 w-12">#</th>
              <th className="text-left px-6 py-3">Module</th>
              <th className="text-left px-6 py-3 w-28">Format</th>
              <th className="text-left px-6 py-3 w-28">Duration</th>
              <th className="text-left px-6 py-3 w-28">Enrolled</th>
              <th className="text-left px-6 py-3 w-36">Completion</th>
              <th className="text-left px-6 py-3 w-28">Status</th>
              <th className="text-right px-6 py-3 w-24">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {courses.map(c => (
              <tr key={c.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-display text-lg text-[#D4A24C]">{c.module_number}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{c.title}</div>
                  {c.description && <div className="text-xs text-[#E5E9F2]/50 mt-1 max-w-md">{c.description}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">
                  <div className="flex items-center gap-1.5">
                    <FormatIcon format={c.format} />
                    <span className="capitalize">{c.format}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{c.duration_min || '—'}m</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{c.enrolled}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden max-w-[64px]">
                      <div className="h-full bg-gradient-to-r from-[#D4A24C] to-[#3B82F6]" style={{ width: `${c.completion_rate * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs">{(c.completion_rate * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${c.status === 'published' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-gray-500/15 text-gray-300 border-gray-500/30'}`}>{c.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-[#E5E9F2]/60 hover:text-[#D4A24C] transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
        <GraduationCap className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#E5E9F2]/70">
          <span className="font-semibold text-[#3B82F6]">Module editor</span> — click any title to edit copy, attach video, or upload lesson PDFs. New Module adds to the curriculum.
        </div>
      </div>
    </main>
  );
}
