ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS follow_up_source_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_note TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_is_follow_up ON bookings(is_follow_up);
CREATE INDEX IF NOT EXISTS idx_bookings_follow_up_source ON bookings(follow_up_source_booking_id);
