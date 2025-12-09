# Script para ejecutar la limpieza de predicciones
# Ejecuta la Edge Function cleanup-predictions

Write-Host "🧹 Ejecutando limpieza de predicciones..." -ForegroundColor Cyan

# Cargar variables de entorno
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configurados" -ForegroundColor Red
    Write-Host "   Verifica que el archivo .env contenga estas variables" -ForegroundColor Yellow
    exit 1
}

# Construir URL de la función
$functionUrl = "$supabaseUrl/functions/v1/cleanup-predictions"

Write-Host "📡 Invocando función: $functionUrl" -ForegroundColor Gray

# Invocar la función
$headers = @{
    "Authorization" = "Bearer $supabaseKey"
    "apikey" = $supabaseKey
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri $functionUrl -Method POST -Headers $headers -ErrorAction Stop

if ($response.success) {
    Write-Host "✅ Limpieza completada exitosamente!" -ForegroundColor Green
    Write-Host "   Predicciones eliminadas: $($response.data.deleted)" -ForegroundColor Cyan
    Write-Host "   Eventos procesados: $($response.data.eventsProcessed)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Resumen:" -ForegroundColor Yellow
    Write-Host "   - Total eliminado: $($response.data.deleted) predicciones" -ForegroundColor White
    Write-Host "   - Eventos afectados: $($response.data.eventsProcessed)" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ Proceso completado" -ForegroundColor Green
}
else {
    Write-Host "❌ Error en la limpieza: $($response.error.message)" -ForegroundColor Red
    exit 1
}
