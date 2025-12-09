# 🧪 Prueba de Edge Function: generate-predictions

## ✅ Deployment

La Edge Function `generate-predictions` ha sido desplegada a Supabase.

**URL de la función:**
```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/generate-predictions
```

## 🔍 Verificación del Deployment

### 1. Verificar en Dashboard de Supabase

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/edge-functions
2. Busca `generate-predictions` en la lista
3. Verifica que esté activa y tenga la última versión

### 2. Verificar Logs

1. En el dashboard de Supabase, ve a **Edge Functions** → **generate-predictions**
2. Haz clic en **Logs**
3. Deberías ver logs cuando se ejecute la función

## 🧪 Pruebas

### Prueba 1: Desde el Frontend (Recomendado)

1. **Abre la aplicación en producción** (o desarrollo si está configurado)
2. **Inicia sesión** con tu cuenta
3. **Ve a la página de Predictions** (`/predictions`)
4. **Haz clic en "Generar Predicciones"**
5. **Verifica:**
   - ✅ No hay error 400
   - ✅ Aparece un mensaje de éxito o información
   - ✅ Se muestran predicciones (si hay eventos con odds)
   - ✅ La consola no muestra errores

### Prueba 2: Desde la Consola del Navegador

1. **Abre la consola del navegador** (F12)
2. **Ejecuta:**
   ```javascript
   // Obtener token de Supabase
   const { supabase } = await import('./src/config/supabase');
   const { data: { session } } = await supabase.auth.getSession();
   const token = session?.access_token;
   
   // Llamar a la función
   const response = await fetch('https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/generate-predictions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0',
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({}),
   });
   
   const result = await response.json();
   console.log('Resultado:', result);
   ```

### Prueba 3: Verificar en Base de Datos

Después de ejecutar la función, verifica que se hayan creado predicciones:

```sql
-- En Supabase SQL Editor
SELECT 
  COUNT(*) as total_predictions,
  COUNT(DISTINCT "eventId") as events_with_predictions,
  AVG("predictedProbability") as avg_probability,
  AVG("confidence") as avg_confidence
FROM "Prediction"
WHERE "modelVersion" = 'v2.0-edge'
  AND "createdAt" >= NOW() - INTERVAL '1 hour';
```

## ✅ Resultados Esperados

### Caso 1: Hay Eventos con Odds
```json
{
  "success": true,
  "message": "Generated X predictions, updated Y",
  "data": {
    "generated": 10,
    "updated": 2,
    "errors": 0
  }
}
```

### Caso 2: No Hay Eventos
```json
{
  "success": true,
  "message": "No active sports found. Cannot generate predictions.",
  "data": {
    "generated": 0,
    "updated": 0,
    "errors": 0
  }
}
```

### Caso 3: No Hay Odds Disponibles
```json
{
  "success": true,
  "message": "Generated 0 predictions, updated 0",
  "data": {
    "generated": 0,
    "updated": 0,
    "errors": 0
  }
}
```

## 🐛 Troubleshooting

### Error: "Unauthorized"
- **Causa:** Token no válido o expirado
- **Solución:** Inicia sesión nuevamente en la aplicación

### Error: "Supabase configuration missing"
- **Causa:** Variables de entorno no configuradas en Supabase
- **Solución:** Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas en los secrets de Supabase

### Error: "No active sports found"
- **Causa:** No hay deportes activos en la BD
- **Solución:** Sincroniza eventos primero usando `sync-events`

### Error: "No odds available"
- **Causa:** Los eventos no tienen odds en la BD
- **Solución:** Sincroniza eventos con odds desde The Odds API

## 📊 Verificación de Logs

Revisa los logs en Supabase Dashboard:
1. Ve a **Edge Functions** → **generate-predictions** → **Logs**
2. Busca mensajes como:
   - `Starting prediction generation...`
   - `Processing sport: soccer_epl`
   - `Found X events for sport...`
   - `Prediction generation completed: X generated, Y updated, Z errors`

## ✅ Checklist de Prueba

- [ ] Edge Function desplegada correctamente
- [ ] Función visible en dashboard de Supabase
- [ ] Prueba desde frontend exitosa
- [ ] No hay errores en consola
- [ ] Se generan predicciones (si hay eventos con odds)
- [ ] Logs muestran actividad correcta
- [ ] Predicciones aparecen en la BD con `modelVersion = 'v2.0-edge'`

---

**Una vez completada la prueba, el sistema debería funcionar correctamente en producción.** 🎉

