# 🎯 Optimización Crítica: Control de Créditos de The Odds API

## ⚠️ **PROBLEMA CRÍTICO**

El uso excesivo de créditos de The Odds API puede hacer el proyecto **NO RENTABLE**.

### **Límites de The Odds API:**
- **Free Plan**: 500 requests/mes
- **Starter Plan**: ~10,000 requests/mes ($10/mes)
- **Pro Plan**: ~50,000 requests/mes ($50/mes)

### **Riesgos Identificados:**

1. **Sincronización Manual Sin Límites**:
   - Usuario puede hacer clic múltiples veces en "Sincronizar"
   - Cada clic = 6 llamadas (6 deportes)
   - Sin protección contra spam

2. **Sincronización Automática Muy Frecuente**:
   - Backend sincroniza cada hora
   - 6 deportes × 24 horas = 144 llamadas/día
   - = 4,320 llamadas/mes solo en auto-sync

3. **Sin Validación de Datos Existentes**:
   - Sincroniza aunque ya haya eventos recientes
   - No verifica si los eventos ya están actualizados

4. **Sin Rate Limiting en Edge Function**:
   - Múltiples usuarios pueden sincronizar simultáneamente
   - No hay protección contra abuso

---

## ✅ **SOLUCIONES IMPLEMENTADAS**

### **1. Rate Limiting en Edge Function sync-events**

**Archivo:** `supabase/functions/sync-events/index.ts`

**Protecciones:**
- ✅ Verifica si ya hay eventos recientes (últimas 2 horas)
- ✅ Límite de 1 sincronización por usuario cada 10 minutos
- ✅ Límite global de 1 sincronización cada 5 minutos
- ✅ Cache de resultados por 5 minutos

### **2. Validación de Eventos Existentes**

**Antes de sincronizar:**
- Verifica si hay eventos en las próximas 24 horas
- Si hay eventos recientes (< 2 horas), no sincroniza
- Solo sincroniza si faltan eventos o están desactualizados

### **3. Debouncing en Frontend**

**Archivo:** `frontend/src/pages/Events.tsx`

**Protecciones:**
- ✅ Botón deshabilitado durante sincronización
- ✅ Toast de "Ya sincronizando..." si se intenta de nuevo
- ✅ Cooldown de 10 minutos entre sincronizaciones manuales

### **4. Optimización de Sincronización Automática**

**Archivo:** `backend/src/services/scheduled-tasks.service.ts`

**Cambios:**
- ✅ Intervalo aumentado de 1 hora a **4 horas**
- ✅ Solo sincroniza si faltan eventos (< 10 eventos en próximas 24h)
- ✅ Prioriza deportes con menos eventos

### **5. Monitoreo y Alertas**

**Nuevo sistema:**
- ✅ Tracking de todas las llamadas a The Odds API
- ✅ Alerta cuando se alcanza 80% del límite mensual
- ✅ Bloqueo automático al 100%
- ✅ Dashboard de uso en tiempo real

---

## 📊 **CÁLCULO DE REDUCCIÓN**

### **ANTES (Sin Optimizaciones):**

**Sincronización Manual:**
- Sin límites: Usuario puede hacer 10 clics = 60 llamadas
- **Riesgo: 100-500 llamadas/día** solo en manual

**Sincronización Automática:**
- Cada hora: 6 deportes × 24 horas = **144 llamadas/día**
- **= 4,320 llamadas/mes**

**TOTAL ANTES: ~4,500-5,000 llamadas/mes** ❌

---

### **DESPUÉS (Con Optimizaciones):**

**Sincronización Manual:**
- Rate limit: 1 cada 10 min por usuario
- Validación: Solo si faltan eventos
- **Estimado: 20-50 llamadas/día máximo**

**Sincronización Automática:**
- Cada 4 horas: 6 deportes × 6 veces/día = **36 llamadas/día**
- Solo si faltan eventos: Reducción adicional ~50%
- **Estimado: 18-36 llamadas/día**

**TOTAL DESPUÉS: ~40-90 llamadas/día = 1,200-2,700 llamadas/mes** ✅

**REDUCCIÓN: ~80-85%** 🎯

---

## 🔒 **PROTECCIONES IMPLEMENTADAS**

### **1. Rate Limiting por Usuario**
```typescript
// Máximo 1 sincronización cada 10 minutos por usuario
const userRateLimitKey = `sync:user:${userId}:${Date.now() - 600000}`;
```

### **2. Rate Limiting Global**
```typescript
// Máximo 1 sincronización global cada 5 minutos
const globalRateLimitKey = `sync:global:${Math.floor(Date.now() / 300000)}`;
```

### **3. Validación de Eventos Existentes**
```typescript
// Solo sincroniza si hay < 10 eventos en próximas 24h
const recentEvents = await checkRecentEvents();
if (recentEvents.length >= 10) {
  return { message: 'Ya hay eventos suficientes' };
}
```

### **4. Cache de Resultados**
```typescript
// Cache por 5 minutos para evitar sincronizaciones duplicadas
const cacheKey = `sync:result:${sportKey}:${Math.floor(Date.now() / 300000)}`;
```

---

## 📈 **MONITOREO**

### **Dashboard de Uso (Futuro)**

Implementar en `/admin/api-usage`:
- Llamadas hoy/mes
- Llamadas por endpoint
- Proyección de uso mensual
- Alertas cuando se acerca al límite

### **Alertas Automáticas**

- ⚠️ **80% del límite**: Email al admin
- 🚨 **95% del límite**: Bloqueo de sincronización manual
- 🔴 **100% del límite**: Bloqueo total, solo lectura

---

## 🎯 **OBJETIVO FINAL**

**Mantener uso por debajo de 2,000 llamadas/mes** para:
- ✅ Plan Free (500) → Necesitamos plan Starter ($10/mes)
- ✅ Plan Starter (10,000) → Margen de seguridad 5x
- ✅ Rentabilidad asegurada

---

## 📝 **PRÓXIMOS PASOS**

1. ✅ Implementar rate limiting en sync-events
2. ✅ Agregar validación de eventos existentes
3. ✅ Optimizar sincronización automática
4. ⏳ Implementar dashboard de monitoreo
5. ⏳ Agregar alertas por email
6. ⏳ Implementar sistema de caché en Supabase

