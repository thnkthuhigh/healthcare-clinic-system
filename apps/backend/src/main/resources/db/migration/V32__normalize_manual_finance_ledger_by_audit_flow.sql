-- Chuẩn hóa các bút toán thủ công cũ theo flowType đã lưu trong audit log.
-- Mục tiêu: xử lý các bản ghi từng bị map sai chiều Thu/Chi/Nhập/Xuất.

WITH latest_manual_audit AS (
  SELECT DISTINCT ON (al.entity_id)
    al.entity_id::uuid AS ledger_id,
    upper(trim(coalesce(al.meta_json ->> 'flowType', ''))) AS flow_type
  FROM audit_logs al
  WHERE al.action = 'MANUAL_FINANCE_ENTRY'
    AND al.entity_type = 'FINANCE_LEDGER'
    AND al.entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ORDER BY al.entity_id, al.created_at DESC
),
normalized AS (
  SELECT
    ledger_id,
    CASE
      WHEN flow_type = 'THU' THEN 'INCOME'
      ELSE 'EXPENSE'
    END AS target_entry_type,
    CASE
      WHEN flow_type = 'THU' THEN 'MANUAL_INCOME'
      WHEN flow_type = 'CHI' THEN 'MANUAL_EXPENSE'
      WHEN flow_type = 'NHAP' THEN 'MANUAL_STOCK_IN'
      WHEN flow_type = 'XUAT' THEN 'MANUAL_STOCK_OUT'
      ELSE NULL
    END AS target_category
  FROM latest_manual_audit
  WHERE flow_type IN ('THU', 'CHI', 'NHAP', 'XUAT')
)
UPDATE finance_ledger fl
SET
  entry_type = n.target_entry_type,
  category = n.target_category
FROM normalized n
WHERE fl.id = n.ledger_id
  AND fl.ref_type = 'MANUAL'
  AND n.target_category IS NOT NULL
  AND (
    fl.entry_type IS DISTINCT FROM n.target_entry_type
    OR fl.category IS DISTINCT FROM n.target_category
  );

-- Fallback: đảm bảo entry_type nhất quán với category cho dữ liệu thủ công.
UPDATE finance_ledger
SET entry_type = 'INCOME'
WHERE ref_type = 'MANUAL'
  AND category = 'MANUAL_INCOME'
  AND entry_type IS DISTINCT FROM 'INCOME';

UPDATE finance_ledger
SET entry_type = 'EXPENSE'
WHERE ref_type = 'MANUAL'
  AND category IN ('MANUAL_EXPENSE', 'MANUAL_STOCK_IN', 'MANUAL_STOCK_OUT')
  AND entry_type IS DISTINCT FROM 'EXPENSE';
