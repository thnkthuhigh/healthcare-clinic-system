-- Ensure prescription template schema exists for environments that lost tables
-- after legacy refresh scripts. Keep idempotent and safe to re-run.

CREATE TABLE IF NOT EXISTS prescription_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescription_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES prescription_templates(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  dosage TEXT,
  note TEXT,
  UNIQUE (template_id, medication_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_items_template ON prescription_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_pt_items_medication ON prescription_template_items(medication_id);

DO $$
DECLARE
  v_template_common UUID;
  v_template_respiratory UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM prescription_templates) THEN
    RETURN;
  END IF;

  INSERT INTO prescription_templates(name, note, is_active)
  VALUES (
    'Toa cảm sốt cơ bản',
    'Dùng cho triệu chứng cảm sốt thông thường, cần theo dõi đáp ứng sau 2-3 ngày.',
    true
  )
  RETURNING id INTO v_template_common;

  INSERT INTO prescription_templates(name, note, is_active)
  VALUES (
    'Toa hô hấp nhẹ',
    'Áp dụng khi có viêm hô hấp mức độ nhẹ theo chỉ định bác sĩ.',
    true
  )
  RETURNING id INTO v_template_respiratory;

  INSERT INTO prescription_template_items(template_id, medication_id, qty, dosage, note)
  SELECT v_template_common, m.id, 10, '500mg x 2 lần/ngày', 'Sau ăn'
  FROM medications m
  WHERE m.name = 'Paracetamol';

  INSERT INTO prescription_template_items(template_id, medication_id, qty, dosage, note)
  SELECT v_template_common, m.id, 10, '1 viên/ngày', 'Bổ sung vitamin'
  FROM medications m
  WHERE m.name = 'Vitamin C';

  INSERT INTO prescription_template_items(template_id, medication_id, qty, dosage, note)
  SELECT v_template_common, m.id, 5, '10mg trước khi ngủ', NULL
  FROM medications m
  WHERE m.name = 'Cetirizine';

  INSERT INTO prescription_template_items(template_id, medication_id, qty, dosage, note)
  SELECT v_template_respiratory, m.id, 10, '500mg x 2 lần/ngày', 'Kháng sinh theo chỉ định'
  FROM medications m
  WHERE m.name = 'Amoxicillin';

  INSERT INTO prescription_template_items(template_id, medication_id, qty, dosage, note)
  SELECT v_template_respiratory, m.id, 10, '400mg khi đau/sốt', NULL
  FROM medications m
  WHERE m.name = 'Ibuprofen';
END $$;
