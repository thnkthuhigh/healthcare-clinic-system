-- V34: Normalize demo OWNER credentials to match docs/login hints
-- Keep this as a new migration instead of editing older seed migrations.

UPDATE users
SET phone = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM users other
            WHERE other.phone = '0900000000'
              AND other.id <> users.id
        ) THEN '0900000000'
        ELSE users.phone
    END,
    password_hash = crypt('owner123', gen_salt('bf', 10)),
    status = 'ACTIVE',
    full_name = COALESCE(NULLIF(full_name, ''), 'Chủ phòng khám'),
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000005'
  AND role = 'OWNER';
