-- Fix missing columns for cloud recipes
-- Run this in your Supabase SQL Editor

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Main Course';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 20;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS estimated_cost_per_serving REAL DEFAULT 5.0;
