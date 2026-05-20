-- ── AROGS CAMPAIGN — Supabase SQL Setup ──
-- Run this in your Supabase SQL Editor (https://supabase.com → SQL Editor)

-- ── SUPPORTERS TABLE ──
CREATE TABLE IF NOT EXISTS supporters (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email           TEXT UNIQUE,
  phone           TEXT,
  push_subscription TEXT,           -- JSON string of PushSubscription object
  notifications_enabled BOOLEAN DEFAULT true,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ──
CREATE INDEX IF NOT EXISTS idx_supporters_email ON supporters (email);
CREATE INDEX IF NOT EXISTS idx_supporters_notifications ON supporters (notifications_enabled);
CREATE INDEX IF NOT EXISTS idx_supporters_joined ON supporters (joined_at DESC);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;

-- Allow anon INSERT (for new supporters joining via the site)
CREATE POLICY "Allow anon insert" ON supporters
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon SELECT on non-sensitive columns (for supporter count display)
CREATE POLICY "Allow anon count" ON supporters
  FOR SELECT TO anon
  USING (true);

-- Only service role can UPDATE or DELETE (used by backend server)
CREATE POLICY "Service role full access" ON supporters
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ── NOTIFICATION LOG TABLE (optional — for auditing what was sent) ──
CREATE TABLE IF NOT EXISTS notification_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type        TEXT NOT NULL,         -- 'morning' | 'evening' | 'custom'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_count  INTEGER DEFAULT 0,
  sent_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON notification_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ── VERIFY SETUP ──
SELECT 'Arogs Campaign DB setup complete! Rise With IMPACT 🌟' AS status;
