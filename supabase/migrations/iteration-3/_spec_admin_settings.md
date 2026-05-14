# SPEC — revo_admin_settings + revo_audit_log

Author: C7 — Iteration 3 P1 (`c7/revo-iteration-3-full-build`)
Owner for SQL: C4

## Purpose

Single key/value store the Admin → Settings pages read and write at runtime. Holds API keys (Anthropic, ATTOM, Google Maps, BatchData, Resend), branding, cross-promo copy, and any other runtime-tunable config. No re-deploys to swap a key.

API routes never read these from the bundle — they call `getSetting(key)` at request time, which falls back to `process.env[key]` if the row is absent.

## Table

```sql
CREATE TABLE IF NOT EXISTS revo_admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES revo_users(id)
);

ALTER TABLE revo_admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_admin_settings_admin_all ON revo_admin_settings;
CREATE POLICY revo_admin_settings_admin_all ON revo_admin_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

GRANT ALL ON revo_admin_settings TO service_role;
```

## Audit log

```sql
CREATE TABLE IF NOT EXISTS revo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES revo_users(id),
  action TEXT NOT NULL,
  target TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_audit_log_action_created
  ON revo_audit_log (action, created_at DESC);

ALTER TABLE revo_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_audit_log_admin_read ON revo_audit_log;
CREATE POLICY revo_audit_log_admin_read ON revo_audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

GRANT ALL ON revo_audit_log TO service_role;
```

## Seed keys (rows the UI expects to exist; missing rows are fine — UI shows blank)

| key                       | is_secret | notes                                                  |
| ------------------------- | --------- | ------------------------------------------------------ |
| ANTHROPIC_API_KEY         | true      | Claude Vision + chatbot                                |
| ATTOM_API_KEY             | true      | Property lookups                                       |
| GOOGLE_MAPS_API_KEY       | true      | Static satellite tiles (zoom 19)                       |
| BATCHDATA_API_KEY         | true      | Customer background / soft credit                      |
| RESEND_API_KEY            | true      | Email notifications                                    |
| NEARMAP_API_KEY           | true      | Future satellite tier                                  |
| EAGLEVIEW_API_KEY         | true      | Future satellite tier                                  |
| brand_company_name        | false     | Default "Revo Roofing AI"                              |
| brand_logo_url            | false     | Public URL                                             |
| brand_primary_color       | false     | Default `#D4A24C`                                      |
| brand_accent_color        | false     | Default `#3B82F6`                                      |
| cross_promo_copy          | false     | Editable Markdown for Agent Midas Tier 4 CTA           |
| paul_affiliate_code       | false     | Affiliate code embedded in cross-promo deep link       |

## Read helper

`src/lib/revo/admin-settings.ts` provides:

- `getSetting(key)` → string | null (DB first, env fallback)
- `getSettings(keys[])` → Record<string, string | null>
- `setSetting(key, value, actorId, isSecret)` → writes and emits an audit log row
- `mask(value)` → returns `••••` + last 4 (for the keys page UI)
