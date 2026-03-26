-- Ensure booking payment generates both consultation fee and lab fee ledger entries.

CREATE OR REPLACE FUNCTION trg_finance_booking_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
  v_service_amount BIGINT;
  v_lab_amount BIGINT;
BEGIN
  IF NEW.payment_status::text = 'PAID'
     AND coalesce(OLD.payment_status::text, '') <> 'PAID' THEN
    SELECT
      coalesce(s.name, 'Dich vu'),
      coalesce(s.price_cents, 0)::BIGINT
    INTO v_service_name, v_service_amount
    FROM services s
    WHERE s.id = NEW.service_id;

    v_lab_amount := coalesce(NEW.lab_fee_cents, 0)::BIGINT;

    IF v_service_amount > 0
      AND NOT EXISTS (
        SELECT 1
        FROM finance_ledger fl
        WHERE fl.ref_type = 'BOOKING'
          AND fl.ref_id = NEW.id
          AND fl.entry_type = 'INCOME'
          AND fl.category = 'CONSULTATION_FEE'
      )
    THEN
      INSERT INTO finance_ledger (
        entry_date,
        entry_type,
        category,
        ref_type,
        ref_id,
        description,
        amount_cents,
        actor_user_id
      )
      VALUES (
        coalesce(NEW.completed_at::date, NEW.paid_at::date, current_date),
        'INCOME',
        'CONSULTATION_FEE',
        'BOOKING',
        NEW.id,
        'Thu phi kham: ' || v_service_name,
        v_service_amount,
        NEW.paid_by_user_id
      );
    END IF;

    IF v_lab_amount > 0
      AND NOT EXISTS (
        SELECT 1
        FROM finance_ledger fl
        WHERE fl.ref_type = 'BOOKING'
          AND fl.ref_id = NEW.id
          AND fl.entry_type = 'INCOME'
          AND fl.category = 'LAB_FEE'
      )
    THEN
      INSERT INTO finance_ledger (
        entry_date,
        entry_type,
        category,
        ref_type,
        ref_id,
        description,
        amount_cents,
        actor_user_id
      )
      VALUES (
        coalesce(NEW.completed_at::date, NEW.paid_at::date, current_date),
        'INCOME',
        'LAB_FEE',
        'BOOKING',
        NEW.id,
        'Thu phi xet nghiem: ' || v_service_name,
        v_lab_amount,
        NEW.paid_by_user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_booking_paid ON bookings;
CREATE TRIGGER trg_finance_booking_paid
AFTER UPDATE OF payment_status ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_finance_booking_paid();

-- Backfill LAB_FEE rows for already paid bookings.
INSERT INTO finance_ledger (
  id,
  entry_date,
  entry_type,
  category,
  ref_type,
  ref_id,
  description,
  amount_cents,
  actor_user_id,
  created_at
)
SELECT
  gen_random_uuid(),
  coalesce(b.completed_at::date, b.paid_at::date, current_date),
  'INCOME',
  'LAB_FEE',
  'BOOKING',
  b.id,
  'Thu phi xet nghiem: ' || coalesce(s.name, 'Dich vu'),
  b.lab_fee_cents::BIGINT,
  b.paid_by_user_id,
  now()
FROM bookings b
LEFT JOIN services s ON s.id = b.service_id
WHERE b.payment_status = 'PAID'
  AND coalesce(b.lab_fee_cents, 0) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM finance_ledger fl
    WHERE fl.ref_type = 'BOOKING'
      AND fl.ref_id = b.id
      AND fl.entry_type = 'INCOME'
      AND fl.category = 'LAB_FEE'
  );
