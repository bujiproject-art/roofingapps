-- ============================================================================
-- Iteration 3 — Dispatch A: Roles + permissions (additive only)
--
-- Adds three new roles (scout, estimator, operator) alongside the existing
-- admin + expert roles. 'expert' remains a legacy alias for 'operator' so
-- existing accounts keep their full-CRM access without data migration.
--
-- Also adds revo_users.can_manage_customers — a per-row permission flag
-- that lets Paul migrate Experts from operator-mode to scout-only-mode
-- without changing their role. Defaults to true so backward-compat holds.
--
-- The revo_jobs.status CHECK constraint is expanded to include the
-- iteration-3 pipeline values (analyzed, estimated, rejected) on top of
-- the existing iteration-2 values (pending, approved, in_progress,
-- completed, cancelled). Nothing in the existing data is touched.
--
-- This migration is idempotent: every ALTER guards against re-running.
-- Apply against Paul's Supabase project after iteration-2 schema is in place.
-- ============================================================================

-- ─── 1. revo_users.role enum expansion ────────────────────────────────────
-- Drop old CHECK constraint that only allowed ('admin','expert') so we can
-- add the iteration-3 values. Existing rows keep their role unchanged.
ALTER TABLE revo_users
  DROP CONSTRAINT IF EXISTS revo_users_role_check;

ALTER TABLE revo_users
  ADD CONSTRAINT revo_users_role_check
  CHECK (role IN ('admin', 'operator', 'estimator', 'scout', 'expert'));

COMMENT ON COLUMN revo_users.role IS
  'Iteration 3 roles: admin (Paul + designees, full platform), operator (full CRM expert — successor to ''expert''), estimator (queue-reviewer, prices Analyzed leads), scout (field-only — captures leads via Auto-Capture, cannot edit customers). ''expert'' is preserved as a legacy alias for operator and is granted operator-equivalent privileges everywhere.';

-- ─── 2. Per-row permission flag ────────────────────────────────────────────
-- Lets Paul tune access without changing a user's role. Useful during the
-- Iteration-2 → Iteration-3 transition: existing Experts default to
-- can_manage_customers=true (= operator behavior); new Scouts get
-- can_manage_customers=false explicitly.
ALTER TABLE revo_users
  ADD COLUMN IF NOT EXISTS can_manage_customers BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN revo_users.can_manage_customers IS
  'When true, user can create/edit/delete their own customers and jobs. When false, user can only INSERT new customers via the Scout/Auto-Capture flow and can SELECT but not UPDATE/DELETE existing rows. Admin role bypasses this flag.';

-- ─── 3. Backfill: explicit scout-mode pattern for any pre-existing scouts ──
-- Idempotent: only sets can_manage_customers=false for accounts that have
-- already been promoted to 'scout' role. Existing 'expert' / 'admin' rows
-- keep can_manage_customers=true (default).
UPDATE revo_users
   SET can_manage_customers = false
 WHERE role = 'scout'
   AND can_manage_customers = true;

-- ─── 4. revo_jobs.status pipeline expansion ────────────────────────────────
-- Iteration 2 statuses kept verbatim. Iteration 3 adds:
--   analyzed   — Scout has captured a lead, AI report attached, awaiting Estimator
--   estimated  — Estimator has priced the lead, awaiting Sales Coordinator
--   rejected   — Lead declined at any stage (terminal)
-- 'completed' is reused from iteration-2 as the I3 "Completed" stage so we
-- don't fork the terminal-success state.
ALTER TABLE revo_jobs
  DROP CONSTRAINT IF EXISTS revo_jobs_status_check;

ALTER TABLE revo_jobs
  ADD CONSTRAINT revo_jobs_status_check
  CHECK (status IN (
    'pending', 'approved', 'in_progress', 'completed', 'cancelled',
    'analyzed', 'estimated', 'rejected'
  ));

COMMENT ON COLUMN revo_jobs.status IS
  'Pipeline status. Iteration-2 lifecycle (pending→approved→in_progress→completed) coexists with Iteration-3 Scout-and-Close pipeline (analyzed→estimated→completed, or →rejected). New scout-mode captures create with status=analyzed.';

-- ─── 5. RLS policies — Scout-mode write gating ─────────────────────────────
-- Existing iteration-2 policies remain. We ADD policies that defer to
-- can_manage_customers so a scout-mode user (can_manage_customers=false)
-- can INSERT new customers (captured leads) but cannot UPDATE or DELETE
-- existing customer rows.
--
-- Pattern: every WITH CHECK / USING clause inspects revo_users for the
-- caller and gates write paths accordingly. Admin always bypasses.

-- revo_customers: scout-mode users can INSERT (their captures) but not edit.
DROP POLICY IF EXISTS revo_customers_owner_insert ON revo_customers;
CREATE POLICY revo_customers_owner_insert ON revo_customers
  FOR INSERT TO authenticated
  WITH CHECK (
    expert_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (ru.role = 'admin' OR ru.role IN ('operator', 'expert', 'scout'))
    )
  );

DROP POLICY IF EXISTS revo_customers_owner_update ON revo_customers;
CREATE POLICY revo_customers_owner_update ON revo_customers
  FOR UPDATE TO authenticated
  USING (
    expert_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (ru.role = 'admin' OR ru.can_manage_customers = true)
    )
  )
  WITH CHECK (
    expert_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (ru.role = 'admin' OR ru.can_manage_customers = true)
    )
  );

DROP POLICY IF EXISTS revo_customers_owner_delete ON revo_customers;
CREATE POLICY revo_customers_owner_delete ON revo_customers
  FOR DELETE TO authenticated
  USING (
    expert_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (ru.role = 'admin' OR ru.can_manage_customers = true)
    )
  );

-- Read access stays permissive: a user can SELECT any customer they own
-- regardless of can_manage_customers — Scouts still need to see their own
-- captured leads in their timeline.
DROP POLICY IF EXISTS revo_customers_owner_select ON revo_customers;
CREATE POLICY revo_customers_owner_select ON revo_customers
  FOR SELECT TO authenticated
  USING (
    expert_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND ru.role IN ('admin', 'estimator')
    )
  );

-- revo_jobs: same shape — Scouts can INSERT (Analyzed lead creation) but
-- only operators/admins can UPDATE/DELETE. Estimators can UPDATE jobs in
-- 'analyzed' status to move them to 'estimated'.
DROP POLICY IF EXISTS revo_jobs_owner_insert ON revo_jobs;
CREATE POLICY revo_jobs_owner_insert ON revo_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    expert_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (ru.role = 'admin' OR ru.role IN ('operator', 'expert', 'scout'))
    )
  );

DROP POLICY IF EXISTS revo_jobs_owner_update ON revo_jobs;
CREATE POLICY revo_jobs_owner_update ON revo_jobs
  FOR UPDATE TO authenticated
  USING (
    expert_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (
           ru.role IN ('admin', 'estimator')
           OR (ru.role IN ('operator', 'expert') AND ru.can_manage_customers = true)
         )
    )
  );

DROP POLICY IF EXISTS revo_jobs_owner_delete ON revo_jobs;
CREATE POLICY revo_jobs_owner_delete ON revo_jobs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND (
           ru.role = 'admin'
           OR (ru.role IN ('operator', 'expert') AND ru.can_manage_customers = true AND revo_jobs.expert_id = auth.uid())
         )
    )
  );

DROP POLICY IF EXISTS revo_jobs_select ON revo_jobs;
CREATE POLICY revo_jobs_select ON revo_jobs
  FOR SELECT TO authenticated
  USING (
    expert_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM revo_users ru
       WHERE ru.id = auth.uid()
         AND ru.role IN ('admin', 'estimator')
    )
  );

-- Service role still bypasses (used by API routes that run as supabaseAdmin).
GRANT ALL ON revo_customers TO service_role;
GRANT ALL ON revo_jobs TO service_role;

-- ─── 6. Helper index for scout-mode queries ────────────────────────────────
-- The Estimator queue selects WHERE status='analyzed' ordered by created_at.
-- This partial index keeps that query cheap as the queue grows.
CREATE INDEX IF NOT EXISTS idx_revo_jobs_analyzed_queue
  ON revo_jobs(created_at ASC)
  WHERE status = 'analyzed';

-- ─── 7. Sanity queries (for Paul / Tom to run post-apply) ──────────────────
-- SELECT role, COUNT(*) FROM revo_users GROUP BY role;
-- SELECT can_manage_customers, COUNT(*) FROM revo_users GROUP BY can_manage_customers;
-- SELECT status, COUNT(*) FROM revo_jobs GROUP BY status;
-- ============================================================================
