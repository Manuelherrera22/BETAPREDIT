# ✅ Verificación del Cron Job

## 🎯 Pasos para Verificar

### 1. Verificar que el Cron Job se Creó

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Ver el cron job
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'auto-sync-hourly';
```

**Resultado esperado:**
- `jobname`: `auto-sync-hourly`
- `schedule`: `0 * * * *`
- `active`: `true`

### 2. Verificar en el Dashboard

1. Ve a **Database** → **Cron Jobs**
2. Deberías ver `auto-sync-hourly` en la lista
3. Estado debe ser **"Active"** o **"Enabled"**

### 3. Probar la Función Manualmente

#### Opción A: Desde el Dashboard
1. Ve a **Edge Functions** → **auto-sync** → **Invoke**
2. Haz clic en **"Invoke Function"**
3. Revisa los logs para ver el resultado

#### Opción B: Usando curl
```bash
curl -X POST https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 4. Revisar Logs

1. Ve a **Edge Functions** → **auto-sync** → **Logs**
2. Busca mensajes como:
   - `🔄 Starting automatic sync...`
   - `✅ Already have X upcoming events. Skipping sync.`
   - `✅ Generated X predictions, updated Y`

### 5. Verificar Eventos Sincronizados

1. Ve a **Database** → **Table Editor** → **Event**
2. Filtra por:
   - `isActive: true`
   - `status: SCHEDULED`
   - `startTime: >= today`
3. Deberías ver eventos nuevos o actualizados

### 6. Verificar Predicciones Generadas

1. Ve a **Database** → **Table Editor** → **Prediction**
2. Filtra por:
   - `modelVersion: v2.0-auto`
   - `createdAt: >= today`
3. Deberías ver predicciones generadas

### 7. Verificar Historial de Ejecuciones

Ejecuta este SQL:

```sql
-- Ver últimas ejecuciones del cron job
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-sync-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### El cron job no aparece

**Solución:**
1. Verifica que ejecutaste el SQL correctamente
2. Revisa si hay errores en el SQL Editor
3. Intenta ejecutar el SQL nuevamente

### El cron job no se ejecuta

**Solución:**
1. Verifica que esté **habilitado** (active: true)
2. Espera la próxima hora (ej: si son las 2:30, espera hasta las 3:00)
3. Revisa los logs de Edge Functions
4. Verifica que la función `auto-sync` esté desplegada

### Error: "Function not found"

**Solución:**
1. Verifica que `auto-sync` esté desplegada:
   ```bash
   supabase functions list --project-ref mdjzqxhjbisnlfpbjfgb
   ```
2. Si no está, despliégala:
   ```bash
   supabase functions deploy auto-sync --project-ref mdjzqxhjbisnlfpbjfgb
   ```

### No se sincronizan eventos

**Solución:**
1. Verifica que `THE_ODDS_API_KEY` esté configurada
2. Verifica que tenga créditos disponibles
3. Revisa los logs para ver errores específicos
4. El sistema puede estar saltando sincronizaciones si hay suficientes eventos (≥20)

### No se generan predicciones

**Solución:**
1. Verifica que los eventos tengan odds en la BD
2. Revisa los logs de `auto-sync`
3. Verifica que haya eventos con `isActive: true` y `status: SCHEDULED`

## ✅ Checklist de Verificación

- [ ] Cron job aparece en `cron.job` table
- [ ] Cron job está activo (active: true)
- [ ] Función `auto-sync` está desplegada
- [ ] Prueba manual funciona
- [ ] Logs muestran ejecución exitosa
- [ ] Eventos se sincronizan correctamente
- [ ] Predicciones se generan correctamente
- [ ] Historial de ejecuciones muestra runs exitosos

## 🎯 Resultado Esperado

Después de verificar todo:
- ✅ El cron job se ejecuta automáticamente cada hora
- ✅ Los eventos se sincronizan automáticamente
- ✅ Las predicciones se generan automáticamente
- ✅ No necesitas hacer nada manualmente
- ✅ El sistema funciona completamente solo

## 📊 Monitoreo Continuo

### Revisar Regularmente:

1. **Logs de Edge Functions**: Cada día, revisa los logs para asegurar que no hay errores
2. **Eventos en BD**: Verifica que haya eventos actualizados
3. **Predicciones**: Verifica que se generen nuevas predicciones
4. **Créditos de API**: Monitorea el uso de créditos de The Odds API

### Alertas Recomendadas:

Configura alertas en Supabase para:
- Errores en la función `auto-sync`
- Ejecuciones fallidas del cron job
- Tiempo de ejecución excesivo

