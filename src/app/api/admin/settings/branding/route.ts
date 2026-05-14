import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setSetting } from '@/lib/revo/admin-settings';

const ALLOWED = [
  'brand_company_name',
  'brand_logo_url',
  'brand_primary_color',
  'brand_accent_color',
  'cross_promo_copy',
  'paul_affiliate_code',
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
    if (typeof value === 'string') {
      await setSetting(key, value.trim(), user.id, false);
    }
  }

  return NextResponse.redirect(new URL('/admin/settings/branding?saved=1', request.url));
}
