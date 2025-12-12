# 🚀 Plan Completo de Migración a Supabase - Producción

## 📊 Estado Actual de Migración

### ✅ Ya Migrado a Supabase Edge Functions

1. **External Bets** ✅
   - Edge Function: `supabase/functions/external-bets/index.ts`
   - Frontend: Usa Edge Function en producción
   - Estado: ✅ Funcional en producción

2. **User Statistics** ✅
   - Edge Function: `supabase/functions/user-statistics/index.ts`
   - Frontend: Usa Edge Function en producción
   - Estado: ✅ Funcional en producción

3. **User Profile** ✅
   - Edge Function: `supabase/functions/user-profile/index.ts`
   - Frontend: Usa Edge Function en producción
   - Estado: ✅ Funcional en producción

4. **The Odds API** ✅
   - Edge Function: `supabase/functions/the-odds-api/index.ts`
   - Frontend: Usa Edge Function en producción
   - Estado: ✅ Funcional en producción

5. **Events (Get Events)** ✅
   - Edge Function: `supabase/functions/get-events/index.ts`
   - Frontend: `eventsService.ts` usa Edge Function en producción
   - Estado: ✅ Funcional en producción

6. **Sync Events** ✅
   - Edge Function: `supabase/functions/sync-events/index.ts`
   - Estado: ✅ Funcional

7. **Generate Predictions** ✅
   - Edge Function: `supabase/functions/generate-predictions/index.ts`
   - Estado: ✅ Funcional

8. **Get Predictions** ✅
   - Edge Function: `supabase/functions/get-predictions/index.ts`
   - Estado: ✅ Funcional

---

## ✅ Migrado a Supabase Edge Functions (COMPLETADO)

1. **Value Bet Alerts** ✅
   - **Edge Function:** `supabase/functions/value-bet-alerts/index.ts`
   - **Frontend Service:** `valueBetAlertsService.ts` → Usa Edge Function en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/value-bet-alerts`

2. **Notifications** ✅
   - **Edge Function:** `supabase/functions/notifications/index.ts`
   - **Frontend Service:** `notificationsService.ts` → Usa Edge Function en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/notifications`

3. **ROI Tracking** ✅
   - **Edge Function:** `supabase/functions/roi-tracking/index.ts`
   - **Frontend Service:** `roiTrackingService.ts` → Usa Edge Function en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/roi-tracking`

4. **Value Bet Detection** ✅
   - **Edge Function:** `supabase/functions/value-bet-detection/index.ts`
   - **Frontend Service:** `valueBetDetectionService.ts` → Usa Edge Function en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/value-bet-detection`

5. **Arbitrage** ✅
   - **Edge Function:** `supabase/functions/arbitrage/index.ts`
   - **Frontend Service:** `arbitrageService.ts` → Usa Edge Function en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/arbitrage`

---

## ❌ Pendiente de Migrar a Supabase Edge Functions

### 🟡 IMPORTANTE - Servicios que AÚN usan Backend Local

1. **Value Bet Analytics** ✅
   - **Edge Function:** `supabase/functions/value-bet-analytics/index.ts`
   - **Frontend Service:** `valueBetAnalyticsService.ts` → Usa Edge Function en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/value-bet-analytics`

6. **Predictions** ✅
   - **Edge Functions:** 
     - `supabase/functions/get-predictions/index.ts` (GET event predictions)
     - `supabase/functions/generate-predictions/index.ts` (POST generate)
     - `supabase/functions/predictions/index.ts` (otros endpoints)
   - **Frontend Service:** `predictionsService.ts` → Usa Edge Functions en producción
   - **Estado:** ✅ Migrado y desplegado
   - **URLs:** 
     - `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/get-predictions`
     - `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/generate-predictions`
     - `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/predictions`

8. **Payments** ❌
   - **Backend Route:** `/api/payments/*`
   - **Frontend Service:** `paymentsService.ts` → Usa `api.get/post`
   - **Estado:** ❌ Usa backend local
   - **Acción:** Crear Edge Function `payments` (Stripe)

9. **Referrals** ❌
   - **Backend Route:** `/api/referrals/*`
   - **Frontend Service:** `referralService.ts` → Usa `api.get/post`
   - **Estado:** ❌ Usa backend local
   - **Acción:** Crear Edge Function `referrals`

10. **User Preferences** ❌
    - **Backend Route:** `/api/user-preferences/*`
    - **Frontend Service:** `userPreferencesService.ts` → Usa `api.get/post/put`
    - **Estado:** ❌ Usa backend local
    - **Acción:** Crear Edge Function `user-preferences`

11. **Platform Metrics** ❌
    - **Backend Route:** `/api/platform-metrics/*`
    - **Frontend Service:** `platformMetricsService.ts` → Usa `api.get`
    - **Estado:** ❌ Usa backend local
    - **Acción:** Crear Edge Function `platform-metrics`

12. **2FA** ❌
    - **Backend Route:** `/api/2fa/*`
    - **Frontend Service:** `2faService.ts` → Usa `api.get/post`
    - **Estado:** ❌ Usa backend local
    - **Acción:** Crear Edge Function `2fa`

13. **Odds Comparison** ❌
    - **Backend Route:** `/api/odds/*`
    - **Frontend Service:** `theOddsApiService.ts` → Usa Edge Function para The Odds API, pero comparación usa backend
    - **Estado:** ⚠️ Parcialmente migrado
    - **Acción:** Migrar comparación de cuotas a Edge Function

14. **WebSocket** ❌
    - **Backend:** Socket.IO en backend local
    - **Estado:** ❌ No funciona en producción sin backend
    - **Acción:** Migrar a Supabase Realtime

---

## 🎯 Plan de Migración por Prioridad

### Fase 1: CRÍTICO - Funcionalidades Core (PRIORIDAD ALTA) ✅ COMPLETADO

#### 1. Value Bet Alerts ✅ **COMPLETADO**
**Estado:** ✅ Migrado y desplegado

**Tareas completadas:**
- [x] Crear `supabase/functions/value-bet-alerts/index.ts`
- [x] Migrar endpoints:
  - GET `/value-bet-alerts/my-alerts`
  - GET `/value-bet-alerts/stats`
  - POST `/value-bet-alerts/:id/click`
  - POST `/value-bet-alerts/:id/taken`
- [x] Actualizar `frontend/src/services/valueBetAlertsService.ts` para usar Edge Function en producción
- [x] Desplegado a producción

#### 2. Notifications ✅ **COMPLETADO**
**Estado:** ✅ Migrado y desplegado

**Tareas completadas:**
- [x] Crear `supabase/functions/notifications/index.ts`
- [x] Migrar endpoints:
  - GET `/notifications`
  - GET `/notifications/unread-count`
  - POST `/notifications/:id/read`
  - POST `/notifications/:id/click`
  - POST `/notifications/read-all`
  - DELETE `/notifications/:id`
- [x] Actualizar `frontend/src/services/notificationsService.ts`
- [x] Desplegado a producción

---

### Fase 2: IMPORTANTE - Funcionalidades de Tracking (PRIORIDAD ALTA) ✅ COMPLETADO

#### 3. ROI Tracking ✅ **COMPLETADO**
**Estado:** ✅ Migrado y desplegado

**Tareas completadas:**
- [x] Crear `supabase/functions/roi-tracking/index.ts`
- [x] Migrar endpoints:
  - GET `/roi-tracking`
  - GET `/roi-tracking/history`
  - GET `/roi-tracking/top-value-bets`
- [x] Actualizar `frontend/src/services/roiTrackingService.ts`
- [x] Desplegado a producción

#### 4. Value Bet Detection ✅ **COMPLETADO**
**Estado:** ✅ Migrado y desplegado

**Tareas completadas:**
- [x] Crear `supabase/functions/value-bet-detection/index.ts`
- [x] Migrar endpoints:
  - GET `/value-bet-detection/sport/:sport`
  - GET `/value-bet-detection/scan-all`
- [x] Actualizar `frontend/src/services/valueBetDetectionService.ts`
- [x] Desplegado a producción

#### 5. Value Bet Analytics ✅ **COMPLETADO**
**Estado:** ✅ Migrado y desplegado

**Tareas completadas:**
- [x] Crear `supabase/functions/value-bet-analytics/index.ts`
- [x] Migrar endpoints:
  - GET `/value-bet-analytics`
  - GET `/value-bet-analytics/top`
  - GET `/value-bet-analytics/trends`
  - POST `/value-bet-analytics/track/:alertId`
- [x] Crear `frontend/src/services/valueBetAnalyticsService.ts`
- [x] Desplegado a producción

---

### Fase 3: Funcionalidades Secundarias (PRIORIDAD MEDIA) ✅ COMPLETADO

#### 6. Arbitrage ✅ **COMPLETADO**
**Estado:** ✅ Migrado y desplegado

**Tareas completadas:**
- [x] Crear `supabase/functions/arbitrage/index.ts`
- [x] Migrar endpoints:
  - GET `/arbitrage/opportunities`
  - GET `/arbitrage/event/:eventId`
  - POST `/arbitrage/calculate-stakes`
- [x] Actualizar `frontend/src/services/arbitrageService.ts`
- [x] Desplegado a producción

#### 8. User Preferences
**Tareas:**
- [ ] Crear `supabase/functions/user-preferences/index.ts`
- [ ] Migrar endpoints de preferencias
- [ ] Actualizar `frontend/src/services/userPreferencesService.ts`
- [ ] Probar en producción

**Tiempo estimado:** 1-2 horas

#### 9. Referrals
**Tareas:**
- [ ] Crear `supabase/functions/referrals/index.ts`
- [ ] Migrar sistema de referidos
- [ ] Actualizar `frontend/src/services/referralService.ts`
- [ ] Probar en producción

**Tiempo estimado:** 2 horas

#### 10. Platform Metrics
**Tareas:**
- [ ] Crear `supabase/functions/platform-metrics/index.ts`
- [ ] Migrar métricas de plataforma
- [ ] Actualizar `frontend/src/services/platformMetricsService.ts`
- [ ] Probar en producción

**Tiempo estimado:** 1-2 horas

---

### Fase 4: Funcionalidades de Seguridad y Pagos (PRIORIDAD MEDIA)

#### 11. 2FA
**Tareas:**
- [ ] Crear `supabase/functions/2fa/index.ts`
- [ ] Migrar autenticación de dos factores
- [ ] Actualizar `frontend/src/services/2faService.ts`
- [ ] Probar en producción

**Tiempo estimado:** 2-3 horas

#### 12. Payments (Stripe)
**Tareas:**
- [ ] Crear `supabase/functions/payments/index.ts`
- [ ] Migrar integración con Stripe
- [ ] Configurar secrets de Stripe en Supabase
- [ ] Actualizar `frontend/src/services/paymentsService.ts`
- [ ] Probar en producción

**Tiempo estimado:** 3-4 horas

---

### Fase 5: WebSocket y Tiempo Real (PRIORIDAD ALTA)

#### 13. WebSocket → Supabase Realtime ⚠️ **CRÍTICO**
**Razón:** Sin esto, no hay actualizaciones en tiempo real en producción

**Tareas:**
- [ ] Migrar de Socket.IO a Supabase Realtime
- [ ] Actualizar `frontend/src/hooks/useWebSocket.ts` para usar Supabase Realtime
- [ ] Actualizar `backend/src/services/websocket.service.ts` para emitir a Supabase Realtime
- [ ] Configurar canales de Realtime:
  - `events:live`
  - `odds:update`
  - `value-bets:${userId}`
  - `notifications:${userId}`
- [ ] Probar en producción

**Tiempo estimado:** 4-5 horas

---

## 📋 Checklist de Migración por Servicio

### Value Bet Alerts
- [ ] Crear Edge Function
- [ ] Migrar lógica de backend
- [ ] Actualizar frontend service
- [ ] Probar en desarrollo
- [ ] Desplegar a producción
- [ ] Verificar funcionamiento

### Notifications
- [ ] Crear Edge Function
- [ ] Migrar lógica de backend
- [ ] Integrar Supabase Realtime
- [ ] Actualizar frontend service
- [ ] Probar en desarrollo
- [ ] Desplegar a producción
- [ ] Verificar funcionamiento

### ROI Tracking
- [ ] Crear Edge Function
- [ ] Migrar lógica de backend
- [ ] Actualizar frontend service
- [ ] Probar en desarrollo
- [ ] Desplegar a producción
- [ ] Verificar funcionamiento

### WebSocket → Realtime
- [ ] Configurar Supabase Realtime
- [ ] Migrar canales de Socket.IO a Realtime
- [ ] Actualizar frontend hook
- [ ] Actualizar backend para emitir a Realtime
- [ ] Probar en desarrollo
- [ ] Verificar en producción

---

## 🔧 Configuración Necesaria en Supabase

### Secrets Requeridos
- [ ] `THE_ODDS_API_KEY` ✅ (ya configurado)
- [ ] `STRIPE_SECRET_KEY` (para payments)
- [ ] `STRIPE_WEBHOOK_SECRET` (para payments)
- [ ] `JWT_SECRET` (si se usa)
- [ ] Cualquier otra API key necesaria

### Database
- [ ] ✅ Ya usa Supabase PostgreSQL
- [ ] ✅ Prisma conectado a Supabase
- [ ] ✅ Migrations ejecutadas

### Realtime
- [ ] Configurar publicación en tablas necesarias:
  - `events` (para eventos en vivo)
  - `notifications` (para notificaciones)
  - `value_bet_alerts` (para alertas)
  - `external_bets` (para actualizaciones de apuestas)

---

## 🚨 Problemas Actuales en Producción

### Sin Backend Local
1. **Value Bet Alerts:** ❌ No funciona (usa backend local)
2. **Notifications:** ❌ No funciona (usa backend local)
3. **ROI Tracking:** ❌ No funciona (usa backend local)
4. **Arbitrage:** ❌ No funciona (usa backend local)
5. **WebSocket:** ❌ No funciona (Socket.IO requiere backend)

### Con Edge Functions (Funcionan)
1. **External Bets:** ✅ Funciona
2. **User Statistics:** ✅ Funciona
3. **User Profile:** ✅ Funciona
4. **The Odds API:** ✅ Funciona
5. **Events (Get):** ✅ Funciona

---

## ⏱️ Tiempo Total Estimado

- **Fase 1 (Crítico):** 7-9 horas
- **Fase 2 (Importante):** 6-7 horas
- **Fase 3 (Secundario):** 6-8 horas
- **Fase 4 (Seguridad/Pagos):** 5-7 horas
- **Fase 5 (Realtime):** 4-5 horas

**Total:** 28-36 horas de desarrollo

---

## 🎯 Prioridad de Implementación

### ✅ COMPLETADO
1. ✅ Value Bet Alerts
2. ✅ Notifications
3. ✅ ROI Tracking
4. ✅ Value Bet Detection
5. ✅ Arbitrage

### 🔴 URGENTE (Pendiente)
1. WebSocket → Supabase Realtime (CRÍTICO - Sin esto no hay actualizaciones en tiempo real)

### 🟡 IMPORTANTE (Pendiente)
2. Value Bet Analytics
3. Predictions (completar migración)

### 🟢 NORMAL (Pendiente)
4. User Preferences
5. Referrals
6. Platform Metrics
7. 2FA
8. Payments

---

## 📝 Notas Importantes

1. **No usar mocks en tests:** Todos los tests deben usar datos reales de Supabase
2. **Edge Functions deben usar Supabase Client:** No Prisma directamente
3. **Realtime es crítico:** Sin esto, no hay actualizaciones en tiempo real
4. **Variables de entorno:** Todas deben estar en Supabase Secrets
5. **Testing:** Probar cada Edge Function en producción antes de marcar como completa
