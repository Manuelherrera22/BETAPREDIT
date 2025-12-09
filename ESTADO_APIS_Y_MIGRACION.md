# 📊 Estado de APIs y Plan de Migración a Supabase

## ✅ Estado Actual

### Ya Migrado a Supabase:
- ✅ **Autenticación**: Supabase Auth funcionando
- ✅ **Base de Datos**: Prisma configurado para usar Supabase PostgreSQL
- ✅ **Variables de Entorno**: Configuradas en `.env`

### Configuración de Prisma:
- ✅ Prisma detecta automáticamente `DATABASE_URL` de Supabase
- ✅ Si `DATABASE_URL` está configurado, usa Supabase
- ⚠️ Si no está configurado, usa mock (limitado)

---

## 🔍 APIs a Verificar

### 1. The Odds API (Comparador de Cuotas) - **PRIORIDAD ALTA**
**Estado**: ⚠️ Requiere verificación

**Endpoints**:
- `GET /api/the-odds-api/sports` - Lista de deportes
- `GET /api/the-odds-api/sports/:sport/odds` - Cuotas de eventos
- `GET /api/the-odds-api/sports/:sport/events/:eventId/compare` - Comparar cuotas

**Dependencias**:
- ✅ API externa (The Odds API) - No requiere Supabase
- ⏳ Guarda datos en Supabase vía `oddsComparisonService`

**Problemas Potenciales**:
- Si `THE_ODDS_API_KEY` no está configurado → Error 503
- Si Prisma no está conectado a Supabase → No guarda comparaciones

**Solución**:
1. Verificar que `THE_ODDS_API_KEY` esté en `.env`
2. Verificar que `DATABASE_URL` esté configurado
3. Probar endpoints con script de test

---

### 2. Odds Service - **PRIORIDAD ALTA**
**Estado**: ⚠️ Requiere verificación

**Endpoints**:
- `GET /api/odds/event/:eventId` - Cuotas de un evento
- `POST /api/odds/events` - Cuotas de múltiples eventos
- `GET /api/odds/live/:eventId` - Cuotas en vivo
- `GET /api/odds/history/:eventId` - Historial de cuotas

**Dependencias**:
- ⏳ Prisma (Supabase) para guardar/leer cuotas
- ⏳ Redis para caché (opcional, tiene fallback)

**Problemas Potenciales**:
- Si Prisma no está conectado → Retorna arrays vacíos
- Si no hay datos en Supabase → No hay cuotas para mostrar

**Solución**:
1. Verificar conexión a Supabase
2. Probar que `prisma.odds.findMany()` funcione
3. Verificar que los datos se guarden correctamente

---

### 3. Arbitrage Service - **PRIORIDAD MEDIA**
**Estado**: ⏳ Pendiente de verificación

**Endpoints**:
- `GET /api/arbitrage/opportunities` - Oportunidades de arbitraje
- `POST /api/arbitrage/detect/:eventId` - Detectar arbitraje
- `POST /api/arbitrage/calculate-stakes` - Calcular stakes

**Dependencias**:
- ⏳ The Odds API para comparar cuotas
- ⏳ Prisma (Supabase) para guardar oportunidades

**Problemas Potenciales**:
- Si The Odds API no funciona → No detecta arbitraje
- Si Prisma no está conectado → No guarda oportunidades

---

### 4. User Statistics - **PRIORIDAD ALTA**
**Estado**: ✅ Ya corregido (retorna datos por defecto)

**Endpoints**:
- `GET /api/statistics/me` - Estadísticas del usuario
- `GET /api/statistics/by-sport` - Estadísticas por deporte
- `GET /api/statistics/by-platform` - Estadísticas por plataforma

**Dependencias**:
- ⏳ Prisma (Supabase) para leer `ExternalBet` y `UserStatistics`

**Estado Actual**:
- ✅ Ya retorna datos por defecto si hay error
- ⏳ Necesita datos reales en Supabase para funcionar completamente

---

### 5. Value Bet Alerts - **PRIORIDAD MEDIA**
**Estado**: ⏳ Pendiente de verificación

**Endpoints**:
- `GET /api/value-bet-alerts/my-alerts` - Alertas del usuario
- `POST /api/value-bet-alerts` - Crear alerta

**Dependencias**:
- ⏳ Prisma (Supabase) para guardar alertas
- ⏳ The Odds API para detectar value bets

---

## 🚀 Plan de Acción Progresivo

### Fase 1: Verificación Inmediata (AHORA)

#### 1.1 Verificar Variables de Entorno
```bash
# Verificar que estas variables estén en backend/.env:
- DATABASE_URL (Supabase PostgreSQL)
- THE_ODDS_API_KEY (The Odds API)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY
```

#### 1.2 Ejecutar Tests
```bash
cd backend
npm run test:apis
```

#### 1.3 Verificar Conexión a Supabase
```bash
cd backend
npm run verify-db
```

---

### Fase 2: Corregir Comparador de Cuotas (PRIORIDAD ALTA)

#### 2.1 Verificar The Odds API
- [ ] Verificar que `THE_ODDS_API_KEY` esté configurado
- [ ] Probar endpoint `/api/the-odds-api/sports`
- [ ] Probar endpoint `/api/the-odds-api/sports/soccer_epl/odds`

#### 2.2 Verificar Guardado en Supabase
- [ ] Verificar que `oddsComparisonService.fetchAndUpdateComparison` guarde datos
- [ ] Verificar que Prisma esté conectado a Supabase
- [ ] Probar que los datos se guarden en tabla `OddsComparison`

#### 2.3 Probar Frontend
- [ ] Abrir página `/odds-comparison`
- [ ] Seleccionar deporte
- [ ] Seleccionar evento
- [ ] Verificar que se muestren las cuotas

---

### Fase 3: Corregir Servicios de Odds (PRIORIDAD ALTA)

#### 3.1 Verificar Prisma
- [ ] Verificar que `prisma.odds.findMany()` funcione
- [ ] Verificar que `prisma.odds.create()` funcione
- [ ] Verificar que los datos se guarden correctamente

#### 3.2 Actualizar Mock de Prisma (si es necesario)
- [ ] Agregar modelos faltantes al mock (`externalBet`, `oddsComparison`, etc.)
- [ ] Asegurar que el mock retorne datos válidos

#### 3.3 Probar Endpoints
- [ ] Probar `GET /api/odds/event/:eventId`
- [ ] Probar `GET /api/odds/history/:eventId`

---

### Fase 4: Migrar Arbitraje y Value Bets (PRIORIDAD MEDIA)

#### 4.1 Verificar Arbitraje
- [ ] Probar detección de arbitraje
- [ ] Verificar que se guarden oportunidades
- [ ] Probar frontend `/arbitrage`

#### 4.2 Verificar Value Bets
- [ ] Probar detección de value bets
- [ ] Verificar que se creen alertas
- [ ] Probar frontend `/alerts`

---

## 🔧 Comandos Útiles

### Verificar Conexión a Supabase:
```bash
cd backend
node scripts/verify-supabase-connection.js
```

### Ejecutar Tests de APIs:
```bash
cd backend
npm run test:apis
```

### Ver Datos en Supabase:
```bash
cd backend
npx prisma studio
```

### Verificar Variables de Entorno:
```bash
cd backend
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'); console.log('THE_ODDS_API_KEY:', process.env.THE_ODDS_API_KEY ? '✅ Set' : '❌ Missing');"
```

---

## 📝 Checklist de Verificación

### Antes de Continuar:
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] `DATABASE_URL` configurado en `backend/.env`
- [ ] `THE_ODDS_API_KEY` configurado en `backend/.env`
- [ ] Prisma migrations ejecutadas (`npx prisma migrate dev`)

### Después de Cada Fase:
- [ ] Tests pasan
- [ ] Frontend funciona
- [ ] No hay errores en consola
- [ ] Datos se guardan en Supabase

---

## 🚨 Problemas Conocidos

1. **Mock de Prisma Limitado**: El mock no incluye todos los modelos necesarios
   - **Solución**: Asegurar que `DATABASE_URL` esté configurado para usar Supabase real

2. **The Odds API Key**: Requiere API key válida
   - **Solución**: Obtener key de https://the-odds-api.com

3. **Redis**: Puede no estar disponible (tiene fallback in-memory)
   - **Solución**: Ya implementado, funciona sin Redis

---

## 📊 Progreso

- [x] Fase 1: Verificación Inmediata (50%)
- [ ] Fase 2: Corregir Comparador de Cuotas
- [ ] Fase 3: Corregir Servicios de Odds
- [ ] Fase 4: Migrar Arbitraje y Value Bets

---

## 📚 Próximos Pasos

1. **Ejecutar tests** para identificar qué APIs fallan
2. **Verificar variables de entorno** en `backend/.env`
3. **Corregir APIs que fallen** una por una
4. **Probar frontend** después de cada corrección

