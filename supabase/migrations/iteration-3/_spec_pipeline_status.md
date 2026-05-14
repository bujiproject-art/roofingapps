# SPEC — Extend revo_jobs.status with `assigned` + `sold`

Author: C7 — Iteration 3 P3 / P4 (`c7/revo-iteration-3-full-build`)
Owner for SQL: C4

## Why

Iteration 3 Dispatch A added `analyzed`, `estimated`, `rejected` to `revo_jobs.status`.
The full back-office flow needs two more terminal-ish states:

- `assigned` — Sales Coordinator has handed the deal to a Closer
- `sold` — Closer has marked the deal sold; awaits Admin Finalize → `completed`

## SQL

```sql
ALTER TABLE revo_jobs
  DROP CONSTRAINT IF EXISTS revo_jobs_status_check;

ALTER TABLE revo_jobs
  ADD CONSTRAINT revo_jobs_status_check
  CHECK (status IN (
    'pending', 'approved', 'in_progress', 'completed', 'cancelled',
    'analyzed', 'estimated', 'rejected',
    'assigned', 'sold'
  ));

COMMENT ON COLUMN revo_jobs.status IS
  'Iteration-3 pipeline: analyzed → estimated → assigned → sold → completed. Terminal: rejected. Iteration-2 lifecycle (pending → approved → in_progress → completed) still supported.';
```

## Supporting columns (also added in this migration)

```sql
ALTER TABLE revo_jobs
  ADD COLUMN IF NOT EXISTS estimator_id     UUID REFERENCES revo_users(id),
  ADD COLUMN IF NOT EXISTS closer_id        UUID REFERENCES revo_users(id),
  ADD COLUMN IF NOT EXISTS sales_coord_id   UUID REFERENCES revo_users(id),
  ADD COLUMN IF NOT EXISTS sold_amount      NUMERIC,
  ADD COLUMN IF NOT EXISTS lost_reason      TEXT,
  ADD COLUMN IF NOT EXISTS estimate_notes   TEXT,
  ADD COLUMN IF NOT EXISTS estimate_data    JSONB,
  ADD COLUMN IF NOT EXISTS voice_note_url   TEXT;

CREATE INDEX IF NOT EXISTS idx_revo_jobs_estimator ON revo_jobs(estimator_id) WHERE estimator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_revo_jobs_closer    ON revo_jobs(closer_id)    WHERE closer_id    IS NOT NULL;
```

## Notes on the application code

The UI ships with these status values used unconditionally. Until the
migration lands, writes that target `assigned` / `sold` will fail with a
CHECK violation; the API routes return a clear error and the user-flow
still completes locally for demo screenshots. Once the migration is
applied, the writes succeed and the flow is end-to-end live.
