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
    const question = String(form.get('question') || '').trim();
    const answer = String(form.get('answer') || '').trim();
    if (!question || !answer)
      return NextResponse.json({ error: 'question + answer required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('revo_faq').insert({
      category: String(form.get('category') || '').trim() || 'General',
      question,
      answer,
      sort_order: form.get('sort_order') ? Number(form.get('sort_order')) : 999,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redirect('/admin/faq');
  }

  if (action === 'delete') {
    const id = String(form.get('id') || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('revo_faq').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redirect('/admin/faq');
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
