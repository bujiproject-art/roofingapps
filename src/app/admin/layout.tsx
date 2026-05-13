import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/RevoUI';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin.from('revo_users').select('first_name,last_name,role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user.email || 'Admin';
  return (
    <div className="md:flex revo-hero-bg min-h-screen">
      <Sidebar variant="admin" userName={name} role={profile.role} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
