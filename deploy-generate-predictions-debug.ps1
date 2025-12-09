# Script de deployment con debug
Write-Host "🚀 Desplegando generate-predictions..." -ForegroundColor Cyan

$projectRef = "mdjzqxhjbisnlfpbjfgb"
$functionName = "generate-predictions"
$logFile = "deploy-generate-predictions.log"

# Verificar archivo
if (-not (Test-Path "supabase\functions\$functionName\index.ts")) {
    Write-Host "❌ Archivo no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo encontrado" -ForegroundColor Green

# Ejecutar deployment y guardar salida
Write-Host "📦 Ejecutando deployment..." -ForegroundColor Yellow

$output = supabase functions deploy $functionName --project-ref $projectRef 2>&1 | Tee-Object -Variable deployOutput

# Guardar en archivo
$deployOutput | Out-File -FilePath $logFile -Encoding UTF8

# Mostrar resultado
Write-Host "`n=== RESULTADO ===" -ForegroundColor Cyan
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment exitoso!" -ForegroundColor Green
    Write-Host "📄 Log guardado en: $logFile" -ForegroundColor Gray
} else {
    Write-Host "❌ Error en deployment (código: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "📄 Revisa el log en: $logFile" -ForegroundColor Yellow
    Get-Content $logFile
}

Write-Host "`n🔗 URL: https://$projectRef.supabase.co/functions/v1/$functionName" -ForegroundColor Cyan

