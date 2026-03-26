-- Fix legacy price outliers caused by previous unit-conversion bugs.
-- Target only very large values to avoid touching normal price ranges.

UPDATE services
SET price_cents = CASE
  WHEN price_cents >= 1000000000 AND mod(price_cents, 1000) = 0 THEN price_cents / 1000
  WHEN price_cents >= 1000000000 AND mod(price_cents, 100) = 0 THEN price_cents / 100
  ELSE price_cents
END
WHERE price_cents >= 1000000000;

UPDATE medications
SET price_cents = CASE
  WHEN price_cents >= 1000000000 AND mod(price_cents, 1000) = 0 THEN price_cents / 1000
  WHEN price_cents >= 1000000000 AND mod(price_cents, 100) = 0 THEN price_cents / 100
  ELSE price_cents
END
WHERE price_cents >= 1000000000;
