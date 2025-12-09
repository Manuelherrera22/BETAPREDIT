# Script para probar la función auto-sync manualmente

Write-Host "🧪 Probando la función auto-sync..." -ForegroundColor Cyan

$projectRef = "mdjzqxhjbisnlfpbjfgb"
$functionUrl = "https://$projectRef.supabase.co/functions/v1/auto-sync"

Write-Host "`n📋 Para probar manualmente:" -ForegroundColor Yellow
Write-Host "`n1. Ve a Supabase Dashboard → Edge Functions → auto-sync → Invoke" -ForegroundColor White
Write-Host "   O usa este comando curl:" -ForegroundColor White
Write-Host "`n   curl -X POST $functionUrl \" -ForegroundColor Cyan
Write-Host "     -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'" -ForegroundColor Gray

Write-Host "`n2. Revisa los logs en:" -ForegroundColor White
Write-Host "   Edge Functions → auto-sync → Logs" -ForegroundColor Cyan

Write-Host "`n3. Verifica eventos sincronizados:" -ForegroundColor White
Write-Host "   Database → Table Editor → Event" -ForegroundColor Cyan
Write-Host "   Deberías ver eventos nuevos o actualizados" -ForegroundColor Gray

Write-Host "`n4. Verifica predicciones generadas:" -ForegroundColor White
Write-Host "   Database → Table Editor → Prediction" -ForegroundColor Cyan
Write-Host "   Deberías ver predicciones con modelVersion: 'v2.0-auto'" -ForegroundColor Gray

Write-Host "`n✅ Si todo funciona, el cron job se ejecutará automáticamente cada hora!" -ForegroundColor Green

