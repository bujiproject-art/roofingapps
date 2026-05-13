import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/RevoUI';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin
    .from('revo_users')
    .select('first_name,last_name,role,can_manage_customers')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) redirect('/register');
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user.email || 'Expert';

  // Iteration 3: scout role gets the scout-mode Sidebar variant (limited nav,
  // no customer-management surfaces). Falls back to expert variant for
  // operator / expert / unknown roles — preserves existing behavior.
  const sidebarVariant: 'scout' | 'expert' = profile.role === 'scout' ? 'scout' : 'expert';

  return (
    <div className="md:flex revo-hero-bg min-h-screen">
      <Sidebar variant={sidebarVariant} userName={name} role={profile.role} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
