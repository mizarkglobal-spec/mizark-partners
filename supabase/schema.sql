-- ============================================================
-- Mizark Global Partners Portal — Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── Partner Applications ─────────────────────────────────────────────────────
CREATE TABLE partner_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  email             text NOT NULL,
  phone             text,
  location          text,
  amount_intent     bigint NOT NULL,         -- NGN amount they intend to invest
  motivation        text,
  prior_experience  boolean DEFAULT false,
  prior_detail      text,
  referral_source   text,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','invited')),
  review_note       text,
  pitch_token       text UNIQUE,             -- set when approved, used to access pitch deck
  reviewed_at       timestamptz,
  reviewed_by       text,                   -- admin email
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_applications_status_idx ON partner_applications (status, created_at DESC);
CREATE INDEX partner_applications_email_idx  ON partner_applications (email);

-- ── Partners (active investors) ──────────────────────────────────────────────
CREATE TABLE partners (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    uuid REFERENCES partner_applications(id),
  user_id           uuid,                   -- Supabase auth user, set after account creation
  name              text NOT NULL,
  email             text NOT NULL UNIQUE,
  phone             text,
  investment_amount bigint NOT NULL CHECK (investment_amount > 0),  -- NGN
  equity_pct        numeric(10,6) NOT NULL CHECK (equity_pct > 0),  -- e.g. 1.000000
  start_date        date NOT NULL,
  term_end_date     date NOT NULL,
  status            text NOT NULL DEFAULT 'pending_payment'
                    CHECK (status IN ('pending_payment','active','exited','suspended')),
  agreement_token   text UNIQUE,            -- token to access agreement page
  payment_token     text UNIQUE,            -- token to access payment page
  paystack_ref      text,                   -- payment reference
  created_at        timestamptz NOT NULL DEFAULT now(),
  activated_at      timestamptz,
  notes             text
);
CREATE INDEX partners_user_id_idx  ON partners (user_id);
CREATE INDEX partners_status_idx   ON partners (status);
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners read own" ON partners FOR SELECT USING (auth.uid() = user_id);

-- ── Agreements ──────────────────────────────────────────────────────────────
CREATE TABLE partner_agreements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id            uuid NOT NULL REFERENCES partners(id),
  version               text NOT NULL DEFAULT '1.0',
  signed_name           text,                   -- typed name at signing
  signed_at             timestamptz,
  countersigned_at      timestamptz,
  countersigned_by      text,                   -- admin name who countersigned
  pdf_url               text,                   -- signed PDF
  countersigned_pdf_url text,                   -- final countersigned PDF
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE partner_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners read own agreements" ON partner_agreements FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- ── Monthly Financials ───────────────────────────────────────────────────────
CREATE TABLE monthly_financials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period        text NOT NULL UNIQUE,    -- 'YYYY-MM'
  leadash_rev   bigint NOT NULL DEFAULT 0,
  academy_rev   bigint NOT NULL DEFAULT 0,
  total_rev     bigint GENERATED ALWAYS AS (leadash_rev + academy_rev) STORED,
  expenses      bigint NOT NULL DEFAULT 0,
  net_profit    bigint GENERATED ALWAYS AS (leadash_rev + academy_rev - expenses) STORED,
  notes         text,
  source        text DEFAULT 'manual',   -- 'manual' or 'zoho'
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX monthly_financials_period_idx ON monthly_financials (period DESC);

-- ── Distributions ────────────────────────────────────────────────────────────
CREATE TABLE distributions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    uuid NOT NULL REFERENCES partners(id),
  period        text NOT NULL,           -- 'YYYY-Q1' / 'YYYY-Q2' etc
  net_profit    bigint NOT NULL,         -- total net profit for the quarter
  partner_share numeric(10,6) NOT NULL,  -- equity % at time of distribution
  amount        bigint NOT NULL CHECK (amount >= 0),  -- NGN
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','paid','failed')),
  paystack_ref  text,
  transfer_code text,
  paid_at       timestamptz,
  receipt_url   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX distributions_partner_id_idx ON distributions (partner_id);
CREATE INDEX distributions_period_idx     ON distributions (period);
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners read own distributions" ON distributions FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- ── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('monthly','quarterly','annual')),
  period      text NOT NULL,             -- 'YYYY-MM', 'YYYY-Q1', 'YYYY'
  pdf_url     text,
  data        jsonb,                     -- cached snapshot of financials
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_type_period_idx ON reports (type, period DESC);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active partners read reports" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM partners WHERE user_id = auth.uid() AND status = 'active'));

-- ── Announcements ────────────────────────────────────────────────────────────
CREATE TABLE announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text NOT NULL,
  is_pinned   boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_created_at_idx ON announcements (created_at DESC);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active partners read announcements" ON announcements FOR SELECT
  USING (EXISTS (SELECT 1 FROM partners WHERE user_id = auth.uid() AND status = 'active'));

-- ── Partner Notifications ─────────────────────────────────────────────────
CREATE TABLE partner_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid NOT NULL REFERENCES partners(id),
  type        text NOT NULL,  -- 'distribution', 'report', 'announcement', 'general'
  title       text NOT NULL,
  body        text,
  read        boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_notifications_partner_id_idx ON partner_notifications (partner_id, created_at DESC);
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners read own notifications" ON partner_notifications FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "Partners update own notifications" ON partner_notifications FOR UPDATE
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- ── Programme Settings ───────────────────────────────────────────────────────
-- Single-row config table. Run this if you want admin-editable settings.
CREATE TABLE IF NOT EXISTS program_config (
  id          int PRIMARY KEY CHECK (id = 1),  -- enforces single row
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO program_config (id, settings) VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── Admin Users (invited admins beyond the primary ADMIN_EMAIL) ──────────────
CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text,
  invited_by    text,                   -- email of admin who invited
  status        text NOT NULL DEFAULT 'invited'
                CHECK (status IN ('invited','active','revoked')),
  invited_at    timestamptz NOT NULL DEFAULT now(),
  activated_at  timestamptz
);
CREATE INDEX admin_users_email_idx  ON admin_users (email);
CREATE INDEX admin_users_status_idx ON admin_users (status);

-- ── Useful views ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW partner_overview AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.email,
  p.investment_amount,
  p.equity_pct,
  p.start_date,
  p.term_end_date,
  p.status,
  COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'paid'), 0) AS total_distributed,
  COUNT(d.id) FILTER (WHERE d.status = 'paid')               AS distribution_count
FROM partners p
LEFT JOIN distributions d ON d.partner_id = p.id
GROUP BY p.id;
