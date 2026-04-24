-- Revo email system — catalog, sequences, enrollments, send log
BEGIN;

CREATE TABLE IF NOT EXISTS revo_email_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id TEXT UNIQUE NOT NULL, -- e.g. 'EXPERT-WELCOME-01', 'CUSTOMER-QUOTE-01'
  category TEXT NOT NULL CHECK (category IN ('expert_onboarding','admin_notification','customer_marketing','customer_transactional','one_off')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  from_name TEXT DEFAULT 'Revo Roofing AI',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES revo_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revo_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('expert','customer','admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revo_email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES revo_email_sequences(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  delay_hours INT NOT NULL DEFAULT 0,
  catalog_id TEXT REFERENCES revo_email_catalog(catalog_id),
  subject_override TEXT,
  body_html_override TEXT,
  UNIQUE(sequence_id, step_number)
);

CREATE TABLE IF NOT EXISTS revo_email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES revo_email_sequences(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES revo_users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES revo_customers(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  current_step INT DEFAULT 0,
  next_send_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','unsubscribed')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK ((expert_id IS NOT NULL) OR (customer_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_revo_enrollments_due ON revo_email_sequence_enrollments(next_send_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS revo_email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  catalog_id TEXT,
  sequence_id UUID REFERENCES revo_email_sequences(id),
  step_number INT,
  resend_message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','bounced','opened','clicked')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_email_log_recipient ON revo_email_send_log(recipient_email, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_revo_email_log_catalog ON revo_email_send_log(catalog_id, sent_at DESC);

ALTER TABLE revo_email_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE revo_email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE revo_email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE revo_email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revo_email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY revo_email_catalog_admin ON revo_email_catalog FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin'));
CREATE POLICY revo_email_seq_admin ON revo_email_sequences FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin'));
CREATE POLICY revo_email_steps_admin ON revo_email_sequence_steps FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin'));
CREATE POLICY revo_email_enroll_admin ON revo_email_sequence_enrollments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin'));
CREATE POLICY revo_email_log_admin ON revo_email_send_log FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin'));

GRANT ALL ON revo_email_catalog TO service_role;
GRANT ALL ON revo_email_sequences TO service_role;
GRANT ALL ON revo_email_sequence_steps TO service_role;
GRANT ALL ON revo_email_sequence_enrollments TO service_role;
GRANT ALL ON revo_email_send_log TO service_role;

-- Seed the 3 core sequences so Opus can populate their steps when the catalog arrives
INSERT INTO revo_email_sequences (slug, name, description, trigger_event, recipient_type) VALUES
  ('contractor-onboarding-10', 'Contractor Onboarding (10 steps)', 'Ten-email drip for new roofing expert signups', 'expert_signup', 'expert'),
  ('customer-quote-followup', 'Customer Quote Follow-up', 'Drip explaining why choose Revo after a proposal is sent', 'proposal_sent', 'customer'),
  ('admin-notifications', 'Admin Notifications', 'One-off sends to Paul on key events', 'admin_event', 'admin')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
