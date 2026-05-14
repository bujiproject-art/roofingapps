// Admin settings + audit log helpers.
//
// API routes call getSetting() at request time. Reads from revo_admin_settings
// first, falls back to process.env. If the migration hasn't been applied yet
// the DB call errors silently and env-only behaviour stays correct.
import { supabaseAdmin } from '@/lib/supabase/admin';

const ENV_FALLBACK_KEYS = new Set([
  'ANTHROPIC_API_KEY',
  'ATTOM_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'BATCHDATA_API_KEY',
  'RESEND_API_KEY',
  'NEARMAP_API_KEY',
  'EAGLEVIEW_API_KEY',
]);

export async function getSetting(key: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from('revo_admin_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (data?.value) return data.value;
  } catch {
    // Table may not exist yet — fall through to env
  }
  if (ENV_FALLBACK_KEYS.has(key)) {
    return process.env[key] || null;
  }
  return null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  await Promise.all(keys.map(async (k) => { out[k] = await getSetting(k); }));
  return out;
}

export async function setSetting(
  key: string,
  value: string,
  actorId: string | null,
  isSecret = false,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('revo_admin_settings')
      .upsert({ key, value, is_secret: isSecret, updated_at: new Date().toISOString(), updated_by: actorId });
    if (error) return { ok: false, error: error.message };
    await audit(actorId, 'settings.update', key, { is_secret: isSecret, last4: isSecret ? value.slice(-4) : null });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function audit(
  actorId: string | null,
  action: string,
  target: string | null,
  payload: Record<string, unknown> | null,
) {
  try {
    await supabaseAdmin.from('revo_audit_log').insert({
      actor_id: actorId,
      action,
      target,
      payload: payload as object,
    });
  } catch {
    // Best-effort — never crash request on audit failure
    console.log('[audit:fallback]', { actorId, action, target, payload });
  }
}

export function mask(value: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '••••';
  return `•••• •••• •••• ${trimmed.slice(-4)}`;
}

export const DEFAULTS = {
  brand_company_name: 'Revo Roofing AI',
  brand_primary_color: '#D4A24C',
  brand_accent_color: '#3B82F6',
  cross_promo_copy: 'Ready to grow your roofing business beyond inspections? Agent Midas Tier 4 gives you the full back office — SaaS, automation, and a sales team — for $300/mo.',
  paul_affiliate_code: 'PAUL',
};
