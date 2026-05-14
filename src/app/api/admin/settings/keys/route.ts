import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setSetting } from '@/lib/revo/admin-settings';

const ALLOWED = [
  'ANTHROPIC_API_KEY',
  'ATTOM_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'BATCHDATA_API_KEY',
  'RESEND_API_KEY',
  'NEARMAP_API_KEY',
  'EAGLEVIEW_API_KEY',
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const { data: profile } = await supabaseAdmin.from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));

  const form = await request.formData();
  for (const key of ALLOWED) {
    const value = form.get(key);
    if (typeof value === 'string' && value.trim().length > 0) {
      await setSetting(key, value.trim(), user.id, true);
    }
  }

  return NextResponse.redirect(new URL('/admin/settings/keys?saved=1', request.url));
}
