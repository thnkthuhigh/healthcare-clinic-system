-- V21: doctor personal profile details for admin CV form
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS national_id TEXT;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS work_history TEXT;
