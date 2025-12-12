# 🚀 Plan Completo de Migración a Supabase para Producción

## 📊 Estado Actual de Migración

### ✅ Ya Migrado a Supabase Edge Functions

1. **External Bets** ✅
   - POST, GET, PUT, DELETE
   - GET /stats
   - **Estado:** Funcionando en producción

2. **User Statistics** ✅
   - GET con diferentes períodos
   - **Estado:** Funcionando en producción

3. **User Profile** ✅
   - GET, PUT
   - **Estado:** Funcionando en producción

4. **The Odds API** ✅
   - Proxy para The Odds API
   - **Estado:** Funcionando en producción

5. **Events** ✅ (Parcial)
   - get-events Edge Function existe
   - **Estado:** Funcionando pero puede mejorarse

6. **Predictions** ✅ (Parcial)
   - get-predictions Edge Function existe
   - generate-predictions Edge Function existe
   - **Estado:** Funcionando pero puede mejorarse

---

## ❌ Servicios que AÚN usan Backend Tradicional

### 🔴 CRÍTICOS (Necesarios para Producción)

1. **Value Bet Alerts** ❌
   - `GET /value-bet-alerts/my-alerts`
   - `GET /value-bet-alerts/:id`
   - `PATCH /value-bet-alerts/:id/click`
   - `PATCH /value-bet-alerts/:id/bet-placed`
   - **Impacto:** Alertas no funcionan en producción
   - **Prioridad:** ALTA

2. **ROI Tracking** ❌
   - `GET /roi-tracking`
   - `GET /roi-tracking/history`
   - `GET /roi-tracking/top-value-bets`
   - **Impacto:** Tracking de ROI no funciona en producción
   - **Prioridad:** ALTA

3. **Notifications** ❌
   - `GET /notifications`
   - `PATCH /notifications/:id/read`
   - `PATCH /notifications/read-all`
   - `DELETE /notifications/:id`
   - **Impacto:** Notificaciones no funcionan en producción
   - **Prioridad:** MEDIA

4. **Predictions Service** ⚠️ (Parcial)
   - Algunos endpoints usan Edge Functions
   - Otros aún usan backend tradicional
   - **Impacto:** Funcionalidad parcial
   - **Prioridad:** MEDIA

5. **Events Service** ⚠️ (Parcial)
   - `getLiveEvents` usa Edge Function
   - `getUpcomingEvents` usa Edge Function
   - `syncEvents` aún usa backend tradicional
   - **Impacto:** Sincronización no funciona
   - **Prioridad:** MEDIA

### 🟡 IMPORTANTES (Mejoran funcionalidad)

6. **Arbitrage** ❌
   - `GET /arbitrage/opportunities`
   - **Impacto:** Detección de arbitraje no funciona
   - **Prioridad:** BAJA

7. **Odds Comparison** ❌
   - `GET /odds/comparison`
   - `GET /odds/history`
   - **Impacto:** Comparación de cuotas limitada
   - **Prioridad:** MEDIA

8. **Value Bet Detection** ❌
   - `POST /value-bet-detection/analyze`
   - **Impacto:** Detección manual no funciona
   - **Prioridad:** BAJA

9. **Value Bet Analytics** ❌
   - `GET /value-bet-analytics`
   - **Impacto:** Analytics no disponibles
   - **Prioridad:** BAJA

10. **Payments** ❌
    - `POST /payments/create-checkout`
    - `GET /payments/success`
    - **Impacto:** Pagos no funcionan
    - **Prioridad:** ALTA (si hay pagos)

11. **Referrals** ❌
    - `GET /referrals/stats`
    - `POST /referrals/generate-link`
    - **Impacto:** Sistema de referidos no funciona
    - **Prioridad:** BAJA

12. **2FA** ❌
    - `POST /2fa/enable`
    - `POST /2fa/verify`
    - **Impacto:** Autenticación 2FA no funciona
    - **Prioridad:** MEDIA

---

## 🎯 Plan de Migración Prioritario

### Fase 1: CRÍTICOS (Semana 1) 🔴

#### 1. Value Bet Alerts → Supabase Edge Function
**Archivo:** `supabase/functions/value-bet-alerts/index.ts`

**Endpoints a migrar:**
- `GET /value-bet-alerts/my-alerts`
- `GET /value-bet-alerts/:id`
- `PATCH /value-bet-alerts/:id/click`
- `PATCH /value-bet-alerts/:id/bet-placed`

**Frontend:** Actualizar `valueBetAlertsService.ts` para usar Edge Function en producción

**Esfuerzo:** 1 día

---

#### 2. ROI Tracking → Supabase Edge Function
**Archivo:** `supabase/functions/roi-tracking/index.ts`

**Endpoints a migrar:**
- `GET /roi-tracking`
- `GET /roi-tracking/history`
- `GET /roi-tracking/top-value-bets`

**Frontend:** Actualizar `roiTrackingService.ts` para usar Edge Function en producción

**Esfuerzo:** 1 día

---

#### 3. Notifications → Supabase Edge Function
**Archivo:** `supabase/functions/notifications/index.ts`

**Endpoints a migrar:**
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`

**Frontend:** Actualizar `notificationsService.ts` para usar Edge Function en producción

**Esfuerzo:** 1 día

---

### Fase 2: IMPORTANTES (Semana 2) 🟡

#### 4. Completar Events Service
- Migrar `syncEvents` a Edge Function o usar Supabase Cron
- Mejorar `get-events` Edge Function existente

**Esfuerzo:** 1 día

---

#### 5. Completar Predictions Service
- Migrar todos los endpoints restantes
- Mejorar `get-predictions` Edge Function existente

**Esfuerzo:** 1 día

---

#### 6. Odds Comparison → Supabase Edge Function
**Archivo:** `supabase/functions/odds-comparison/index.ts`

**Endpoints a migrar:**
- `GET /odds/comparison`
- `GET /odds/history`

**Esfuerzo:** 1 día

---

### Fase 3: OPCIONALES (Semana 3) 🟢

#### 7. Payments → Supabase Edge Function
- Solo si hay sistema de pagos activo
- Integrar con Stripe

**Esfuerzo:** 2 días

---

#### 8. Otros servicios
- Arbitrage
- Value Bet Detection
- Value Bet Analytics
- Referrals
- 2FA

**Esfuerzo:** 2-3 días

---

## 🔧 WebSocket / Real-time

### Estado Actual
- Backend usa Socket.IO
- Frontend tiene `useWebSocket` hook

### Migración a Supabase Realtime
**Necesario:**
1. Configurar Supabase Realtime en PostgreSQL
2. Crear triggers para emitir eventos
3. Actualizar frontend para usar Supabase Realtime
4. Migrar canales:
   - `events:live` → Supabase Realtime subscription
   - `value-bets:userId` → Supabase Realtime subscription
   - `notifications:userId` → Supabase Realtime subscription
   - `odds:eventId` → Supabase Realtime subscription

**Esfuerzo:** 2-3 días

---

## ⏰ Scheduled Tasks (Cron Jobs)

### Tareas Actuales en Backend
1. Detección automática de value bets
2. Sincronización de eventos
3. Actualización de cuotas
4. Generación de predicciones
5. Limpieza de datos antiguos

### Migración a Supabase Cron (pg_cron)
**Necesario:**
1. Configurar pg_cron en Supabase
2. Crear funciones SQL para cada tarea
3. Programar cron jobs en PostgreSQL

**Esfuerzo:** 2 días

---

## 📋 Checklist de Migración

### Fase 1: Críticos
- [ ] Crear `value-bet-alerts` Edge Function
- [ ] Actualizar `valueBetAlertsService.ts`
- [ ] Crear `roi-tracking` Edge Function
- [ ] Actualizar `roiTrackingService.ts`
- [ ] Crear `notifications` Edge Function
- [ ] Actualizar `notificationsService.ts`
- [ ] Desplegar funciones a Supabase
- [ ] Probar en producción

### Fase 2: Importantes
- [ ] Completar `events` Edge Function
- [ ] Completar `predictions` Edge Function
- [ ] Crear `odds-comparison` Edge Function
- [ ] Actualizar servicios frontend
- [ ] Desplegar y probar

### Fase 3: WebSocket
- [ ] Configurar Supabase Realtime
- [ ] Crear triggers en PostgreSQL
- [ ] Actualizar frontend para usar Realtime
- [ ] Migrar todos los canales
- [ ] Probar en producción

### Fase 4: Cron Jobs
- [ ] Configurar pg_cron
- [ ] Crear funciones SQL
- [ ] Programar cron jobs
- [ ] Probar ejecución

---

## 🚨 Dependencias del Backend Actual

### ⚠️ Lo que NO se puede migrar fácilmente

1. **Socket.IO Server**
   - Necesita servidor persistente
   - **Solución:** Migrar a Supabase Realtime

2. **Redis Cache**
   - No disponible en Edge Functions
   - **Solución:** Usar Supabase Database o Edge Config

3. **Scheduled Tasks**
   - No hay cron en Edge Functions
   - **Solución:** Usar Supabase Cron (pg_cron)

4. **Integraciones complejas**
   - Algunas APIs externas pueden requerir procesamiento largo
   - **Solución:** Dividir en funciones más pequeñas

---

## ✅ Servicios que NO necesitan migración

Estos ya funcionan bien o no son críticos:
- Auth (usa Supabase Auth directamente)
- User Preferences (puede migrarse después)
- Platform Metrics (no crítico)
- Risk Management (no crítico)
- Responsible Gaming (no crítico)

---

## 🎯 Prioridad de Migración

### 🔴 URGENTE (Bloquea producción)
1. Value Bet Alerts
2. ROI Tracking
3. Notifications

### 🟡 IMPORTANTE (Mejora funcionalidad)
4. Events (completar)
5. Predictions (completar)
6. Odds Comparison

### 🟢 OPCIONAL (Mejoras futuras)
7. WebSocket → Supabase Realtime
8. Cron Jobs → Supabase Cron
9. Payments
10. Otros servicios

---

## 📝 Notas Importantes

1. **Tests sin Mocks:**
   - Los tests de integración deben usar servicios reales
   - Solo mockear en tests unitarios
   - Para tests E2E, usar Supabase local o staging

2. **Variables de Entorno:**
   - Todas las Edge Functions necesitan secrets configurados
   - Verificar en Supabase Dashboard → Settings → Secrets

3. **Deploy:**
   - Usar Supabase CLI para deploy
   - Verificar logs después de cada deploy
   - Probar en staging antes de producción
