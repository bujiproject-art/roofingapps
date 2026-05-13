import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: profile } = await supabaseAdmin
    .from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return { error: 'Admin only', status: 403 as const };
  return { user };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const action = form.get('_action');

  if (action === 'create') {
    const moduleNum = Number(form.get('module_number'));
    const title = String(form.get('title') || '').trim();
    if (!moduleNum || !title) return NextResponse.json({ error: 'module_number + title required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('revo_course_modules').insert({
      module_number: moduleNum,
      title,
      description: String(form.get('description') || '') || null,
      content_markdown: String(form.get('content_markdown') || '') || null,
      duration_minutes: form.get('duration_minutes') ? Number(form.get('duration_minutes')) : null,
      is_published: form.get('is_published') === 'true',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redirect('/admin/courses');
  }

  if (action === 'toggle') {
    const id = String(form.get('id') || '');
    const publish = String(form.get('is_published')) === 'true';
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabaseAdmin
      .from('revo_course_modules').update({ is_published: publish }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redirect('/admin/courses');
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
