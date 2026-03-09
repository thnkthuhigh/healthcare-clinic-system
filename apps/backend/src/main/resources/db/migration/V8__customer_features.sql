-- V5: Customer-facing features - ratings table

CREATE TABLE IF NOT EXISTS ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    stars       INT  NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ratings_doctor  ON ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_patient ON ratings(patient_id);
