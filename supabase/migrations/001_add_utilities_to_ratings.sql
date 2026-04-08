-- Add utilities JSONB column to ratings table
-- Run this in your Supabase SQL editor or via Supabase CLI:
--   supabase db push  OR  paste into Dashboard > SQL Editor

ALTER TABLE ratings ADD COLUMN IF NOT EXISTS utilities jsonb;
