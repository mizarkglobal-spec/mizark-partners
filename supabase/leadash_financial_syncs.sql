-- ── Leadash financial syncs ──────────────────────────────────────────────────
-- Closed-month P&L summaries pushed automatically from Leadash's finance
-- system when the accountant signs off a month. Rows land as 'pending' and
-- only enter investor-facing monthly_financials after explicit approval here
-- (approve maps the payload into a monthly_financials row). Re-syncs of an
-- already-approved month flip it back to 'pending' — changed numbers must be
-- re-approved before investors see them.
--
-- Apply in the mizark-partners Supabase project's SQL editor.

CREATE TABLE IF NOT EXISTS leadash_financial_syncs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month   date NOT NULL UNIQUE,   -- first of month
  payload        jsonb NOT NULL,         -- full PeriodSummary from Leadash
  status         text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','stale')),
  synced_at      timestamptz NOT NULL DEFAULT now(),
  approved_by    text,
  approved_at    timestamptz,
  rejection_note text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leadash_syncs_status_idx ON leadash_financial_syncs (status);

ALTER TABLE leadash_financial_syncs ENABLE ROW LEVEL SECURITY;
-- Service-role only (route handlers use the admin client); no anon access.
DROP POLICY IF EXISTS leadash_syncs_service_only ON leadash_financial_syncs;
CREATE POLICY leadash_syncs_service_only ON leadash_financial_syncs
  FOR ALL USING (false) WITH CHECK (false);
