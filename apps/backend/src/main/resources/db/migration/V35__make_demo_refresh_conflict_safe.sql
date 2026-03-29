-- V35: Make refresh_demo_data() safe when ad-hoc shifts already exist today.

CREATE OR REPLACE FUNCTION refresh_demo_data()
RETURNS TEXT AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_hold_date DATE := CURRENT_DATE + 14;
BEGIN
    -- Move non-demo shifts for seeded doctor/time slots away from today first.
    UPDATE shifts
    SET
        date = v_hold_date,
        start_time = CASE
            WHEN type = 'MORNING' THEN (v_hold_date::timestamp + TIME '07:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
            ELSE (v_hold_date::timestamp + TIME '13:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
        END,
        end_time = CASE
            WHEN type = 'MORNING' THEN (v_hold_date::timestamp + TIME '12:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
            ELSE (v_hold_date::timestamp + TIME '18:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
        END
    WHERE date = v_today
      AND id NOT IN (
          'e0000000-0000-0000-0000-000000000001',
          'e0000000-0000-0000-0000-000000000002',
          'e0000000-0000-0000-0000-000000000003',
          'e0000000-0000-0000-0000-000000000004'
      )
      AND (
          (doctor_id = 'b0000000-0000-0000-0000-000000000001' AND type IN ('MORNING', 'AFTERNOON'))
          OR (doctor_id = 'b0000000-0000-0000-0000-000000000002' AND type = 'MORNING')
          OR (doctor_id = 'b0000000-0000-0000-0000-000000000003' AND type = 'MORNING')
      );

    -- Bring the seeded demo shifts back to today.
    UPDATE shifts
    SET
        date = v_today,
        start_time = (v_today::timestamp + TIME '07:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
        end_time = (v_today::timestamp + TIME '11:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
    WHERE id = 'e0000000-0000-0000-0000-000000000001';

    UPDATE shifts
    SET
        date = v_today,
        start_time = (v_today::timestamp + TIME '13:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
        end_time = (v_today::timestamp + TIME '17:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
    WHERE id = 'e0000000-0000-0000-0000-000000000002';

    UPDATE shifts
    SET
        date = v_today,
        start_time = (v_today::timestamp + TIME '08:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
        end_time = (v_today::timestamp + TIME '12:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
    WHERE id = 'e0000000-0000-0000-0000-000000000003';

    UPDATE shifts
    SET
        date = v_today,
        start_time = (v_today::timestamp + TIME '07:30:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
        end_time = (v_today::timestamp + TIME '11:30:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
    WHERE id = 'e0000000-0000-0000-0000-000000000004';

    -- Refresh booking timestamps to today while preserving the intended queue story.
    UPDATE bookings
    SET
        check_in_at = CASE
            WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN v_today::timestamp + TIME '08:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000002' THEN v_today::timestamp + TIME '08:15:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000003' THEN v_today::timestamp + TIME '08:30:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000004' THEN v_today::timestamp + TIME '08:45:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN v_today::timestamp + TIME '07:30:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000008' THEN v_today::timestamp + TIME '08:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000009' THEN v_today::timestamp + TIME '09:00:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000a' THEN v_today::timestamp + TIME '09:10:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000c' THEN v_today::timestamp + TIME '07:40:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000d' THEN v_today::timestamp + TIME '07:50:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000e' THEN v_today::timestamp + TIME '08:05:00'
            ELSE check_in_at
        END,
        started_at = CASE
            WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN v_today::timestamp + TIME '08:10:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000c' THEN v_today::timestamp + TIME '07:45:00'
            ELSE started_at
        END,
        completed_at = CASE
            WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN v_today::timestamp + TIME '07:55:00'
            ELSE completed_at
        END,
        created_at = CASE
            WHEN id = 'f0000000-0000-0000-0000-000000000001' THEN v_today::timestamp + TIME '07:45:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000002' THEN v_today::timestamp + TIME '08:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000003' THEN v_today::timestamp + TIME '08:10:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000004' THEN v_today::timestamp + TIME '08:20:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000005' THEN v_today::timestamp + TIME '07:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000006' THEN v_today::timestamp + TIME '09:00:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000007' THEN v_today::timestamp + TIME '09:05:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000008' THEN v_today::timestamp + TIME '07:50:00'
            WHEN id = 'f0000000-0000-0000-0000-000000000009' THEN v_today::timestamp + TIME '08:50:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000a' THEN v_today::timestamp + TIME '09:05:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000b' THEN v_today::timestamp + TIME '09:00:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000c' THEN v_today::timestamp + TIME '07:30:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000d' THEN v_today::timestamp + TIME '07:45:00'
            WHEN id = 'f0000000-0000-0000-0000-00000000000e' THEN v_today::timestamp + TIME '08:00:00'
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
        'f0000000-0000-0000-0000-000000000008',
        'f0000000-0000-0000-0000-000000000009',
        'f0000000-0000-0000-0000-00000000000a',
        'f0000000-0000-0000-0000-00000000000b',
        'f0000000-0000-0000-0000-00000000000c',
        'f0000000-0000-0000-0000-00000000000d',
        'f0000000-0000-0000-0000-00000000000e'
    );

    UPDATE medical_records
    SET
        created_at = v_today::timestamp + TIME '07:45:00',
        updated_at = v_today::timestamp + TIME '07:55:00'
    WHERE id = 'a1000000-0000-0000-0000-000000000001';

    UPDATE prescriptions
    SET
        created_at = v_today::timestamp + TIME '07:55:00',
        updated_at = v_today::timestamp + TIME '07:55:00'
    WHERE id = 'a3000000-0000-0000-0000-000000000001';

    RETURN 'Demo data refreshed to ' || v_today::TEXT;
END;
$$ LANGUAGE plpgsql;

SELECT refresh_demo_data();
