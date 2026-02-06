-- V3: Seed sample data for testing
-- This migration inserts sample data for doctors, patients, shifts, bookings, and medications

-- ============================================
-- USERS & DOCTORS
-- ============================================
INSERT INTO users (id, phone, password_hash, role, status, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '0901234567', '$2a$10$dummyhash1', 'DOCTOR', 'ACTIVE', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000002', '0902345678', '$2a$10$dummyhash2', 'DOCTOR', 'ACTIVE', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000003', '0903456789', '$2a$10$dummyhash3', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO doctors (id, user_id, display_name, specialty)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BS. Lê Văn Minh', 'Tim mạch'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'BS. Trần Thị Hương', 'Nội tổng quát');

-- ============================================
-- SERVICES
-- ============================================
INSERT INTO services (id, name, duration_min, price_cents, is_active)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'Khám nội tổng quát', 30, 20000000, true),
    ('c0000000-0000-0000-0000-000000000002', 'Khám tim mạch', 45, 30000000, true),
    ('c0000000-0000-0000-0000-000000000003', 'Tái khám', 20, 15000000, true),
    ('c0000000-0000-0000-0000-000000000004', 'Xét nghiệm máu', 15, 10000000, true);

-- ============================================
-- PATIENTS
-- ============================================
INSERT INTO patients (id, full_name, phone, national_id, date_of_birth, gender, weight_kg, height_cm, allergies, address, created_at)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'Nguyễn Văn A', '0911234567', 'VN-8821', '1979-05-15', 'Male', 72.0, 175.0, 'Đậu phộng, Penicillin', '123 Nguyễn Huệ, Quận 1, TP.HCM', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000002', 'Trần Thị B', '0911234568', '001234567890', '1980-05-15', 'Female', 58.0, 160.0, NULL, '456 Lê Lợi, Quận 3, TP.HCM', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000003', 'Lê Chí C', '0911234569', '001234567891', '1975-08-20', 'Male', 72.0, 170.0, 'Penicillin', '789 Hai Bà Trưng, Quận 1, TP.HCM', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000004', 'Phạm Đức D', '0911234570', '001234567892', '1990-12-10', 'Male', 80.0, 175.0, NULL, '321 Trần Hưng Đạo, Quận 5, TP.HCM', CURRENT_TIMESTAMP),
    ('d0000000-0000-0000-0000-000000000005', 'Hoàng Lan E', '0911234571', '001234567893', '1985-03-25', 'Female', 55.0, 158.0, 'Đậu phộng', '654 Cách Mạng Tháng 8, Quận 10, TP.HCM', CURRENT_TIMESTAMP);

-- ============================================
-- SHIFTS (Today's shifts)
-- ============================================
INSERT INTO shifts (id, doctor_id, date, type, start_time, end_time, status, created_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'MORNING', 
     CURRENT_DATE + TIME '07:00:00', CURRENT_DATE + TIME '11:00:00', 'OPEN', CURRENT_TIMESTAMP),
    ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'AFTERNOON',
     CURRENT_DATE + TIME '13:00:00', CURRENT_DATE + TIME '17:00:00', 'OPEN', CURRENT_TIMESTAMP),
    ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'MORNING',
     CURRENT_DATE + TIME '08:00:00', CURRENT_DATE + TIME '12:00:00', 'OPEN', CURRENT_TIMESTAMP);

-- ============================================
-- SLOTS (for bookings)
-- ============================================
-- Shift 1 morning (Doctor 1) - 20 slots
INSERT INTO slots (id, shift_id, sequence, pool, status)
SELECT 
    gen_random_uuid(),
    'e0000000-0000-0000-0000-000000000001',
    seq,
    'COMMON',
    'OPEN'
FROM generate_series(1, 20) AS seq;

-- Shift 2 afternoon (Doctor 1) - 20 slots  
INSERT INTO slots (id, shift_id, sequence, pool, status)
SELECT 
    gen_random_uuid(),
    'e0000000-0000-0000-0000-000000000002',
    seq,
    'COMMON',
    'OPEN'
FROM generate_series(1, 20) AS seq;

-- Shift 3 morning (Doctor 2) - 15 slots
INSERT INTO slots (id, shift_id, sequence, pool, status)
SELECT 
    gen_random_uuid(),
    'e0000000-0000-0000-0000-000000000003',
    seq,
    'COMMON',
    'OPEN'
FROM generate_series(1, 15) AS seq;

-- ============================================
-- BOOKINGS (Queue items)
-- ============================================
-- Get slot IDs for bookings
WITH shift1_slots AS (
    SELECT id, sequence FROM slots WHERE shift_id = 'e0000000-0000-0000-0000-000000000001' ORDER BY sequence
)
INSERT INTO bookings (id, shift_id, slot_id, patient_id, service_id, channel, status, queue_number, check_in_at, priority_score, skip_count, created_at)
VALUES 
    -- Shift 1 morning - Active consultation
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 
     (SELECT id FROM shift1_slots WHERE sequence = 5), 'd0000000-0000-0000-0000-000000000001', 
     'c0000000-0000-0000-0000-000000000002', 'WEB', 'IN_CONSULTATION', 5, CURRENT_TIMESTAMP - INTERVAL '2 hours', 50, 0, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    
    -- Shift 1 morning - Waiting patients
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM shift1_slots WHERE sequence = 6), 'd0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000003', 'WEB', 'WAITING', 6, CURRENT_TIMESTAMP - INTERVAL '1 hour 45 minutes', 50, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM shift1_slots WHERE sequence = 7), 'd0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000001', 'WALK_IN', 'WAITING', 7, CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes', 0, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM shift1_slots WHERE sequence = 8), 'd0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000004', 'WEB', 'CHECKED_IN', 8, CURRENT_TIMESTAMP - INTERVAL '1 hour 15 minutes', 50, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    
    -- Shift 1 morning - Completed
    ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001',
     (SELECT id FROM shift1_slots WHERE sequence = 4), 'd0000000-0000-0000-0000-000000000005',
     'c0000000-0000-0000-0000-000000000001', 'WALK_IN', 'COMPLETED', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours', 0, 0, CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- Shift 2 afternoon bookings
WITH shift2_slots AS (
    SELECT id, sequence FROM slots WHERE shift_id = 'e0000000-0000-0000-0000-000000000002' ORDER BY sequence
)
INSERT INTO bookings (id, shift_id, slot_id, patient_id, service_id, channel, status, queue_number, check_in_at, priority_score, skip_count, created_at)
VALUES 
    ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002',
     (SELECT id FROM shift2_slots WHERE sequence = 1), 'd0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000001', 'WEB', 'BOOKED', 1, NULL, 50, 0, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002',
     (SELECT id FROM shift2_slots WHERE sequence = 2), 'd0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000002', 'WEB', 'BOOKED', 2, NULL, 50, 0, CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Shift 3 morning (Doctor 2)
WITH shift3_slots AS (
    SELECT id, sequence FROM slots WHERE shift_id = 'e0000000-0000-0000-0000-000000000003' ORDER BY sequence
)
INSERT INTO bookings (id, shift_id, slot_id, patient_id, service_id, channel, status, queue_number, check_in_at, priority_score, skip_count, created_at)
VALUES 
    ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000003',
     (SELECT id FROM shift3_slots WHERE sequence = 1), 'd0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000001', 'WALK_IN', 'WAITING', 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 0, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- ============================================
-- MEDICAL RECORDS
-- ============================================
INSERT INTO medical_records (id, booking_id, patient_id, doctor_id, symptoms, diagnosis, conclusion, notes, created_at, updated_at)
VALUES 
    ('a1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 
     'b0000000-0000-0000-0000-000000000001', 'Đau đầu, chóng mặt', 'Tăng huyết áp', 
     'Huyết áp ổn định ở 120/80. Tiếp tục dùng thuốc.', NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- ============================================
-- MEDICATIONS
-- ============================================
INSERT INTO medications (id, name, unit, usage, default_dose, price_cents, stock_real, is_active)
VALUES 
    ('a2000000-0000-0000-0000-000000000001', 'Amoxicillin', 'mg', 'Kháng sinh', '500mg', 500000, 100, true),
    ('a2000000-0000-0000-0000-000000000002', 'Paracetamol', 'mg', 'Giảm đau, hạ sốt', '500mg', 200000, 500, true),
    ('a2000000-0000-0000-0000-000000000003', 'Ibuprofen', 'mg', 'Chống viêm', '400mg', 300000, 200, true),
    ('a2000000-0000-0000-0000-000000000004', 'Omeprazole', 'mg', 'Giảm acid dạ dày', '20mg', 400000, 150, true),
    ('a2000000-0000-0000-0000-000000000005', 'Cetirizine', 'mg', 'Chống dị ứng', '10mg', 250000, 300, true),
    ('a2000000-0000-0000-0000-000000000006', 'Vitamin C', 'mg', 'Bổ sung vitamin', '1000mg', 150000, 1000, true);

-- ============================================
-- PRESCRIPTIONS
-- ============================================
INSERT INTO prescriptions (id, booking_id, status, created_at, updated_at)
VALUES 
    ('a3000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'PAID', 
     CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '30 minutes');

INSERT INTO prescription_items (id, prescription_id, medication_id, qty, unit_price_cents)
VALUES 
    ('a4000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 10, 500000),
    ('a4000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 20, 200000);

-- ============================================
-- Summary Counts (for reference)
-- ============================================
-- Users: 3 (2 doctors, 1 admin)
-- Doctors: 2  
-- Patients: 5
-- Services: 4
-- Shifts: 3 (today)
-- Slots: 55 total (20 + 20 + 15)
-- Bookings: 8 total (3 waiting, 1 checked-in, 1 in consultation, 1 completed today, 2 scheduled for afternoon)
-- Medical Records: 1 (completed booking)
-- Medications: 6
-- Prescriptions: 1 with 2 items
