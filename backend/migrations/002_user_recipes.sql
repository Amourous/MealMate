-- Add is_public and author_name to allow community sharing

ALTER TABLE recipes ADD COLUMN is_public BOOLEAN DEFAULT 0;
ALTER TABLE recipes ADD COLUMN author_name TEXT DEFAULT 'Unknown';
