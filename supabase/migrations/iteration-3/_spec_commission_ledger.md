# SPEC — revo_commission_ledger

Author: C7 — Iteration 3 P4 (`c7/revo-iteration-3-full-build`)
Owner for SQL: C4

## Purpose

Append-only ledger of every commission dollar promised or paid out by the platform. Posted by the Finalize Deal action; read by per-role commission dashboards (Expert, Estimator, Closer, Admin P&L).

## Table

```sql
CREATE TABLE IF NOT EXISTS revo_commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES revo_jobs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES revo_customers(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES revo_users(id) ON DELETE SET NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('expert','estimator','closer','sales_coordinator','admin')),
  amount_usd NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES revo_users(id)
);

CREATE INDEX IF NOT EXISTS idx_revo_commission_recipient
  ON revo_commission_ledger (recipient_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revo_commission_job
  ON revo_commission_ledger (job_id);

ALTER TABLE revo_commission_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_commission_recipient_read ON revo_commission_ledger;
CREATE POLICY revo_commission_recipient_read ON revo_commission_ledger
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS revo_commission_admin_all ON revo_commission_ledger;
CREATE POLICY revo_commission_admin_all ON revo_commission_ledger
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

GRANT ALL ON revo_commission_ledger TO service_role;
```

## Default commission rates (defaults, override per deal in Finalize form)

| Role               | Rate of gross sale          |
| ------------------ | --------------------------- |
| Expert (Scout)     | 5%                          |
| Estimator          | Flat $75 per estimate       |
| Closer             | 10%                         |
| Sales Coordinator  | Optional override $25–$100  |

## Write path

`POST /api/finalize-deal` writes one row per non-zero recipient. All-or-nothing transaction with the `revo_jobs` status update from `sold` → `completed`. Audit log entry on every finalize.
