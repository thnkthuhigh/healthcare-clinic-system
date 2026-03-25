-- Standardize shift windows to UTC+7 clinic hours.
-- Morning: 07:00 - 12:00
-- Afternoon: 13:00 - 18:00

UPDATE shifts
SET
  start_time = (date::timestamp + TIME '07:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
  end_time   = (date::timestamp + TIME '12:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
WHERE type = 'MORNING';

UPDATE shifts
SET
  start_time = (date::timestamp + TIME '13:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
  end_time   = (date::timestamp + TIME '18:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
WHERE type = 'AFTERNOON';
