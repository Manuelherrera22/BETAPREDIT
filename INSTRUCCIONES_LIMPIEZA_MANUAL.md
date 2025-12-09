# Instrucciones para Ejecutar Limpieza de Predicciones Manualmente

## Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/functions)
2. Navega a **Functions** → **cleanup-predictions**
3. Haz clic en el botón **"Invoke"** o **"Test"**
4. Revisa los logs para ver el resultado:
   - Predicciones eliminadas
   - Eventos procesados

## Opción 2: Desde SQL Editor (Alternativa)

Si prefieres ejecutar la limpieza directamente desde SQL:

```sql
-- Eliminar predicciones de eventos inactivos o finalizados
DELETE FROM "Prediction"
WHERE "eventId" IN (
  SELECT id FROM "Event"
  WHERE 
    "isActive" = false 
    OR "status" = 'FINISHED' 
    OR "status" = 'CANCELLED'
    OR "startTime" < NOW() - INTERVAL '2 days'
);
```

**⚠️ IMPORTANTE:** Haz un backup antes de ejecutar este SQL.

## Opción 3: Usar curl (Desde Terminal)

```bash
curl -X POST \
  'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/cleanup-predictions' \
  -H 'Authorization: Bearer TU_SERVICE_ROLE_KEY' \
  -H 'apikey: TU_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

Reemplaza `TU_SERVICE_ROLE_KEY` con tu clave de servicio de Supabase.

## Verificación

Después de ejecutar la limpieza:

1. Ve a Supabase Dashboard → Table Editor → `Prediction`
2. Verifica que solo haya predicciones para eventos:
   - `isActive: true`
   - `status: SCHEDULED`
   - `startTime` en el futuro

## Resultado Esperado

- ✅ Predicciones de eventos antiguos eliminadas
- ✅ Solo predicciones relevantes en la BD
- ✅ Frontend mostrará solo predicciones de eventos activos

