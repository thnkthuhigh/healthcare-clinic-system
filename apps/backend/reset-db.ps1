#!/usr/bin/env pwsh
# ============================================================
# reset-db.ps1 — XOA TOAN BO DB va tao lai tu dau
# ============================================================
# CANH BAO: Script nay se XOA het du lieu!
# Chi dung khi repair-db.ps1 khong giai quyet duoc.
#
# Cach dung:
#   cd apps/backend
#   .\reset-db.ps1
# ============================================================

Write-Host "`n=== Database Reset ===" -ForegroundColor Red
Write-Host "CANH BAO: Thao tac nay se XOA TOAN BO du lieu trong clinic_dev!`n" -ForegroundColor Yellow

$confirm = Read-Host "Nhap 'yes' de xac nhan"
if ($confirm -ne 'yes') {
    Write-Host "Huy bo." -ForegroundColor Gray
    exit 0
}

Write-Host "`n1. Drop database clinic_dev..." -ForegroundColor Cyan
docker exec clinic_postgres psql -U postgres -c "DROP DATABASE IF EXISTS clinic_dev;"

Write-Host "2. Tao lai database clinic_dev..." -ForegroundColor Cyan
docker exec clinic_postgres psql -U postgres -c "CREATE DATABASE clinic_dev OWNER postgres;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Database da reset! Chay 'npm run dev' de Flyway migrate tu V1." -ForegroundColor Green
} else {
    Write-Host "`n[FAIL] Khong the reset. Dam bao Docker dang chay: docker compose up -d" -ForegroundColor Red
}
