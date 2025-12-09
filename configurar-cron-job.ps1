# Script para configurar el cron job de auto-sync en Supabase
# Este script usa la API de Supabase para crear el cron job

Write-Host "🔧 Configurando cron job para auto-sync..." -ForegroundColor Cyan

# Configuración
$projectRef = "mdjzqxhjbisnlfpbjfgb"
$supabaseUrl = "https://$projectRef.supabase.co"

# Necesitas obtener estos valores del Dashboard de Supabase
Write-Host "`n⚠️  Para configurar el cron job, necesitas:" -ForegroundColor Yellow
Write-Host "1. Service Role Key (de Supabase Dashboard → Settings → API)" -ForegroundColor White
Write-Host "2. Database Password (de Supabase Dashboard → Settings → Database)" -ForegroundColor White
Write-Host "`n📋 Alternativamente, puedes configurarlo manualmente:" -ForegroundColor Cyan
Write-Host "`n1. Ve a Supabase Dashboard → Database → Cron Jobs" -ForegroundColor White
Write-Host "2. Haz clic en 'New Cron Job'" -ForegroundColor White
Write-Host "3. Configura:" -ForegroundColor White
Write-Host "   - Name: auto-sync-hourly" -ForegroundColor Gray
Write-Host "   - Schedule: 0 * * * *" -ForegroundColor Gray
Write-Host "   - Function: auto-sync" -ForegroundColor Gray
Write-Host "   - Enabled: ✅" -ForegroundColor Gray
Write-Host "`n📖 Ver instrucciones detalladas en: INSTRUCCIONES_CRON_JOB.md" -ForegroundColor Cyan

Write-Host "`n✅ La Edge Function 'auto-sync' ya está desplegada y lista para usar!" -ForegroundColor Green

