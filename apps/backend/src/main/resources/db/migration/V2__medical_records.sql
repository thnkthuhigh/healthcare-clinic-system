-- V2: Add medical records table for storing examination details

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  symptoms TEXT,
  diagnosis TEXT,
  conclusion TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at DESC);

-- Add service_id to bookings for tracking which service was booked
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

-- Add queue_number to bookings for display
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS queue_number INT;

-- Add priority score for smart queue (Logic B)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priority_score INT NOT NULL DEFAULT 0;

-- Add patient additional info
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;

-- Add avatar/photo URL to doctors
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_shift_status ON bookings(shift_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_priority ON bookings(shift_id, priority_score DESC, check_in_at ASC);
