-- Fix column naming: PostgreSQL lowercased "prepTime" to "preptime".
-- We need to rename it to the proper snake_case "prep_time" so PostgREST can find it.
-- Run this in your Supabase SQL Editor:

-- Rename the auto-lowercased column to proper snake_case
ALTER TABLE public.recipes RENAME COLUMN preptime TO prep_time;
