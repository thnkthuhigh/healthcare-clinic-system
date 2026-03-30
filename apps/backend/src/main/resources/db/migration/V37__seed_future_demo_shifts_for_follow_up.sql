-- Seed open demo shifts for the next 7 days so follow-up booking works in Docker/demo.

WITH shift_templates AS (
    SELECT *
    FROM (
        VALUES
            ('b0000000-0000-0000-0000-000000000001'::uuid, 'MORNING'::shift_type, TIME '07:00:00', TIME '11:00:00', 20),
            ('b0000000-0000-0000-0000-000000000001'::uuid, 'AFTERNOON'::shift_type, TIME '13:00:00', TIME '17:00:00', 20),
            ('b0000000-0000-0000-0000-000000000002'::uuid, 'MORNING'::shift_type, TIME '08:00:00', TIME '12:00:00', 15),
            ('b0000000-0000-0000-0000-000000000003'::uuid, 'MORNING'::shift_type, TIME '07:30:00', TIME '11:30:00', 20)
    ) AS template(doctor_id, type, start_clock, end_clock, slot_count)
),
future_days AS (
    SELECT generate_series(CURRENT_DATE + 1, CURRENT_DATE + 7, INTERVAL '1 day')::date AS shift_date
),
inserted_shifts AS (
    INSERT INTO shifts (doctor_id, date, type, start_time, end_time, status, created_at)
    SELECT
        template.doctor_id,
        future.shift_date,
        template.type,
        (future.shift_date::timestamp + template.start_clock) AT TIME ZONE 'Asia/Ho_Chi_Minh',
        (future.shift_date::timestamp + template.end_clock) AT TIME ZONE 'Asia/Ho_Chi_Minh',
        'OPEN',
        CURRENT_TIMESTAMP
    FROM shift_templates template
    CROSS JOIN future_days future
    ON CONFLICT (doctor_id, date, type) DO NOTHING
    RETURNING id, doctor_id, date, type
),
target_shifts AS (
    SELECT s.id, s.doctor_id, s.type, template.slot_count
    FROM shifts s
    JOIN shift_templates template
      ON template.doctor_id = s.doctor_id
     AND template.type = s.type
    WHERE s.date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7
),
slot_candidates AS (
    SELECT
        target.id AS shift_id,
        generate_series(1, target.slot_count) AS sequence
    FROM target_shifts target
)
INSERT INTO slots (shift_id, sequence, pool, status)
SELECT
    candidate.shift_id,
    candidate.sequence,
    'COMMON',
    'OPEN'
FROM slot_candidates candidate
WHERE NOT EXISTS (
    SELECT 1
    FROM slots existing
    WHERE existing.shift_id = candidate.shift_id
      AND existing.sequence = candidate.sequence
);
