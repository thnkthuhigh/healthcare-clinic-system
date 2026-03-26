ALTER TABLE bookings
  ALTER COLUMN booking_fee_cents SET DEFAULT 1000000;

UPDATE bookings
SET booking_fee_cents = 1000000
WHERE booking_fee_cents = 10000;
