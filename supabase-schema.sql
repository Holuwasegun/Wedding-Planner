-- Run this SQL in your Supabase SQL Editor to create the database table

CREATE TABLE wedding_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on client_id for fast lookups
CREATE INDEX idx_wedding_plans_client_id ON wedding_plans(client_id);

-- Enable Row Level Security (optional for this simple setup)
ALTER TABLE wedding_plans ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (needed for client-side API calls)
CREATE POLICY "Allow anonymous access" ON wedding_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);
