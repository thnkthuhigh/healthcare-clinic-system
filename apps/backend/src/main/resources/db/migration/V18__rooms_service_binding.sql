ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

CREATE INDEX IF NOT EXISTS idx_rooms_service_id ON rooms(service_id);
