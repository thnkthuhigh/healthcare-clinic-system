DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('QR', 'CASH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method payment_method,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_bookings_paid_at ON bookings(paid_at);
CREATE INDEX IF NOT EXISTS idx_bookings_paid_by_user_id ON bookings(paid_by_user_id);

UPDATE bookings
SET payment_method = COALESCE(payment_method, 'CASH'::payment_method),
    paid_at = COALESCE(paid_at, completed_at, created_at)
WHERE payment_status = 'PAID';
