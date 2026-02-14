# Sinavim - Gereksiz klasörleri temizle
# Geliştirme sırasında biriken cache/build dosyalarını siler
# Kullanım: .\clean.ps1

Write-Host "Temizlik başlıyor..." -ForegroundColor Cyan

# Backend
if (Test-Path "backend\__pycache__") {
    Remove-Item "backend\__pycache__" -Recurse -Force
    Write-Host "[OK] backend/__pycache__ silindi" -ForegroundColor Green
}
if (Test-Path "backend\.pytest_cache") {
    Remove-Item "backend\.pytest_cache" -Recurse -Force
    Write-Host "[OK] backend/.pytest_cache silindi" -ForegroundColor Green
}

# Frontend
if (Test-Path "frontend\.expo") {
    Remove-Item "frontend\.expo" -Recurse -Force
    Write-Host "[OK] frontend/.expo silindi" -ForegroundColor Green
}
if (Test-Path "frontend\dist") {
    Remove-Item "frontend\dist" -Recurse -Force
    Write-Host "[OK] frontend/dist silindi" -ForegroundColor Green
}
if (Test-Path "frontend\node_modules") {
    Remove-Item "frontend\node_modules" -Recurse -Force
    Write-Host "[OK] frontend/node_modules silindi" -ForegroundColor Green
}
if (Test-Path "frontend\web-build") {
    Remove-Item "frontend\web-build" -Recurse -Force
    Write-Host "[OK] frontend/web-build silindi" -ForegroundColor Green
}

Write-Host "`nTemizlik tamamlandı!" -ForegroundColor Cyan
Write-Host "Frontend çalıştırmak için: cd frontend && npm install" -ForegroundColor Yellow
