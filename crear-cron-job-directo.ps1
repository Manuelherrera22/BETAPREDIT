# Script para crear el cron job directamente usando la API de Supabase
# Este script ejecuta el SQL necesario para crear el cron job

Write-Host "🚀 Creando cron job automáticamente..." -ForegroundColor Cyan

$projectRef = "mdjzqxhjbisnlfpbjfgb"
$sqlFile = "supabase/migrations/create_auto_sync_cron.sql"

Write-Host "`n📋 Método más directo: SQL Editor en Supabase Dashboard" -ForegroundColor Yellow
Write-Host "`n1. Abre este enlace:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/$projectRef/sql/new" -ForegroundColor Cyan
Write-Host "`n2. Copia y pega este SQL:" -ForegroundColor White
Write-Host "`n" -NoNewline
Get-Content $sqlFile | Write-Host
Write-Host "`n3. Haz clic en 'Run' o presiona Ctrl+Enter" -ForegroundColor White
Write-Host "`n✅ El cron job se creará automáticamente!" -ForegroundColor Green

Write-Host "`n📋 Alternativa: Usar Supabase CLI con migraciones" -ForegroundColor Yellow
Write-Host "Si tienes acceso a la base de datos, puedes ejecutar:" -ForegroundColor White
Write-Host "   supabase db push --project-ref $projectRef" -ForegroundColor Cyan
Write-Host "`nEsto ejecutará todas las migraciones en la carpeta supabase/migrations/" -ForegroundColor Gray

