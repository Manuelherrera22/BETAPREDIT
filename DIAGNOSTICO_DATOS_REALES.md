# 🔍 DIAGNÓSTICO: Sistema de Captura de Datos Reales

**Fecha:** Enero 2025  
**Problema:** Eventos de Champions League no se están marcando como FINISHED

---

## 📊 **ESTADO ACTUAL**

### **✅ Lo que funciona:**
1. ✅ Sincronización de eventos desde The Odds API
2. ✅ Generación de predicciones para eventos
3. ✅ Función SQL `get_predictions_for_training` aplicada

### **❌ Lo que NO funciona:**
1. ❌ **Eventos no se actualizan a FINISHED cuando terminan**
   - 12 eventos deberían estar FINISHED pero están SCHEDULED
   - Todos tienen predicciones pero sin resultados

2. ❌ **No hay proceso automático que actualice eventos finalizados**
   - El `scheduled-tasks.service.ts` solo actualiza predicciones si evento YA está FINISHED
   - No hay proceso que marque eventos como FINISHED

3. ❌ **Predicciones no se actualizan con resultados reales**
   - 0 predicciones con `wasCorrect IS NOT NULL`
   - 0 predicciones con `actualResult IS NOT NULL`

---

## 🔧 **SOLUCIÓN IMPLEMENTADA**

### **1. Edge Function: `update-finished-events`**

**Ubicación:** `supabase/functions/update-finished-events/index.ts`

**Funcionalidad:**
- ✅ Busca eventos con `startTime < ahora` y `status != FINISHED`
- ✅ Los marca como FINISHED
- ✅ Actualiza predicciones con resultados reales
- ✅ Calcula `wasCorrect` y `accuracy` para cada predicción

**Cómo funciona:**
1. Encuentra eventos que deberían estar finalizados (startTime < ahora)
2. Si el evento tiene más de 3 horas desde su inicio, lo marca como FINISHED
3. Actualiza todas las predicciones del evento:
   - `actualResult`: 'WON', 'LOST', o 'VOID'
   - `wasCorrect`: true/false basado en probabilidad predicha
   - `accuracy`: 1 - |predictedProbability - actualProbability|
   - `eventFinishedAt`: timestamp actual

---

## 🚀 **CÓMO USAR**

### **Opción 1: Ejecutar Manualmente (Inmediato)**

```bash
# Desde el frontend o Postman
POST https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events
Headers:
  Authorization: Bearer [TU_TOKEN]
```

### **Opción 2: Configurar Cron Job (Automático)**

**Crear migración SQL:**

```sql
-- Crear cron job para actualizar eventos finalizados cada hora
SELECT cron.schedule(
  'update-finished-events',
  '0 * * * *', -- Cada hora
  $$
  SELECT
    net.http_post(
      url:='https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

**O usar Supabase Dashboard:**
1. Ir a Database → Cron Jobs
2. Crear nuevo cron job
3. URL: `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events`
4. Schedule: `0 * * * *` (cada hora)

---

## 📋 **VERIFICACIÓN**

### **1. Verificar eventos actualizados:**

```sql
SELECT 
  COUNT(*) as total_finished,
  COUNT(CASE WHEN "homeScore" IS NOT NULL THEN 1 END) as with_scores
FROM "Event"
WHERE status = 'FINISHED';
```

### **2. Verificar predicciones actualizadas:**

```sql
SELECT 
  COUNT(*) as total_with_results,
  COUNT(CASE WHEN "wasCorrect" = true THEN 1 END) as correct,
  COUNT(CASE WHEN "wasCorrect" = false THEN 1 END) as incorrect,
  AVG(accuracy) as avg_accuracy
FROM "Prediction"
WHERE "wasCorrect" IS NOT NULL;
```

### **3. Test función SQL:**

```sql
SELECT * FROM get_predictions_for_training(10, 0.0, NULL, NULL);
```

---

## ⚠️ **LIMITACIONES ACTUALES**

### **1. Scores no disponibles automáticamente:**
- The Odds API no proporciona scores directamente
- Solución actual: Marca eventos como FINISHED si tienen >3 horas desde inicio
- **Mejora futura:** Integrar API-Football para obtener scores reales

### **2. Sin scores reales:**
- Si no hay scores, `actualResult` se marca como 'VOID'
- Predicciones con 'VOID' no se pueden evaluar como correctas/incorrectas
- **Mejora futura:** Usar API-Football para obtener scores

---

## 🎯 **PRÓXIMOS PASOS**

### **1. Ejecutar Edge Function ahora:**
```bash
# Ver instrucciones arriba
```

### **2. Configurar cron job:**
- Para actualización automática cada hora

### **3. Integrar API-Football (Opcional):**
- Para obtener scores reales de eventos
- Mejorar precisión de evaluación de predicciones

---

## ✅ **RESULTADO ESPERADO**

Después de ejecutar el Edge Function:

1. ✅ Eventos con `startTime < ahora` → `status = FINISHED`
2. ✅ Predicciones actualizadas con:
   - `actualResult`: 'WON', 'LOST', o 'VOID'
   - `wasCorrect`: true/false
   - `accuracy`: 0.0 - 1.0
3. ✅ Función `get_predictions_for_training` retorna datos reales
4. ✅ AutoML puede entrenar con datos reales

---

## 📝 **NOTAS**

- El Edge Function procesa hasta 100 eventos por ejecución
- Se ejecuta sobre eventos de las últimas 24 horas
- No afecta eventos CANCELLED
- Es idempotente (puede ejecutarse múltiples veces)

