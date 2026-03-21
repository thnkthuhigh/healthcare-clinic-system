-- V13: Rooms (Phong kham) + room assignment for shifts

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  area TEXT,
  room_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type);

ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);

CREATE INDEX IF NOT EXISTS idx_shifts_room_id ON shifts(room_id);

INSERT INTO rooms (code, name, area, room_type, status)
VALUES
  ('P01', 'Phong kham 1', 'Tang 1 - Khu A', 'EXAMINATION', 'ACTIVE'),
  ('P02', 'Phong kham 2', 'Tang 1 - Khu A', 'EXAMINATION', 'ACTIVE'),
  ('P03', 'Phong sieu am', 'Tang 1 - Khu B', 'ULTRASOUND', 'ACTIVE'),
  ('P04', 'Phong xet nghiem', 'Tang 2 - Khu B', 'LAB', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- Optional demo assignment for existing shifts that have no room yet
WITH ranked_shifts AS (
  SELECT
    s.id,
    ROW_NUMBER() OVER (ORDER BY s.date, s.type, s.created_at, s.id) AS rn
  FROM shifts s
  WHERE s.room_id IS NULL
),
room_cycle AS (
  SELECT
    rs.id AS shift_id,
    CASE ((rs.rn - 1) % 4)
      WHEN 0 THEN 'P01'
      WHEN 1 THEN 'P02'
      WHEN 2 THEN 'P03'
      ELSE 'P04'
    END AS room_code
  FROM ranked_shifts rs
)
UPDATE shifts s
SET room_id = r.id
FROM room_cycle rc
JOIN rooms r ON r.code = rc.room_code
WHERE s.id = rc.shift_id
  AND s.room_id IS NULL;
