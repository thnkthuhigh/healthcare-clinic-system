-- V14: Service -> Department mapping + Doctor <-> Service many-to-many

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES departments(id);

CREATE INDEX IF NOT EXISTS idx_services_specialty_id ON services(specialty_id);

CREATE TABLE IF NOT EXISTS doctor_services (
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_services_service ON doctor_services(service_id);

-- Seed mapping for existing demo services
UPDATE services s
SET specialty_id = d.id
FROM departments d
WHERE s.specialty_id IS NULL
  AND s.id IN (
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004'
  )
  AND d.name = 'Nội tổng quát';

UPDATE services s
SET specialty_id = d.id
FROM departments d
WHERE s.specialty_id IS NULL
  AND s.id = 'c0000000-0000-0000-0000-000000000002'
  AND d.name = 'Tim mạch';

-- Best-effort fallback: map by doctor specialty text to department name
INSERT INTO doctor_services (doctor_id, service_id)
SELECT DISTINCT
  dr.id,
  sv.id
FROM doctors dr
JOIN departments dep
  ON lower(trim(dep.name)) = lower(trim(coalesce(dr.specialty, '')))
JOIN services sv
  ON sv.specialty_id = dep.id
ON CONFLICT DO NOTHING;

-- Tái khám can be handled by all doctors in demo
INSERT INTO doctor_services (doctor_id, service_id)
SELECT dr.id, sv.id
FROM doctors dr
CROSS JOIN services sv
WHERE sv.id = 'c0000000-0000-0000-0000-000000000003'
ON CONFLICT DO NOTHING;
