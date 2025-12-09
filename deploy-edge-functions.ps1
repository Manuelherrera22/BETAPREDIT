# Script para desplegar Edge Functions a Supabase
# Uso: .\deploy-edge-functions.ps1

Write-Host "🚀 Desplegando Edge Functions a Supabase..." -ForegroundColor Cyan

# Verificar que Supabase CLI está instalado
$supabaseVersion = supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI no está instalado. Instálalo con: npm install -g supabase" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green

# Proyecto ID
$projectRef = "mdjzqxhjbisnlfpbjfgb"

# Lista de funciones a desplegar
$functions = @("external-bets", "user-statistics", "sync-events")

foreach ($function in $functions) {
    Write-Host "`n📦 Desplegando $function..." -ForegroundColor Yellow
    
    $result = supabase functions deploy $function --project-ref $projectRef 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $function desplegada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al desplegar $function" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host "`n✨ Deployment completado!" -ForegroundColor Cyan
Write-Host "`n🔗 URLs de las funciones:" -ForegroundColor Cyan
Write-Host "  - External Bets: https://$projectRef.supabase.co/functions/v1/external-bets" -ForegroundColor White
Write-Host "  - User Statistics: https://$projectRef.supabase.co/functions/v1/user-statistics" -ForegroundColor White
Write-Host "  - Sync Events: https://$projectRef.supabase.co/functions/v1/sync-events" -ForegroundColor White

