# Script para crear el cron job automáticamente usando SQL
# Este script se conecta a Supabase y ejecuta el SQL necesario

Write-Host "🚀 Creando cron job automáticamente..." -ForegroundColor Cyan

$projectRef = "mdjzqxhjbisnlfpbjfgb"

Write-Host "`n📋 Opción 1: Usar Supabase CLI (Recomendado)" -ForegroundColor Yellow
Write-Host "Ejecuta este comando:" -ForegroundColor White
Write-Host "`nsupabase db execute --project-ref $projectRef --file supabase/migrations/create_auto_sync_cron.sql" -ForegroundColor Green

Write-Host "`n📋 Opción 2: Usar SQL Editor en Supabase Dashboard" -ForegroundColor Yellow
Write-Host "1. Ve a: https://supabase.com/dashboard/project/$projectRef/sql/new" -ForegroundColor White
Write-Host "2. Copia y pega el contenido de: supabase/migrations/create_auto_sync_cron.sql" -ForegroundColor White
Write-Host "3. Haz clic en 'Run'" -ForegroundColor White

Write-Host "`n📋 Opción 3: Usar psql directamente" -ForegroundColor Yellow

# Intentar obtener la connection string desde .env
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "`n🔍 Buscando DATABASE_URL en .env..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'DATABASE_URL=(.+)') {
        $dbUrl = $matches[1].Trim()
        Write-Host "✅ DATABASE_URL encontrado" -ForegroundColor Green
        Write-Host "`nEjecuta este comando:" -ForegroundColor White
        Write-Host "psql `"$dbUrl`" -f supabase/migrations/create_auto_sync_cron.sql" -ForegroundColor Green
    } else {
        Write-Host "⚠️  DATABASE_URL no encontrado en .env" -ForegroundColor Yellow
    }
}

Write-Host "`n📖 Para más detalles, ver: CREAR_CRON_JOB_MANUAL.md" -ForegroundColor Cyan

