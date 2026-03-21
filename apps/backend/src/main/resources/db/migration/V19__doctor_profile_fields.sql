-- V19: doctor advanced profile fields
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS qualifications TEXT;
