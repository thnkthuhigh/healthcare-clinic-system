-- V9: Add a function to refresh demo seed data to today's date
-- Run anytime via: SELECT refresh_demo_data();
-- Called automatically on dev server startup via npm run dev

CREATE OR REPLACE FUNCTION refresh_demo_data()
RETURNS TEXT AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_shift1 UUID := 'e0000000-0000-0000-0000-000000000001';
    v_shift2 UUID := 'e0000000-0000-0000-0000-000000000002';
    v_shift3 UUID := 'e0000000-0000-0000-0000-000000000003';
BEGIN
    -- ============================================================
    -- Update shifts to today's date
    -- ============================================================
    UPDATE shifts SET
        date       = v_today,
        start_time = v_today + TIME '07:00:00',
        end_time   = v_today + TIME '11:00:00'
    WHERE id = v_shift1;

    UPDATE shifts SET
        date       = v_today,
        start_time = v_today + TIME '13:00:00',
        end_time   = v_today + TIME '17:00:00'
    WHERE id = v_shift2;

    UPDATE shifts SET
        date       = v_today,
        start_time = v_today + TIME '08:00:00',
        end_time   = v_today + TIME '12:00:00'
    WHERE id = v_shift3;

    -- ============================================================
    -- Reset booking timestamps to today (keep relative offsets)
    -- ============================================================
    -- Shift 1 bookings
    UPDATE bookings SET
        check_in_at = CASE
            WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN v_today::timestamp + TIME '08:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000002' THEN v_today::timestamp + TIME '08:15:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000003' THEN v_today::timestamp + TIME '08:30:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000004' THEN v_today::timestamp + TIME '08:45:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN v_today::timestamp + TIME '07:30:00'
            ELSE check_in_at
        END,
        created_at = CASE
            WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN v_today::timestamp + TIME '07:45:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000002' THEN v_today::timestamp + TIME '08:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000003' THEN v_today::timestamp + TIME '08:10:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000004' THEN v_today::timestamp + TIME '08:20:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN v_today::timestamp + TIME '07:00:00'
            ELSE created_at
        END
    WHERE shift_id = v_shift1;

    -- Shift 2 bookings (afternoon, no check_in yet)
    UPDATE bookings SET
        created_at = v_today::timestamp + TIME '09:00:00'
    WHERE shift_id = v_shift2;

    -- Shift 3 bookings
    UPDATE bookings SET
        check_in_at = v_today::timestamp + TIME '08:00:00',
        created_at  = v_today::timestamp + TIME '07:50:00'
    WHERE shift_id = v_shift3;

    -- ============================================================
    -- Update medical record timestamps
    -- ============================================================
    UPDATE medical_records SET
        created_at = v_today::timestamp + TIME '07:45:00',
        updated_at = v_today::timestamp + TIME '07:45:00'
    WHERE id = 'a1000000-0000-0000-0000-000000000001';

    -- Update prescription timestamps
    UPDATE prescriptions SET
        created_at = v_today::timestamp + TIME '07:45:00',
        updated_at = v_today::timestamp + TIME '07:45:00'
    WHERE id = 'a3000000-0000-0000-0000-000000000001';

    RETURN 'Demo data refreshed to ' || v_today::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run immediately after creating the function
SELECT refresh_demo_data();
