/*
# RazorShield — fraud detection tables (single-tenant, no auth)

## Overview
Creates the two core tables that back the RazorShield fraud-detection dashboard.
The app has no sign-in screen, so policies allow both anon and authenticated
roles to read/write. Data is intentionally shared/public (demo analytics tool).

## New Tables

### transactions
- `id` uuid PK, defaults to gen_random_uuid()
- `ip` text — source IP address of the transaction
- `email` text — customer email
- `amount` numeric — transaction amount in INR
- `message` text — free-text SMS / transaction note
- `url` text — link embedded in the transaction/SMS (may be null)
- `risk_score` numeric — computed risk score 0–100
- `is_fraud` boolean — true when flagged as fraud
- `reasons` text[] — human-readable reasons for the risk score
- `created_at` timestamptz — defaults to now()

### scans
- `id` uuid PK, defaults to gen_random_uuid()
- `input_text` text — the text pasted into the scanner
- `risk_score` numeric — computed risk score 0–100
- `reasons` text[] — reasons contributing to the score
- `tag` text — Fraud | Ham classification tag
- `created_at` timestamptz — defaults to now()

## Security
- RLS enabled on both tables.
- 4 policies each (select/insert/update/delete) scoped to anon + authenticated.
- USING (true) is acceptable here because the app is single-tenant with no
  sign-in screen and the data is intentionally public/shared demo data.

## Notes
1. Indexes added on created_at and ip for chart/spike queries.
2. Safe to re-run — uses IF NOT EXISTS and DROP POLICY IF EXISTS.
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  email text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  url text,
  risk_score numeric NOT NULL DEFAULT 0,
  is_fraud boolean NOT NULL DEFAULT false,
  reasons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text text NOT NULL,
  risk_score numeric NOT NULL DEFAULT 0,
  reasons text[] NOT NULL DEFAULT '{}',
  tag text NOT NULL DEFAULT 'Ham',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions (created_at);
CREATE INDEX IF NOT EXISTS transactions_ip_idx ON transactions (ip);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_scans" ON scans;
CREATE POLICY "anon_select_scans" ON scans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scans" ON scans;
CREATE POLICY "anon_insert_scans" ON scans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scans" ON scans;
CREATE POLICY "anon_update_scans" ON scans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scans" ON scans;
CREATE POLICY "anon_delete_scans" ON scans FOR DELETE
  TO anon, authenticated USING (true);
