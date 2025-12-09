# Script para desplegar generate-predictions Edge Function
Write-Host "🚀 Desplegando generate-predictions Edge Function..." -ForegroundColor Cyan

# Verificar que el archivo existe
if (-not (Test-Path "supabase\functions\generate-predictions\index.ts")) {
    Write-Host "❌ Error: Archivo no encontrado en supabase\functions\generate-predictions\index.ts" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo encontrado" -ForegroundColor Green

# Proyecto ID
$projectRef = "mdjzqxhjbisnlfpbjfgb"

Write-Host "`n📦 Desplegando generate-predictions..." -ForegroundColor Yellow
Write-Host "Proyecto: $projectRef" -ForegroundColor Gray

# Desplegar
$result = supabase functions deploy generate-predictions --project-ref $projectRef 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ generate-predictions desplegada exitosamente!" -ForegroundColor Green
    Write-Host "`n🔗 URL de la función:" -ForegroundColor Cyan
    Write-Host "  https://$projectRef.supabase.co/functions/v1/generate-predictions" -ForegroundColor White
    Write-Host "`n💡 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "  1. Ve al dashboard de Supabase para verificar" -ForegroundColor White
    Write-Host "  2. Prueba desde el frontend en la página de Predictions" -ForegroundColor White
    Write-Host "  3. Revisa los logs en el dashboard si hay problemas" -ForegroundColor White
} else {
    Write-Host "`n❌ Error al desplegar generate-predictions" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host "`n💡 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "  - Verifica que estés autenticado: supabase login" -ForegroundColor White
    Write-Host "  - Verifica que tengas permisos en el proyecto" -ForegroundColor White
    Write-Host "  - Revisa que el archivo index.ts esté correcto" -ForegroundColor White
}

