import { createClient } from '@supabase/supabase-js';
// Service-role client — use ONLY in server-side API routes for admin ops.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
