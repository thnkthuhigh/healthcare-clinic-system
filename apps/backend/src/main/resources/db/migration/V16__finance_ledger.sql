-- V16: Finance ledger + auto ledger triggers

CREATE TABLE IF NOT EXISTS finance_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL,
  category TEXT NOT NULL,
  ref_type TEXT,
  ref_id UUID,
  description TEXT NOT NULL,
  qty NUMERIC,
  unit TEXT,
  amount_cents BIGINT NOT NULL,
  actor_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_entry_date ON finance_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_finance_category ON finance_ledger(category);
CREATE INDEX IF NOT EXISTS idx_finance_ref ON finance_ledger(ref_type, ref_id);

-- --------------------------------------------
-- booking.payment_status -> PAID
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trg_finance_booking_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
  v_amount BIGINT;
BEGIN
  IF NEW.payment_status::text = 'PAID'
     AND coalesce(OLD.payment_status::text, '') <> 'PAID' THEN
    SELECT
      coalesce(s.name, 'Dich vu'),
      coalesce(s.price_cents, 0)::BIGINT
    INTO v_service_name, v_amount
    FROM services s
    WHERE s.id = NEW.service_id;

    IF NOT EXISTS (
      SELECT 1
      FROM finance_ledger fl
      WHERE fl.ref_type = 'BOOKING'
        AND fl.ref_id = NEW.id
        AND fl.entry_type = 'INCOME'
        AND fl.category = 'CONSULTATION_FEE'
    ) THEN
      INSERT INTO finance_ledger (
        entry_date,
        entry_type,
        category,
        ref_type,
        ref_id,
        description,
        amount_cents
      )
      VALUES (
        coalesce(NEW.completed_at::date, current_date),
        'INCOME',
        'CONSULTATION_FEE',
        'BOOKING',
        NEW.id,
        'Thu phi kham: ' || v_service_name,
        v_amount
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

-- --------------------------------------------
-- prescriptions.status -> PAID (per item)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trg_finance_prescription_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status::text = 'PAID'
     AND coalesce(OLD.status::text, '') <> 'PAID' THEN
    INSERT INTO finance_ledger (
      entry_date,
      entry_type,
      category,
      ref_type,
      ref_id,
      description,
      qty,
      unit,
      amount_cents
    )
    SELECT
      coalesce(NEW.updated_at::date, current_date),
      'INCOME',
      'MEDICATION_SALE',
      'PRESCRIPTION_ITEM',
      pi.id,
      'Ban thuoc: ' || m.name || ' (toa ' || NEW.id::text || ')',
      pi.qty::numeric,
      m.unit,
      (pi.qty::BIGINT * pi.unit_price_cents::BIGINT)
    FROM prescription_items pi
    JOIN medications m ON m.id = pi.medication_id
    WHERE pi.prescription_id = NEW.id
      AND NOT EXISTS (
        SELECT 1
        FROM finance_ledger fl
        WHERE fl.ref_type = 'PRESCRIPTION_ITEM'
          AND fl.ref_id = pi.id
          AND fl.entry_type = 'INCOME'
          AND fl.category = 'MEDICATION_SALE'
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_prescription_paid ON prescriptions;
CREATE TRIGGER trg_finance_prescription_paid
AFTER UPDATE OF status ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION trg_finance_prescription_paid();

-- --------------------------------------------
-- medications stock increase -> purchase expense
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trg_finance_medication_restock()
RETURNS TRIGGER AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  IF NEW.stock_real > OLD.stock_real THEN
    v_delta := NEW.stock_real - OLD.stock_real;

    INSERT INTO finance_ledger (
      entry_date,
      entry_type,
      category,
      ref_type,
      ref_id,
      description,
      qty,
      unit,
      amount_cents
    )
    VALUES (
      current_date,
      'EXPENSE',
      'MEDICATION_PURCHASE',
      'MEDICATION',
      NEW.id,
      'Nhap kho thuoc: ' || NEW.name,
      v_delta::numeric,
      NEW.unit,
      (v_delta::BIGINT * coalesce(NEW.price_cents, 0)::BIGINT)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_medication_restock ON medications;
CREATE TRIGGER trg_finance_medication_restock
AFTER UPDATE OF stock_real ON medications
FOR EACH ROW
EXECUTE FUNCTION trg_finance_medication_restock();

-- --------------------------------------------
-- supplies stock increase -> purchase expense
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trg_finance_supply_restock()
RETURNS TRIGGER AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  IF NEW.stock_qty > OLD.stock_qty THEN
    v_delta := NEW.stock_qty - OLD.stock_qty;

    INSERT INTO finance_ledger (
      entry_date,
      entry_type,
      category,
      ref_type,
      ref_id,
      description,
      qty,
      unit,
      amount_cents
    )
    VALUES (
      current_date,
      'EXPENSE',
      'SUPPLY_PURCHASE',
      'SUPPLY',
      NEW.id,
      'Nhap kho vat tu: ' || NEW.name,
      v_delta::numeric,
      NEW.unit,
      (v_delta::BIGINT * coalesce(NEW.unit_cost_cents, 0)::BIGINT)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_supply_restock ON supplies;
CREATE TRIGGER trg_finance_supply_restock
AFTER UPDATE OF stock_qty ON supplies
FOR EACH ROW
EXECUTE FUNCTION trg_finance_supply_restock();

-- --------------------------------------------
-- assets insert -> purchase expense
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trg_finance_asset_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(NEW.purchase_price_cents, 0) > 0 THEN
    INSERT INTO finance_ledger (
      entry_date,
      entry_type,
      category,
      ref_type,
      ref_id,
      description,
      amount_cents
    )
    VALUES (
      coalesce(NEW.purchase_date, current_date),
      'EXPENSE',
      'ASSET_PURCHASE',
      'ASSET',
      NEW.id,
      'Mua tai san: ' || NEW.name,
      NEW.purchase_price_cents
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_asset_insert ON assets;
CREATE TRIGGER trg_finance_asset_insert
AFTER INSERT ON assets
FOR EACH ROW
EXECUTE FUNCTION trg_finance_asset_insert();
