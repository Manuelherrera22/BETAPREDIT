# 🎯 Mejoras en Alertas y Eventos con The Odds API

## ✅ **Implementado**

### **1. Sincronización Automática de Eventos**
- ✅ Los eventos ahora se sincronizan automáticamente desde The Odds API
- ✅ El servicio `eventsService.getUpcomingEvents()` ahora usa The Odds API por defecto
- ✅ Los eventos se guardan en Supabase para acceso rápido
- ✅ Fallback a base de datos si The Odds API no está disponible

**Archivos modificados:**
- `backend/src/services/events.service.ts` - Agregado soporte para The Odds API
- `backend/src/api/controllers/events.controller.ts` - Agregado parámetro `useTheOddsAPI`
- `frontend/src/services/eventsService.ts` - Agregado parámetro `useTheOddsAPI`
- `frontend/src/pages/Events.tsx` - Actualizado para usar The Odds API

---

### **2. Detección Automática de Value Bets**
- ✅ Nuevo servicio `valueBetDetectionService` que detecta value bets automáticamente
- ✅ Compara probabilidades implícitas de las cuotas con probabilidades predichas
- ✅ Calcula el valor esperado (EV) y porcentaje de valor
- ✅ Opción para crear alertas automáticamente cuando se detectan value bets

**Nuevos archivos:**
- `backend/src/services/value-bet-detection.service.ts` - Servicio de detección
- `backend/src/api/controllers/value-bet-detection.controller.ts` - Controlador
- `backend/src/api/routes/value-bet-detection.routes.ts` - Rutas
- `frontend/src/services/valueBetDetectionService.ts` - Servicio frontend

**Endpoints:**
- `GET /api/value-bet-detection/sport/:sport` - Detectar value bets para un deporte
- `GET /api/value-bet-detection/scan-all` - Escanear todos los deportes

**Parámetros:**
- `minValue` - Valor mínimo requerido (default: 0.05 = 5%)
- `maxEvents` - Máximo de eventos a revisar (default: 20)
- `autoCreateAlerts` - Crear alertas automáticamente (default: false)

---

### **3. Mejoras en Visualización de Eventos**
- ✅ Los eventos ahora muestran datos reales de The Odds API
- ✅ Frecuencia de actualización reducida a 5 minutos (para ahorrar API calls)
- ✅ Mejor manejo de errores con fallback a base de datos

---

## 🔄 **Cómo Funciona**

### **Detección de Value Bets:**

1. **Obtiene eventos** de The Odds API para un deporte específico
2. **Compara cuotas** de todos los bookmakers para cada evento
3. **Calcula probabilidades implícitas** desde las cuotas
4. **Calcula probabilidad predicha** usando el promedio de todas las cuotas (con ajuste del 5%)
5. **Calcula el valor**: `value = (predicted_prob * odds) - 1`
6. **Filtra value bets** con valor >= `minValue`
7. **Opcionalmente crea alertas** en la base de datos

### **Sincronización de Eventos:**

1. Cuando se llama a `getUpcomingEvents()` con `useTheOddsAPI=true`:
   - Obtiene eventos de The Odds API
   - Sincroniza eventos a Supabase usando `eventSyncService`
   - Retorna eventos desde la base de datos (ya sincronizados)

---

## 📊 **Uso**

### **Desde el Frontend:**

```typescript
import { valueBetDetectionService } from '../services/valueBetDetectionService';

// Detectar value bets para un deporte
const valueBets = await valueBetDetectionService.detectForSport('soccer_epl', {
  minValue: 0.05, // 5% mínimo
  maxEvents: 20,
  autoCreateAlerts: true, // Crear alertas automáticamente
});

// Escanear todos los deportes
const allValueBets = await valueBetDetectionService.scanAll({
  minValue: 0.10, // 10% mínimo
  maxEvents: 10,
});
```

### **Desde el Backend:**

```typescript
import { valueBetDetectionService } from './services/value-bet-detection.service';

// Detectar value bets
const valueBets = await valueBetDetectionService.detectValueBetsForSport({
  sport: 'soccer_epl',
  minValue: 0.05,
  maxEvents: 20,
  autoCreateAlerts: true,
});
```

---

## 🎯 **Próximos Pasos Sugeridos**

1. **Programar escaneo automático** - Usar un cron job para escanear value bets cada X minutos
2. **Mejorar modelo de predicción** - Integrar ML models reales en lugar del promedio simple
3. **Notificaciones push** - Enviar notificaciones cuando se detectan value bets de alto valor
4. **Filtros personalizados** - Permitir a usuarios configurar sus propios filtros de value bets
5. **Historial de value bets** - Guardar historial de value bets detectados para análisis

---

**Fecha de implementación:** 2025-12-09




