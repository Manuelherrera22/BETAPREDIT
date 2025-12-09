# 🔄 Plan de Sincronización Completa: Eventos → Predicciones → Alertas

## 🎯 **OBJETIVO**

Sincronizar completamente el flujo para que:
1. **Eventos** se sincronizan desde The Odds API → BD
2. **Predicciones** se generan automáticamente para eventos en BD
3. **Value Bets** se detectan usando predicciones y eventos de BD
4. **Alertas** se crean automáticamente cuando se detectan value bets

---

## ❌ **PROBLEMA ACTUAL**

### **1. Auto Predictions Service**
- ❌ Llama directamente a The Odds API para obtener eventos
- ❌ No usa eventos que ya están en la BD
- ❌ Duplica trabajo de sincronización

### **2. Value Bet Detection Service**
- ❌ Llama directamente a The Odds API para obtener eventos
- ❌ No usa predicciones que ya están en la BD
- ❌ Duplica trabajo de generación de predicciones

### **3. Falta de Integración**
- ❌ No hay conexión entre sincronización de eventos y generación de predicciones
- ❌ No hay conexión entre generación de predicciones y detección de value bets
- ❌ Cada servicio trabaja de forma independiente

---

## ✅ **SOLUCIÓN PROPUESTA**

### **1. Modificar Auto Predictions Service**

**Antes:**
```typescript
// Obtiene eventos desde The Odds API
const oddsEvents = await theOddsAPI.getOdds(sportKey, {...});
```

**Después:**
```typescript
// Obtiene eventos desde la BD
const events = await prisma.event.findMany({
  where: {
    status: 'SCHEDULED',
    isActive: true,
    startTime: { gte: now, lte: maxTime },
    sport: { slug: sportKey },
  },
  include: { sport: true, markets: true, odds: true },
});
```

**Ventajas:**
- ✅ Usa eventos ya sincronizados
- ✅ Reduce llamadas a The Odds API
- ✅ Más rápido (datos locales)
- ✅ Ahorra créditos de API

### **2. Modificar Value Bet Detection Service**

**Antes:**
```typescript
// Obtiene eventos desde The Odds API
const oddsEvents = await theOddsAPI.getOdds(sport, {...});
```

**Después:**
```typescript
// Obtiene eventos con predicciones desde la BD
const events = await prisma.event.findMany({
  where: {
    status: 'SCHEDULED',
    isActive: true,
    startTime: { gte: now },
    Prediction: { some: {} }, // Solo eventos con predicciones
  },
  include: {
    sport: true,
    markets: { include: { odds: true } },
    Prediction: true,
  },
});
```

**Ventajas:**
- ✅ Usa eventos y predicciones ya generadas
- ✅ Solo detecta value bets para eventos con predicciones
- ✅ Reduce llamadas a The Odds API
- ✅ Más eficiente

### **3. Integrar Flujo Completo**

**En `event-sync.service.ts`:**
```typescript
// Después de sincronizar eventos
async syncSportEvents(sportKey: string) {
  const syncedEvents = await this.syncFromTheOddsAPI(sportKey);
  
  // ⚠️ NUEVO: Generar predicciones automáticamente
  await autoPredictionsService.generatePredictionsForSyncedEvents(syncedEvents);
  
  return syncedEvents;
}
```

**En `auto-predictions.service.ts`:**
```typescript
// Después de generar predicciones
async generatePredictionsForEvent(event: Event) {
  const predictions = await this.createPredictions(event);
  
  // ⚠️ NUEVO: Detectar value bets automáticamente
  await valueBetDetectionService.detectValueBetsForEvent(event.id);
  
  return predictions;
}
```

---

## 📋 **IMPLEMENTACIÓN**

### **Paso 1: Modificar Auto Predictions Service**
- [x] Crear método `generatePredictionsForEventsFromDB()`
- [ ] Modificar `generatePredictionsForUpcomingEvents()` para usar BD
- [ ] Agregar método `generatePredictionsForSyncedEvents()`

### **Paso 2: Modificar Value Bet Detection Service**
- [ ] Crear método `detectValueBetsForEventsFromDB()`
- [ ] Modificar `detectValueBetsForSport()` para usar BD
- [ ] Agregar método `detectValueBetsForEvent()`

### **Paso 3: Integrar Flujo**
- [ ] Modificar `event-sync.service.ts` para llamar a generación de predicciones
- [ ] Modificar `auto-predictions.service.ts` para llamar a detección de value bets
- [ ] Actualizar `scheduled-tasks.service.ts` para coordinar tareas

### **Paso 4: Optimizar Llamadas a The Odds API**
- [ ] Solo llamar a The Odds API cuando:
  - Se sincronizan eventos (cada 4 horas)
  - Se actualizan cuotas para predicciones existentes (cada 5 minutos)
  - Se detectan value bets y necesitan cuotas actualizadas

---

## 🎯 **RESULTADO ESPERADO**

### **Flujo Completo:**
1. **Sincronización de Eventos** (cada 4 horas)
   - Obtiene eventos desde The Odds API
   - Guarda en BD
   - **→ Genera predicciones automáticamente**

2. **Generación de Predicciones** (cada 10 minutos)
   - Obtiene eventos desde BD
   - Genera predicciones
   - **→ Detecta value bets automáticamente**

3. **Detección de Value Bets** (cada 15 minutos)
   - Obtiene eventos con predicciones desde BD
   - Detecta value bets
   - **→ Crea alertas automáticamente**

4. **Actualización de Predicciones** (cada 5 minutos)
   - Obtiene eventos con predicciones desde BD
   - Verifica si cuotas cambiaron (llama a The Odds API solo si es necesario)
   - Actualiza predicciones si cambió >5%

---

## 💰 **AHORRO DE CRÉDITOS API**

**Antes:**
- Auto Predictions: ~100 llamadas/hora (10 deportes × 10 eventos)
- Value Bet Detection: ~60 llamadas/hora (3 deportes × 20 eventos)
- **Total: ~160 llamadas/hora**

**Después:**
- Event Sync: ~6 llamadas/hora (3 deportes cada 4 horas)
- Prediction Updates: ~10 llamadas/hora (solo si cuotas cambiaron)
- **Total: ~16 llamadas/hora**

**Ahorro: ~90% de llamadas a API** 🎉

