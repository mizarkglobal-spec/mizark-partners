-- Run this in the Supabase SQL editor to add the financial transactions ledger.

CREATE TABLE IF NOT EXISTS financial_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date    NOT NULL,
  division    text    NOT NULL CHECK (division IN ('learn_mizark', 'leadash', 'shared')),
  type        text    NOT NULL CHECK (type IN ('revenue', 'cogs', 'opex', 'tax')),
  category    text    NOT NULL,
  amount      numeric(15, 2) NOT NULL CHECK (amount >= 0),
  description text,
  reference   text,
  is_auto     boolean NOT NULL DEFAULT false,
  source_id   text,                          -- e.g. Paystack payment_id if auto-imported
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ft_date     ON financial_transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_ft_division ON financial_transactions (division);
CREATE INDEX IF NOT EXISTS idx_ft_type     ON financial_transactions (type);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Admins (service role) can do everything; partners have no access
CREATE POLICY "service role full access" ON financial_transactions
  USING (true)
  WITH CHECK (true);
