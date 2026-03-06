-- V7: Add full_name column to users for registration
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
