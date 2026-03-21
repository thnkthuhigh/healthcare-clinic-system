-- V17: add patient insurance code for reception auto-dispatch flow

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS insurance_code TEXT;

CREATE INDEX IF NOT EXISTS idx_patients_insurance_code ON patients(insurance_code);
