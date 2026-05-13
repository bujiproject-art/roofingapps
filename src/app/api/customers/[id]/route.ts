import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: customer, error: ce } = await supabaseAdmin
    .from('revo_customers')
    .select('*')
    .eq('id', id)
    .eq('expert_id', user.id)
    .maybeSingle();

  if (ce || !customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: jobs } = await supabaseAdmin
    .from('revo_jobs')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ customer, jobs: jobs || [] });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await request.json();
  delete updates.id;
  delete updates.expert_id;
  delete updates.created_at;

  const { data, error } = await supabaseAdmin
    .from('revo_customers')
    .update(updates)
    .eq('id', id)
    .eq('expert_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: data });
}
