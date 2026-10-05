# =========================================================
# NetMine AI - Start Backend Server
# Run this from the project root: f:\netmine
#
# Usage:
#   .\start_backend.ps1
# =========================================================
Write-Host ""
Write-Host "  NetMine AI - FastAPI Backend" -ForegroundColor Cyan
Write-Host "  ==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server:   http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  Health:   http://localhost:8000/api/health" -ForegroundColor Green
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"
& "$PSScriptRoot\.venv\Scripts\uvicorn.exe" app.main:app --reload --reload-dir . --reload-dir "$PSScriptRoot\packet_capture" --host 0.0.0.0 --port 8000
