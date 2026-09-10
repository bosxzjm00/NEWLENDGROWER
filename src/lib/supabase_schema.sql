-- ==============================================================================
-- Supabase Schema for Lending Portfolio System
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- ==============================================================================

-- 1. Create the portfolio sync table
CREATE TABLE IF NOT EXISTS public.portfolio_sync (
    id TEXT PRIMARY KEY,
    borrowers JSONB NOT NULL DEFAULT '[]'::jsonb,
    capital_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    collectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    assignments JSONB NOT NULL DEFAULT '[]'::jsonb,
    collector_cashouts JSONB NOT NULL DEFAULT '[]'::jsonb,
    activity_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration support if the table already existed without activity_logs
ALTER TABLE public.portfolio_sync ADD COLUMN IF NOT EXISTS activity_logs JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.portfolio_sync ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public insert access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public update access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow public delete access" ON public.portfolio_sync;
DROP POLICY IF EXISTS "Allow full public access" ON public.portfolio_sync;

-- 4. Allow full public access (SELECT, INSERT, UPDATE, DELETE) for anon, authenticated, and service_role
CREATE POLICY "Allow full public access"
ON public.portfolio_sync
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 5. Explicitly grant table permissions to API roles
GRANT ALL ON TABLE public.portfolio_sync TO anon;
GRANT ALL ON TABLE public.portfolio_sync TO authenticated;
GRANT ALL ON TABLE public.portfolio_sync TO service_role;

-- 6. Enable real-time updates for portfolio_sync (safe if already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'portfolio_sync'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_sync;
  END IF;
END $$;
