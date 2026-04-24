-- ============================================================================
-- Revo Roofing AI — Iteration 2 Schema Migration
-- ============================================================================
-- Full multi-tenant schema for the Revo Roofing Expert platform. All tables
-- prefixed revo_* to coexist cleanly with Agent Midas tables in the same
-- Supabase project (jkahbsdcyrigoxkqksyj).
--
-- Auth model:
--   - Supabase auth.users is the source of truth for authentication
--   - revo_users.id mirrors auth.users.id (same UUID)
--   - revo_users.role ∈ {admin, expert} drives RLS
--   - Admin can see everything; experts can only see their own records
--
-- Safe to re-run — all tables use CREATE TABLE IF NOT EXISTS, indexes use
-- CREATE INDEX IF NOT EXISTS, policies check for existence before create.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. revo_users — expert + admin profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_users (
  id UUID PRIMARY KEY, -- mirrors auth.users.id
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'expert')) DEFAULT 'expert',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  expert_affiliate_id TEXT UNIQUE, -- unique tracking code per expert
  company_name TEXT,
  service_area TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_users_role ON revo_users(role);
CREATE INDEX IF NOT EXISTS idx_revo_users_status ON revo_users(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_revo_users_affiliate ON revo_users(expert_affiliate_id) WHERE expert_affiliate_id IS NOT NULL;

ALTER TABLE revo_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_users_admin_all ON revo_users;
CREATE POLICY revo_users_admin_all ON revo_users
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

DROP POLICY IF EXISTS revo_users_self_select ON revo_users;
CREATE POLICY revo_users_self_select ON revo_users
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS revo_users_self_update ON revo_users;
CREATE POLICY revo_users_self_update ON revo_users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Service role bypasses RLS for admin API routes
GRANT ALL ON revo_users TO service_role;

-- ---------------------------------------------------------------------------
-- 2. revo_settings — single-row admin config (API keys, LLM selection, branding)
-- ---------------------------------------------------------------------------
-- Keys are stored as TEXT for now. TODO(phase 5): encrypt at rest via pgcrypto
-- before Paul puts production keys in. Plaintext is acceptable for demo phase
-- because only service_role + admin reads the row.
CREATE TABLE IF NOT EXISTS revo_settings (
  id INT PRIMARY KEY DEFAULT 1,
  CHECK (id = 1), -- enforce singleton
  attom_api_key TEXT,
  anthropic_api_key TEXT,
  openai_api_key TEXT,
  gemini_api_key TEXT,
  active_llm_provider TEXT DEFAULT 'anthropic' CHECK (active_llm_provider IN ('anthropic', 'openai', 'gemini')),
  resend_api_key TEXT,
  resend_domain TEXT,
  company_name TEXT DEFAULT 'Revo Roofing AI',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1F3C88',
  updated_by UUID REFERENCES revo_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the singleton row
INSERT INTO revo_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE revo_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_settings_admin_all ON revo_settings;
CREATE POLICY revo_settings_admin_all ON revo_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );
GRANT ALL ON revo_settings TO service_role;

-- ---------------------------------------------------------------------------
-- 3. revo_customers — per-expert CRM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES revo_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial') OR property_type IS NULL),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead','scheduled','inspected','proposal_sent','signed','in_progress','completed','lost')),
  source TEXT,
  notes TEXT,
  roof_type TEXT,
  roof_age_years INT,
  damage_type TEXT,
  estimated_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_customers_expert ON revo_customers(expert_id);
CREATE INDEX IF NOT EXISTS idx_revo_customers_status ON revo_customers(expert_id, status);

ALTER TABLE revo_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_customers_admin_all ON revo_customers;
CREATE POLICY revo_customers_admin_all ON revo_customers
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

DROP POLICY IF EXISTS revo_customers_expert_own ON revo_customers;
CREATE POLICY revo_customers_expert_own ON revo_customers
  FOR ALL TO authenticated USING (expert_id = auth.uid()) WITH CHECK (expert_id = auth.uid());

GRANT ALL ON revo_customers TO service_role;

-- ---------------------------------------------------------------------------
-- 4. revo_jobs — job pipeline per expert
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES revo_users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES revo_customers(id) ON DELETE CASCADE,
  job_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','in_progress','completed','cancelled')),
  job_type TEXT CHECK (job_type IN ('full_replacement','repair','inspection','storm_damage','maintenance') OR job_type IS NULL),
  description TEXT,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  materials TEXT,
  scheduled_date DATE,
  completed_date DATE,
  before_photos JSONB DEFAULT '[]'::jsonb,
  after_photos JSONB DEFAULT '[]'::jsonb,
  drone_photos JSONB DEFAULT '[]'::jsonb,
  drone_report JSONB,
  insurance_claim_number TEXT,
  insurance_company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_jobs_expert ON revo_jobs(expert_id);
CREATE INDEX IF NOT EXISTS idx_revo_jobs_customer ON revo_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_revo_jobs_status ON revo_jobs(expert_id, status);

ALTER TABLE revo_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_jobs_admin_all ON revo_jobs;
CREATE POLICY revo_jobs_admin_all ON revo_jobs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

DROP POLICY IF EXISTS revo_jobs_expert_own ON revo_jobs;
CREATE POLICY revo_jobs_expert_own ON revo_jobs
  FOR ALL TO authenticated USING (expert_id = auth.uid()) WITH CHECK (expert_id = auth.uid());

GRANT ALL ON revo_jobs TO service_role;

-- ---------------------------------------------------------------------------
-- 5. revo_property_lookups — ATTOM API query cache
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_property_lookups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES revo_users(id) ON DELETE SET NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  property_details JSONB,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_lookups_expert ON revo_property_lookups(expert_id);
CREATE INDEX IF NOT EXISTS idx_revo_lookups_latlng ON revo_property_lookups(lat, lng) WHERE lat IS NOT NULL;

ALTER TABLE revo_property_lookups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_lookups_admin_all ON revo_property_lookups;
CREATE POLICY revo_lookups_admin_all ON revo_property_lookups
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

DROP POLICY IF EXISTS revo_lookups_expert_own ON revo_property_lookups;
CREATE POLICY revo_lookups_expert_own ON revo_property_lookups
  FOR ALL TO authenticated USING (expert_id = auth.uid()) WITH CHECK (expert_id = auth.uid());

GRANT ALL ON revo_property_lookups TO service_role;

-- ---------------------------------------------------------------------------
-- 6. revo_leaderboard — admin-imported performance data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES revo_users(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM', 'YYYY-Qn', 'YYYY'
  jobs_completed INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  referrals INT DEFAULT 0,
  customer_rating DECIMAL(3,2),
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES revo_users(id),
  UNIQUE(expert_id, period)
);

CREATE INDEX IF NOT EXISTS idx_revo_leaderboard_period ON revo_leaderboard(period, total_revenue DESC);

ALTER TABLE revo_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revo_leaderboard_read_all ON revo_leaderboard;
CREATE POLICY revo_leaderboard_read_all ON revo_leaderboard
  FOR SELECT TO authenticated USING (true); -- every expert sees the ranking

DROP POLICY IF EXISTS revo_leaderboard_admin_write ON revo_leaderboard;
CREATE POLICY revo_leaderboard_admin_write ON revo_leaderboard
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

GRANT ALL ON revo_leaderboard TO service_role;

-- ---------------------------------------------------------------------------
-- 7. revo_rag_documents — ingested knowledge base documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  source_url TEXT,
  content TEXT,
  embeddings_generated BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES revo_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE revo_rag_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_rag_docs_read_all ON revo_rag_documents;
CREATE POLICY revo_rag_docs_read_all ON revo_rag_documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS revo_rag_docs_admin_write ON revo_rag_documents;
CREATE POLICY revo_rag_docs_admin_write ON revo_rag_documents
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );
GRANT ALL ON revo_rag_documents TO service_role;

-- ---------------------------------------------------------------------------
-- 8. revo_rag_chunks — vector-searchable chunks for the chatbot
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES revo_rag_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_rag_chunks_doc ON revo_rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_revo_rag_chunks_embedding
  ON revo_rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE revo_rag_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_rag_chunks_read_all ON revo_rag_chunks;
CREATE POLICY revo_rag_chunks_read_all ON revo_rag_chunks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS revo_rag_chunks_admin_write ON revo_rag_chunks;
CREATE POLICY revo_rag_chunks_admin_write ON revo_rag_chunks
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );
GRANT ALL ON revo_rag_chunks TO service_role;

-- ---------------------------------------------------------------------------
-- 9. revo_faq — admin-managed FAQ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES revo_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_faq_category ON revo_faq(category, sort_order) WHERE is_published = true;

ALTER TABLE revo_faq ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_faq_read_published ON revo_faq;
CREATE POLICY revo_faq_read_published ON revo_faq FOR SELECT TO authenticated USING (is_published = true);
DROP POLICY IF EXISTS revo_faq_admin_write ON revo_faq;
CREATE POLICY revo_faq_admin_write ON revo_faq
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );
GRANT ALL ON revo_faq TO service_role;

-- ---------------------------------------------------------------------------
-- 10. revo_course_modules — 10-module course content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- markdown
  module_number INT NOT NULL UNIQUE,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_course_published ON revo_course_modules(module_number) WHERE is_published = true;

ALTER TABLE revo_course_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_course_read_published ON revo_course_modules;
CREATE POLICY revo_course_read_published ON revo_course_modules FOR SELECT TO authenticated USING (is_published = true);
DROP POLICY IF EXISTS revo_course_admin_write ON revo_course_modules;
CREATE POLICY revo_course_admin_write ON revo_course_modules
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );
GRANT ALL ON revo_course_modules TO service_role;

-- ---------------------------------------------------------------------------
-- 11. revo_course_progress — per-expert module progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES revo_users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES revo_course_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expert_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_revo_progress_expert ON revo_course_progress(expert_id);

ALTER TABLE revo_course_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_progress_own ON revo_course_progress;
CREATE POLICY revo_progress_own ON revo_course_progress
  FOR ALL TO authenticated USING (expert_id = auth.uid()) WITH CHECK (expert_id = auth.uid());
DROP POLICY IF EXISTS revo_progress_admin_all ON revo_course_progress;
CREATE POLICY revo_progress_admin_all ON revo_course_progress
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );
GRANT ALL ON revo_course_progress TO service_role;

-- ---------------------------------------------------------------------------
-- 12. revo_community_posts + revo_community_comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revo_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES revo_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_community_posts_created ON revo_community_posts(is_pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS revo_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES revo_community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES revo_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revo_community_comments_post ON revo_community_comments(post_id, created_at);

ALTER TABLE revo_community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_community_posts_read_all ON revo_community_posts;
CREATE POLICY revo_community_posts_read_all ON revo_community_posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS revo_community_posts_write_own ON revo_community_posts;
CREATE POLICY revo_community_posts_write_own ON revo_community_posts
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS revo_community_posts_update_own ON revo_community_posts;
CREATE POLICY revo_community_posts_update_own ON revo_community_posts
  FOR UPDATE TO authenticated USING (author_id = auth.uid());
DROP POLICY IF EXISTS revo_community_posts_admin_all ON revo_community_posts;
CREATE POLICY revo_community_posts_admin_all ON revo_community_posts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

ALTER TABLE revo_community_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revo_community_comments_read_all ON revo_community_comments;
CREATE POLICY revo_community_comments_read_all ON revo_community_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS revo_community_comments_write_own ON revo_community_comments;
CREATE POLICY revo_community_comments_write_own ON revo_community_comments
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS revo_community_comments_admin_all ON revo_community_comments;
CREATE POLICY revo_community_comments_admin_all ON revo_community_comments
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM revo_users ru WHERE ru.id = auth.uid() AND ru.role = 'admin')
  );

GRANT ALL ON revo_community_posts TO service_role;
GRANT ALL ON revo_community_comments TO service_role;

-- ---------------------------------------------------------------------------
-- 13. Trigger: auto-bump updated_at on row updates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION revo_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS revo_users_updated_at ON revo_users;
CREATE TRIGGER revo_users_updated_at BEFORE UPDATE ON revo_users
  FOR EACH ROW EXECUTE FUNCTION revo_set_updated_at();

DROP TRIGGER IF EXISTS revo_settings_updated_at ON revo_settings;
CREATE TRIGGER revo_settings_updated_at BEFORE UPDATE ON revo_settings
  FOR EACH ROW EXECUTE FUNCTION revo_set_updated_at();

DROP TRIGGER IF EXISTS revo_customers_updated_at ON revo_customers;
CREATE TRIGGER revo_customers_updated_at BEFORE UPDATE ON revo_customers
  FOR EACH ROW EXECUTE FUNCTION revo_set_updated_at();

DROP TRIGGER IF EXISTS revo_jobs_updated_at ON revo_jobs;
CREATE TRIGGER revo_jobs_updated_at BEFORE UPDATE ON revo_jobs
  FOR EACH ROW EXECUTE FUNCTION revo_set_updated_at();

DROP TRIGGER IF EXISTS revo_course_updated_at ON revo_course_modules;
CREATE TRIGGER revo_course_updated_at BEFORE UPDATE ON revo_course_modules
  FOR EACH ROW EXECUTE FUNCTION revo_set_updated_at();

-- ---------------------------------------------------------------------------
-- 14. Helper function: expert onboarding (auth.users -> revo_users mirror)
-- ---------------------------------------------------------------------------
-- Called by the /register API route after Supabase auth.signUp. Creates a
-- revo_users row with role='expert' and generates a unique affiliate ID.
-- Run as service_role so RLS doesn't block the insert.
CREATE OR REPLACE FUNCTION revo_create_expert_profile(
  p_auth_user_id UUID,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_service_area TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_affiliate_id TEXT;
  v_attempt INT := 0;
BEGIN
  -- Generate a collision-safe affiliate ID (retry up to 5 times)
  LOOP
    v_attempt := v_attempt + 1;
    v_affiliate_id := 'REVO-' || UPPER(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    IF NOT EXISTS (SELECT 1 FROM revo_users WHERE expert_affiliate_id = v_affiliate_id) THEN
      EXIT;
    END IF;
    IF v_attempt > 5 THEN
      RAISE EXCEPTION 'Could not generate unique affiliate ID after 5 attempts';
    END IF;
  END LOOP;

  INSERT INTO revo_users (id, email, first_name, last_name, phone, company_name, service_area, role, expert_affiliate_id)
  VALUES (p_auth_user_id, p_email, p_first_name, p_last_name, p_phone, p_company_name, p_service_area, 'expert', v_affiliate_id);

  RETURN p_auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
