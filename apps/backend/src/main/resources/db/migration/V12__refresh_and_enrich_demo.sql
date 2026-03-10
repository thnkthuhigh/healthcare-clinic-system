-- V10: Refresh demo data to today + enrich doctor flow with realistic data
-- Run date: auto (uses CURRENT_DATE)

-- ============================================================
-- 1. Add more realistic doctor data (avatar + specialty)
-- ============================================================
UPDATE doctors SET
    avatar_url = 'https://api.dicebear.com/7.x/personas/svg?seed=LeVanMinh',
    specialty  = 'Tim mạch'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE doctors SET
    avatar_url = 'https://api.dicebear.com/7.x/personas/svg?seed=TranThiHuong',
    specialty  = 'Nội tổng quát'
WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- Update doctor user full_names
UPDATE users SET full_name = 'BS. Lê Văn Minh'    WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE users SET full_name = 'BS. Trần Thị Hương'  WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE users SET full_name = 'Admin Phòng Khám'    WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- ============================================================
-- 2. Add a 3rd doctor (Nhi khoa - Pediatrics)
-- ============================================================
INSERT INTO users (id, phone, password_hash, role, status, full_name, created_at)
VALUES ('a0000000-0000-0000-0000-000000000004', '0904567890',
        crypt('password123', gen_salt('bf', 10)),
        'DOCTOR', 'ACTIVE', 'BS. Nguyễn Thị Mai', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, user_id, display_name, specialty, avatar_url)
VALUES ('b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000004',
        'BS. Nguyễn Thị Mai', 'Nhi khoa',
        'https://api.dicebear.com/7.x/personas/svg?seed=NguyenThiMai')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Add an OWNER/ADMIN user
-- ============================================================
INSERT INTO users (id, phone, password_hash, role, status, full_name, created_at)
VALUES ('a0000000-0000-0000-0000-000000000005', '0905678901',
        crypt('admin123', gen_salt('bf', 10)),
        'OWNER', 'ACTIVE', 'Chủ phòng khám', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Add more patients (10 total now, realistic Vietnamese data)
-- ============================================================
INSERT INTO patients (id, full_name, phone, national_id, created_at)
VALUES
    ('d0000000-0000-0000-0000-000000000006', 'Vũ Thị Lan',        '0921234567', '001234567894', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000007', 'Đặng Minh Tuấn',    '0921234568', '001234567895', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000008', 'Bùi Thị Hoa',       '0921234569', '001234567896', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000009', 'Ngô Quang Hùng',    '0921234570', '001234567897', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000010', 'Trịnh Thị Thu',     '0921234571', '001234567898', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Refresh existing shifts to TODAY
-- ============================================================
UPDATE shifts SET
    date       = CURRENT_DATE,
    start_time = CURRENT_DATE + TIME '07:00:00',
    end_time   = CURRENT_DATE + TIME '11:00:00'
WHERE id = 'e0000000-0000-0000-0000-000000000001';

UPDATE shifts SET
    date       = CURRENT_DATE,
    start_time = CURRENT_DATE + TIME '13:00:00',
    end_time   = CURRENT_DATE + TIME '17:00:00'
WHERE id = 'e0000000-0000-0000-0000-000000000002';

UPDATE shifts SET
    date       = CURRENT_DATE,
    start_time = CURRENT_DATE + TIME '08:00:00',
    end_time   = CURRENT_DATE + TIME '12:00:00'
WHERE id = 'e0000000-0000-0000-0000-000000000003';

-- ============================================================
-- 6. Add Doctor 3 (Nhi khoa) morning shift today
-- ============================================================
INSERT INTO shifts (id, doctor_id, date, type, start_time, end_time, status, created_at)
VALUES ('e0000000-0000-0000-0000-000000000004',
        'b0000000-0000-0000-0000-000000000003',
        CURRENT_DATE, 'MORNING',
        CURRENT_DATE + TIME '07:30:00',
        CURRENT_DATE + TIME '11:30:00',
        'OPEN', CURRENT_TIMESTAMP)
ON CONFLICT (doctor_id, date, type) DO NOTHING;

-- Slots for Doctor 3 morning shift
INSERT INTO slots (id, shift_id, sequence, pool, status)
SELECT gen_random_uuid(), 'e0000000-0000-0000-0000-000000000004', seq, 'COMMON', 'OPEN'
FROM generate_series(1, 20) AS seq
WHERE NOT EXISTS (SELECT 1 FROM slots WHERE shift_id = 'e0000000-0000-0000-0000-000000000004');

-- ============================================================
-- 7. Refresh booking timestamps to today with realistic times
-- ============================================================
UPDATE bookings SET
    check_in_at = CASE
        WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN CURRENT_DATE::timestamp + TIME '08:00:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000002' THEN CURRENT_DATE::timestamp + TIME '08:15:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000003' THEN CURRENT_DATE::timestamp + TIME '08:30:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000004' THEN CURRENT_DATE::timestamp + TIME '08:45:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN CURRENT_DATE::timestamp + TIME '07:30:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000008' THEN CURRENT_DATE::timestamp + TIME '08:00:00'
        ELSE check_in_at
    END,
    started_at = CASE
        WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN CURRENT_DATE::timestamp + TIME '08:10:00'
        ELSE started_at
    END,
    completed_at = CASE
        WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN CURRENT_DATE::timestamp + TIME '07:55:00'
        ELSE completed_at
    END,
    created_at = CASE
        WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN CURRENT_DATE::timestamp + TIME '07:45:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000002' THEN CURRENT_DATE::timestamp + TIME '08:00:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000003' THEN CURRENT_DATE::timestamp + TIME '08:10:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000004' THEN CURRENT_DATE::timestamp + TIME '08:20:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN CURRENT_DATE::timestamp + TIME '07:00:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000006' THEN CURRENT_DATE::timestamp + TIME '09:00:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000007' THEN CURRENT_DATE::timestamp + TIME '09:05:00'
        WHEN id = 'f0000000-0000-0000-0000-000000000008' THEN CURRENT_DATE::timestamp + TIME '07:50:00'
        ELSE created_at
    END
WHERE id IN (
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000005',
    'f0000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000007',
    'f0000000-0000-0000-0000-000000000008'
);

-- ============================================================
-- 8. Add more bookings for shift 1 (Doctor 1 morning) - more queue items
-- ============================================================
WITH morning_slots AS (
    SELECT id, sequence FROM slots
    WHERE shift_id = 'e0000000-0000-0000-0000-000000000001'
    ORDER BY sequence
)
INSERT INTO bookings (id, shift_id, slot_id, patient_id, channel, status, queue_number, check_in_at, priority_score, skip_count, created_at)
VALUES
    -- More WAITING patients (queue số 9, 10, 11)
    ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM morning_slots WHERE sequence = 9),
     'd0000000-0000-0000-0000-000000000006',
     'WEB', 'WAITING', 9, CURRENT_DATE::timestamp + TIME '09:00:00', 50, 0, CURRENT_DATE::timestamp + TIME '08:50:00'),

    ('f0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM morning_slots WHERE sequence = 10),
     'd0000000-0000-0000-0000-000000000007',
     'WALK_IN', 'CHECKED_IN', 10, CURRENT_DATE::timestamp + TIME '09:10:00', 0, 0, CURRENT_DATE::timestamp + TIME '09:05:00'),

    ('f0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM morning_slots WHERE sequence = 11),
     'd0000000-0000-0000-0000-000000000008',
     'WEB', 'BOOKED', 11, NULL, 50, 0, CURRENT_DATE::timestamp + TIME '09:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. Add bookings for Doctor 3 (Nhi khoa) - shift 4
-- ============================================================
WITH nhi_slots AS (
    SELECT id, sequence FROM slots
    WHERE shift_id = 'e0000000-0000-0000-0000-000000000004'
    ORDER BY sequence
)
INSERT INTO bookings (id, shift_id, slot_id, patient_id, channel, status, queue_number, check_in_at, priority_score, skip_count, created_at)
VALUES
    ('f0000000-0000-0000-0000-00000000000c', 'e0000000-0000-0000-0000-000000000004',
     (SELECT id FROM nhi_slots WHERE sequence = 1),
     'd0000000-0000-0000-0000-000000000009',
     'WEB', 'IN_CONSULTATION', 1, CURRENT_DATE::timestamp + TIME '07:40:00', 50, 0, CURRENT_DATE::timestamp + TIME '07:30:00'),

    ('f0000000-0000-0000-0000-00000000000d', 'e0000000-0000-0000-0000-000000000004',
     (SELECT id FROM nhi_slots WHERE sequence = 2),
     'd0000000-0000-0000-0000-000000000010',
     'WEB', 'WAITING', 2, CURRENT_DATE::timestamp + TIME '07:50:00', 50, 0, CURRENT_DATE::timestamp + TIME '07:45:00'),

    ('f0000000-0000-0000-0000-00000000000e', 'e0000000-0000-0000-0000-000000000004',
     (SELECT id FROM nhi_slots WHERE sequence = 3),
     'd0000000-0000-0000-0000-000000000006',
     'WALK_IN', 'CHECKED_IN', 3, CURRENT_DATE::timestamp + TIME '08:05:00', 0, 0, CURRENT_DATE::timestamp + TIME '08:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. Add medical records for today's completed booking + in-consultation
-- ============================================================
UPDATE medical_records SET
    created_at = CURRENT_DATE::timestamp + TIME '07:45:00',
    updated_at = CURRENT_DATE::timestamp + TIME '07:55:00'
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- ============================================================
-- 11. Add more medications for richer prescription data
-- ============================================================
INSERT INTO medications (id, name, unit, usage, default_dose, price_cents, stock_real, is_active)
VALUES
    ('a2000000-0000-0000-0000-000000000007', 'Azithromycin',      'mg',  'Kháng sinh phổ rộng',  '500mg',  800000, 80,   true),
    ('a2000000-0000-0000-0000-000000000008', 'Metformin',         'mg',  'Điều trị tiểu đường',  '850mg',  350000, 200,  true),
    ('a2000000-0000-0000-0000-000000000009', 'Amlodipine',        'mg',  'Hạ huyết áp',          '5mg',    450000, 150,  true),
    ('a2000000-0000-0000-0000-00000000000a', 'Atorvastatin',      'mg',  'Hạ mỡ máu',            '20mg',   600000, 120,  true),
    ('a2000000-0000-0000-0000-00000000000b', 'Salbutamol',        'mg',  'Điều trị hen suyễn',   '4mg',    500000, 100,  true),
    ('a2000000-0000-0000-0000-00000000000c', 'Vitamin B complex', 'viên','Bổ sung vitamin nhóm B','1 viên',180000, 800,  true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 12. Update prescription timestamps to today
-- ============================================================
UPDATE prescriptions SET
    created_at = CURRENT_DATE::timestamp + TIME '07:55:00',
    updated_at = CURRENT_DATE::timestamp + TIME '07:55:00'
WHERE id = 'a3000000-0000-0000-0000-000000000001';

-- ============================================================
-- Result summary
-- ============================================================
-- Users:     5 (2 doctors + 1 new doctor + 1 admin + 1 owner)
-- Doctors:   3 (Lê Văn Minh - Tim mạch, Trần Thị Hương - Nội, Nguyễn Thị Mai - Nhi)
-- Patients:  10
-- Shifts:    4 (3 existing refreshed to today + 1 new for Doctor 3)
-- Bookings:  14+ (active queue items for all 3 doctors today)
-- Medications: 12
