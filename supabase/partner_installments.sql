-- Migration: installment payment support
-- Run manually in Supabase SQL editor

-- 1. Extend partners table
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS committed_amount  numeric(15,2),
  ADD COLUMN IF NOT EXISTS paid_amount       numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equity_committed_pct numeric(10,6),
  ADD COLUMN IF NOT EXISTS payment_status   text DEFAULT 'awaiting_first'
    CHECK (payment_status IN ('awaiting_first', 'partial', 'complete', 'defaulted'));

-- 2. Backfill: set committed for all; paid_amount only for already-active partners
UPDATE partners
SET
  committed_amount      = investment_amount,
  paid_amount           = CASE WHEN status = 'active' THEN investment_amount ELSE 0 END,
  equity_committed_pct  = equity_pct,
  equity_pct            = CASE WHEN status = 'active' THEN equity_pct ELSE 0 END,
  payment_status        = CASE
                            WHEN status = 'active' THEN 'complete'
                            ELSE 'awaiting_first'
                          END
WHERE committed_amount IS NULL;

-- 3. Installments ledger
CREATE TABLE IF NOT EXISTS partner_installments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount       numeric(15,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL,
  reference    text,
  method       text NOT NULL CHECK (method IN ('paystack', 'bank_transfer', 'manual', 'other')),
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- Prevent duplicate Paystack references per partner
CREATE UNIQUE INDEX IF NOT EXISTS partner_installments_partner_ref_uidx
  ON partner_installments (partner_id, reference)
  WHERE reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_installments_partner_idx ON partner_installments (partner_id);
CREATE INDEX IF NOT EXISTS partner_installments_date_idx    ON partner_installments (payment_date);
