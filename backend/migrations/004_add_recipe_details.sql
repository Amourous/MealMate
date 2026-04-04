-- Fix missing columns for cloud recipes
-- Run this in your Supabase SQL Editor

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Main Course';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS prepTime INTEGER DEFAULT 20;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS estimated_cost_per_serving REAL DEFAULT 5.0;

-- Refresh the schema cache so the API recognizes the new columns immediately
NOTIFY pgrst.reload_schema;
