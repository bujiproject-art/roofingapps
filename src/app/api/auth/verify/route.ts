import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email, token } = await request.json();
  if (!email || !token) return NextResponse.json({ error: 'Email and token required' }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) {
    console.error('[revo/verify] verifyOtp error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data.user) return NextResponse.json({ error: 'Verification failed' }, { status: 400 });

  // Ensure a revo_users row exists — call the plpgsql helper we created in the migration
  const existing = await supabaseAdmin.from('revo_users').select('id').eq('id', data.user.id).maybeSingle();
  if (!existing.data) {
    const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
    const { error: fnErr } = await supabaseAdmin.rpc('revo_create_expert_profile', {
      p_auth_user_id: data.user.id,
      p_email: data.user.email,
      p_first_name: meta.first_name || null,
      p_last_name: meta.last_name || null,
      p_phone: meta.phone || null,
      p_company_name: meta.company_name || null,
      p_service_area: meta.service_area || null,
    });
    if (fnErr) {
      console.error('[revo/verify] create_expert_profile error:', fnErr);
      return NextResponse.json({ error: 'Profile creation failed: ' + fnErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
