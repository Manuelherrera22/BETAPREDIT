# Script para probar la Edge Function generate-predictions
# Uso: .\test-generate-predictions.ps1

Write-Host "🧪 Probando Edge Function generate-predictions..." -ForegroundColor Cyan

# Configuración
$projectRef = "mdjzqxhjbisnlfpbjfgb"
$functionUrl = "https://$projectRef.supabase.co/functions/v1/generate-predictions"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"

Write-Host "`n📋 Información:" -ForegroundColor Yellow
Write-Host "  URL: $functionUrl" -ForegroundColor White
Write-Host "  Método: POST" -ForegroundColor White

Write-Host "`n⚠️  NOTA: Esta función requiere autenticación." -ForegroundColor Yellow
Write-Host "Para probarla completamente, necesitas:" -ForegroundColor Yellow
Write-Host "  1. Un token JWT válido de Supabase Auth" -ForegroundColor White
Write-Host "  2. O probarla desde el frontend en producción" -ForegroundColor White

Write-Host "`n🔗 Para obtener un token:" -ForegroundColor Cyan
Write-Host "  1. Inicia sesión en la aplicación" -ForegroundColor White
Write-Host "  2. Abre la consola del navegador" -ForegroundColor White
Write-Host "  3. Ejecuta: localStorage.getItem('supabase.auth.token')" -ForegroundColor White
Write-Host "  4. O usa el token del store de autenticación" -ForegroundColor White

Write-Host "`n✅ Verificación de deployment:" -ForegroundColor Cyan
Write-Host "  Ve a: https://supabase.com/dashboard/project/$projectRef/edge-functions" -ForegroundColor White
Write-Host "  Deberías ver 'generate-predictions' en la lista" -ForegroundColor White

Write-Host "`n💡 Prueba desde el frontend:" -ForegroundColor Cyan
Write-Host "  1. Ve a la página de Predictions" -ForegroundColor White
Write-Host "  2. Haz clic en 'Generar Predicciones'" -ForegroundColor White
Write-Host "  3. Verifica que funcione correctamente" -ForegroundColor White

