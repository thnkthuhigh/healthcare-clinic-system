#!/usr/bin/env pwsh
# ============================================================
# repair-db.ps1 — Fix Flyway migration errors
# ============================================================
# Khi nào dùng:
#   - Backend start lỗi "checksum mismatch"
#   - Backend start lỗi "migration validate failed"
#
# Cách dùng:
#   cd apps/backend
#   .\repair-db.ps1
# ============================================================

Write-Host "`n=== Flyway Repair ===" -ForegroundColor Cyan
Write-Host "Repairing schema history to match current migration files...`n"

mvn flyway:repair

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Repair thanh cong! Chay lai 'npm run dev' binh thuong." -ForegroundColor Green
} else {
    Write-Host "`n[FAIL] Repair that bai." -ForegroundColor Red
    Write-Host "Thu chay: .\reset-db.ps1  (XOA TOAN BO DB va tao lai)`n" -ForegroundColor Yellow
}
