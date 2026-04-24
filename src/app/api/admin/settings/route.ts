import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabaseAdmin.from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const form = await request.formData();
  const payload: Record<string, string | null> = {
    attom_api_key: (form.get('attom_api_key') as string) || null,
    anthropic_api_key: (form.get('anthropic_api_key') as string) || null,
    openai_api_key: (form.get('openai_api_key') as string) || null,
    gemini_api_key: (form.get('gemini_api_key') as string) || null,
    active_llm_provider: (form.get('active_llm_provider') as string) || 'anthropic',
    resend_api_key: (form.get('resend_api_key') as string) || null,
    resend_domain: (form.get('resend_domain') as string) || null,
    company_name: (form.get('company_name') as string) || 'Revo Roofing AI',
    primary_color: (form.get('primary_color') as string) || '#1F3C88',
  };
  const { error } = await supabaseAdmin.from('revo_settings').update({ ...payload, updated_by: user.id }).eq('id', 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(new URL('/admin/settings?saved=1', request.url), { status: 303 });
}
