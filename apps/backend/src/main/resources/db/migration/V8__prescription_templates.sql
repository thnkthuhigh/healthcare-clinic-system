-- V8: Prescription templates (combo thuốc mẫu cho bác sĩ kê nhanh)

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
  qty INT NOT NULL,
  dosage TEXT,
  note TEXT,
  UNIQUE (template_id, medication_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_items_template ON prescription_template_items(template_id);
