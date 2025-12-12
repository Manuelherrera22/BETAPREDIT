# 🚀 Plan de Migración a Supabase - BETAPREDIT

## 📋 Resumen

Este documento describe el plan progresivo para migrar todas las funcionalidades de BETAPREDIT a Supabase, asegurando que todo funcione correctamente en producción.

## ✅ Estado Actual

### Ya Migrado:
- ✅ Autenticación (Supabase Auth)
- ✅ Base de datos (Supabase PostgreSQL)
- ✅ Variables de entorno configuradas

### Pendiente de Migración:
- ⏳ Comparador de Cuotas (The Odds API)
- ⏳ Servicios de Odds
- ⏳ Arbitraje
- ⏳ Value Bet Alerts
- ⏳ Estadísticas de Usuario
- ⏳ Notificaciones
- ⏳ WebSockets

---

## 🎯 Fase 1: Verificación y Testing (ACTUAL)

### Objetivo:
Verificar que todas las APIs funcionen correctamente antes de migrar.

### Tareas:
1. ✅ Crear script de testing (`backend/scripts/test-apis.js`)
2. ⏳ Ejecutar tests y documentar resultados
3. ⏳ Identificar APIs que fallan
4. ⏳ Corregir errores críticos

### Comandos:
```bash
# Ejecutar tests
cd backend
node scripts/test-apis.js

# Con token de autenticación
TEST_USER_TOKEN=tu_token node scripts/test-apis.js
```

---

## 🎯 Fase 2: Migración de Servicios de Odds (PRIORIDAD ALTA)

### Objetivo:
Migrar el comparador de cuotas y servicios relacionados a Supabase.

### Servicios a Migrar:
1. **The Odds API Service**
   - ✅ Ya usa API externa (no requiere migración de DB)
   - ⏳ Verificar que funcione correctamente
   - ⏳ Asegurar que los datos se guarden en Supabase

2. **Odds Service** (`backend/src/services/odds.service.ts`)
   - ⏳ Migrar consultas de Prisma a Supabase
   - ⏳ Verificar que `prisma` esté usando Supabase (ya configurado)
   - ⏳ Probar todas las funciones

3. **Odds Comparison Service** (`backend/src/services/odds-comparison.service.ts`)
   - ⏳ Verificar que guarde datos en Supabase
   - ⏳ Probar `fetchAndUpdateComparison`

### Tareas:
- [ ] Verificar conexión a Supabase en `odds.service.ts`
- [ ] Probar `getEventOdds` con datos reales
- [ ] Probar `compareOddsFromAPI` end-to-end
- [ ] Verificar que los datos se guarden correctamente
- [ ] Probar frontend `OddsComparison.tsx`

### Testing:
```bash
# Test específico de odds
curl http://localhost:3000/api/the-odds-api/sports
curl http://localhost:3000/api/the-odds-api/sports/soccer_epl/odds?regions=us,uk&markets=h2h
```

---

## 🎯 Fase 3: Migración de Estadísticas (PRIORIDAD ALTA)

### Objetivo:
Asegurar que las estadísticas de usuario funcionen correctamente con Supabase.

### Servicios a Migrar:
1. **User Statistics Service** (`backend/src/services/user-statistics.service.ts`)
   - ⏳ Ya usa Prisma (que apunta a Supabase)
   - ⏳ Verificar que `calculateUserStatistics` funcione
   - ⏳ Probar endpoints `/statistics/me`, `/statistics/by-sport`, `/statistics/by-platform`

2. **External Bets Service** (`backend/src/services/external-bets.service.ts`)
   - ⏳ Verificar que las apuestas se guarden en Supabase
   - ⏳ Probar `getUserBetStats`

### Tareas:
- [ ] Verificar que `UserStatistics` se cree correctamente en Supabase
- [ ] Probar cálculo de estadísticas con datos reales
- [ ] Verificar que los endpoints retornen datos válidos
- [ ] Probar frontend `Statistics.tsx`

---

## 🎯 Fase 4: Migración de Value Bets y Arbitraje (PRIORIDAD MEDIA)

### Objetivo:
Asegurar que value bets y arbitraje funcionen con Supabase.

### Servicios a Migrar:
1. **Value Bet Alerts Service** (`backend/src/services/value-bet-alerts.service.ts`)
   - ⏳ Verificar que las alertas se guarden en Supabase
   - ⏳ Probar detección de value bets

2. **Arbitrage Service** (`backend/src/services/arbitrage/arbitrage.service.ts`)
   - ⏳ Verificar que las oportunidades se calculen correctamente
   - ⏳ Probar detección de arbitraje

### Tareas:
- [ ] Probar detección de value bets end-to-end
- [ ] Probar detección de arbitraje
- [ ] Verificar que las alertas se envíen correctamente
- [ ] Probar frontend `Arbitrage.tsx` y `Alerts.tsx`

---

## 🎯 Fase 5: Migración de Notificaciones y WebSockets (PRIORIDAD MEDIA)

### Objetivo:
Asegurar que notificaciones y WebSockets funcionen en producción.

### Servicios a Migrar:
1. **Notifications Service** (`backend/src/services/notifications.service.ts`)
   - ⏳ Verificar que las notificaciones se guarden en Supabase
   - ⏳ Probar envío de notificaciones

2. **WebSocket Service** (`backend/src/services/websocket.service.ts`)
   - ⏳ Verificar que funcione en producción
   - ⏳ Probar actualizaciones en tiempo real

### Tareas:
- [ ] Probar creación de notificaciones
- [ ] Probar WebSocket en producción
- [ ] Verificar que las actualizaciones lleguen al frontend

---

## 🎯 Fase 6: Optimización y Monitoreo (PRIORIDAD BAJA)

### Objetivo:
Optimizar el rendimiento y monitorear el sistema.

### Tareas:
- [ ] Configurar índices en Supabase
- [ ] Optimizar consultas lentas
- [ ] Configurar monitoreo (Sentry ya configurado)
- [ ] Configurar alertas de errores

---

## 📝 Checklist de Verificación

### Antes de cada fase:
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Supabase conectado y funcionando
- [ ] Prisma migrations ejecutadas

### Después de cada fase:
- [ ] Todos los tests pasan
- [ ] Frontend funciona correctamente
- [ ] No hay errores en consola
- [ ] Datos se guardan correctamente en Supabase

---

## 🔧 Comandos Útiles

### Verificar conexión a Supabase:
```bash
cd backend
node scripts/verify-supabase-connection.js
```

### Ejecutar migrations:
```bash
cd backend
npx prisma migrate dev
```

### Ver datos en Supabase:
```bash
cd backend
npx prisma studio
```

### Test de APIs:
```bash
cd backend
node scripts/test-apis.js
```

---

## 📊 Progreso

- [x] Fase 1: Verificación y Testing (50%)
- [ ] Fase 2: Migración de Servicios de Odds
- [ ] Fase 3: Migración de Estadísticas
- [ ] Fase 4: Migración de Value Bets y Arbitraje
- [ ] Fase 5: Migración de Notificaciones y WebSockets
- [ ] Fase 6: Optimización y Monitoreo

---

## 🚨 Problemas Conocidos

1. **The Odds API**: Requiere API key válida
2. **Redis**: Puede no estar disponible en producción (usar fallback)
3. **WebSockets**: Requiere configuración especial en producción

---

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [The Odds API Documentation](https://the-odds-api.com/liveapi/guides/v4/)




