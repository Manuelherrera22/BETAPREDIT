# 🎯 Plan: Tracking Automático de ROI Real

**Objetivo:** Implementar sistema que muestre el ROI real de los usuarios basado en apuestas registradas y resueltas.

---

## 📊 **PROBLEMA ACTUAL**

- ❌ Los usuarios no ven "cuánto gané gracias a BETAPREDIT"
- ❌ No hay tracking automático de resultados
- ❌ No se puede calcular ROI real de value bets encontrados
- ❌ No hay comparación: "Sin BETAPREDIT vs Con BETAPREDIT"

---

## ✅ **SOLUCIÓN PROPUESTA**

### **1. Sistema de Tracking Automático**

#### **Flujo:**
1. Usuario registra apuesta externa → `ExternalBet` creado con `status: PENDING`
2. Usuario marca apuesta como resuelta → `status: WON/LOST/VOID`
3. Sistema calcula ROI automáticamente
4. Dashboard muestra: "ROI desde que usas BETAPREDIT: +X%"

#### **Componentes Necesarios:**

**A) Servicio de Tracking de ROI**
- `roi-tracking.service.ts`
- Calcula ROI basado en apuestas resueltas
- Separa apuestas normales vs value bets
- Calcula ROI antes/después de usar BETAPREDIT

**B) Endpoint para Resolver Apuestas**
- `PUT /api/external-bets/:id/resolve`
- Permite marcar apuesta como WON/LOST/VOID
- Calcula ganancia/pérdida automáticamente
- Actualiza estadísticas del usuario

**C) Dashboard de ROI**
- Componente `ROITrackingDashboard.tsx`
- Muestra:
  - ROI total desde que usa BETAPREDIT
  - ROI de value bets específicamente
  - Comparación: "Sin BETAPREDIT: -5% | Con BETAPREDIT: +18%"
  - Historial de apuestas con ROI individual

**D) Sincronización Automática (Futuro)**
- Integración con APIs de casas de apuestas
- OCR de screenshots para detectar resultados
- Bot de Telegram/WhatsApp para resolver apuestas rápido

---

## 🎯 **IMPLEMENTACIÓN**

### **Fase 1: Tracking Básico (2-3 días)**

#### **1.1. Actualizar ExternalBet Service**
- Agregar método `resolveBet(betId, result, actualWin?)`
- Calcular ganancia/pérdida automáticamente
- Actualizar estadísticas del usuario

#### **1.2. Crear ROI Tracking Service**
- `calculateUserROI(userId, period?)`
- `calculateValueBetsROI(userId, period?)`
- `getROIComparison(userId)` - Antes vs Después

#### **1.3. Endpoint para Resolver Apuestas**
- `PUT /api/external-bets/:id/resolve`
- Body: `{ result: 'WON' | 'LOST' | 'VOID', actualWin?: number }`
- Actualiza bet y recalcula estadísticas

#### **1.4. Frontend: Resolver Apuestas**
- Botón "Marcar como Ganada/Perdida" en lista de apuestas
- Modal rápido para resolver
- Actualización automática de estadísticas

---

### **Fase 2: Dashboard de ROI (1-2 días)**

#### **2.1. Componente ROITrackingDashboard**
- Vista principal: "ROI desde que usas BETAPREDIT: +X%"
- Desglose:
  - ROI Total
  - ROI de Value Bets
  - ROI de Apuestas Normales
  - Comparación antes/después

#### **2.2. Historial de Apuestas con ROI**
- Lista de apuestas con ROI individual
- Filtros: Value bets, por deporte, por período
- Gráfico de evolución de ROI

---

### **Fase 3: Comparación Antes/Después (1 día)**

#### **3.1. Detectar "Fecha de Inicio"**
- Fecha de primera apuesta registrada = "Inicio con BETAPREDIT"
- Apuestas antes = "Sin BETAPREDIT"
- Apuestas después = "Con BETAPREDIT"

#### **3.2. Calcular Comparación**
- ROI antes de usar BETAPREDIT (si hay datos)
- ROI después de usar BETAPREDIT
- Diferencia: "Mejoraste X% gracias a BETAPREDIT"

---

### **Fase 4: Tracking de Value Bets (1 día)**

#### **4.1. Vincular Value Bets con Apuestas**
- Cuando usuario registra apuesta desde value bet alert
- Vincular `ExternalBet` con `ValueBetAlert`
- Trackear: "De X value bets tomados, Y ganaron, ROI: +Z%"

#### **4.2. Métricas de Value Bets**
- Tasa de acierto de value bets
- ROI promedio de value bets
- Mejor value bet (mayor ganancia)
- Value bets más rentables

---

## 📋 **ESTRUCTURA DE DATOS**

### **Nuevos Campos en ExternalBet (ya existen):**
- ✅ `status` - PENDING, WON, LOST, VOID
- ✅ `result` - BetResult enum
- ✅ `actualWin` - Ganancia real
- ✅ `settledAt` - Fecha de resolución

### **Nuevo Modelo: ROITracking (Opcional)**
```prisma
model ROITracking {
  id              String   @id @default(cuid())
  userId          String
  period          String   // "all_time", "monthly", "weekly"
  periodStart     DateTime
  periodEnd       DateTime?
  
  // ROI Metrics
  totalBets       Int
  totalWins       Int
  totalLosses     Int
  totalStaked     Float
  totalWon        Float
  totalLost       Float
  netProfit       Float
  roi             Float    // (netProfit / totalStaked) * 100
  
  // Value Bets Metrics
  valueBetsTaken  Int
  valueBetsWon    Int
  valueBetsROI    Float
  
  // Comparison
  roiBefore       Float?   // ROI antes de usar BETAPREDIT
  roiAfter        Float    // ROI después de usar BETAPREDIT
  improvement     Float    // Diferencia
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, period, periodStart])
  @@index([userId, period])
}
```

**Nota:** Podemos usar `UserStatistics` existente y agregar campos de comparación.

---

## 🎯 **ENDPOINTS NECESARIOS**

### **1. Resolver Apuesta**
```
PUT /api/external-bets/:id/resolve
Body: {
  result: 'WON' | 'LOST' | 'VOID',
  actualWin?: number  // Si result = 'WON', ganancia real
}
Response: {
  success: true,
  data: {
    bet: ExternalBet,
    updatedStats: UserStatistics
  }
}
```

### **2. Obtener ROI Tracking**
```
GET /api/roi-tracking
Query: {
  period?: 'week' | 'month' | 'year' | 'all_time'
}
Response: {
  success: true,
  data: {
    totalROI: number,
    valueBetsROI: number,
    normalBetsROI: number,
    comparison: {
      before: number | null,
      after: number,
      improvement: number
    },
    valueBetsMetrics: {
      taken: number,
      won: number,
      winRate: number,
      roi: number
    }
  }
}
```

### **3. Historial de Apuestas con ROI**
```
GET /api/external-bets?includeROI=true&resolved=true
Response: {
  success: true,
  data: {
    bets: ExternalBet[],
    summary: {
      totalROI: number,
      totalProfit: number
    }
  }
}
```

---

## 🚀 **IMPLEMENTACIÓN PASO A PASO**

### **Paso 1: Servicio de ROI Tracking**
- Crear `backend/src/services/roi-tracking.service.ts`
- Métodos:
  - `calculateROI(userId, period)`
  - `calculateValueBetsROI(userId, period)`
  - `getROIComparison(userId)`
  - `updateROIOnBetResolved(betId)`

### **Paso 2: Actualizar External Bets Service**
- Agregar método `resolveBet(betId, result, actualWin?)`
- Actualizar `status`, `result`, `actualWin`, `settledAt`
- Llamar a `roiTrackingService.updateROIOnBetResolved()`

### **Paso 3: Endpoint para Resolver**
- Crear `PUT /api/external-bets/:id/resolve`
- Validar que la apuesta existe y pertenece al usuario
- Llamar a `externalBetsService.resolveBet()`
- Retornar apuesta actualizada y estadísticas

### **Paso 4: Frontend - Resolver Apuestas**
- Agregar botón "Resolver" en lista de apuestas
- Modal para seleccionar resultado (WON/LOST/VOID)
- Input opcional para ganancia real
- Actualizar UI después de resolver

### **Paso 5: Dashboard de ROI**
- Crear componente `ROITrackingDashboard.tsx`
- Mostrar ROI total, value bets ROI, comparación
- Gráfico de evolución
- Historial de apuestas

---

## 📊 **MÉTRICAS A MOSTRAR**

### **Dashboard Principal:**
1. **ROI Total:** "Desde que usas BETAPREDIT: +18.5%"
2. **ROI Value Bets:** "Value bets encontrados: +23.2% ROI"
3. **Comparación:** "Sin BETAPREDIT: -5% | Con BETAPREDIT: +18%"
4. **Mejora:** "Mejoraste 23 puntos porcentuales"

### **Desglose:**
- Total apostado: €5,000
- Total ganado: €5,925
- Ganancia neta: €925
- ROI: +18.5%
- Apuestas: 120 (85 ganadas, 35 perdidas)
- Win Rate: 70.8%

### **Value Bets Específicos:**
- Value bets tomados: 45
- Value bets ganados: 32
- Win Rate: 71.1%
- ROI: +23.2%
- Ganancia de value bets: €520

---

## 🎯 **BENEFICIOS**

1. **Demostración de Valor Real**
   - Los usuarios ven exactamente cuánto ganaron
   - Comparación clara antes/después

2. **Confianza**
   - Datos reales, no estimaciones
   - Transparencia total

3. **Retención**
   - Usuarios ven el valor y se quedan
   - Motiva a seguir usando la plataforma

4. **Marketing**
   - Casos de estudio reales
   - Testimonios con números verificables

---

## ⏱️ **TIEMPO ESTIMADO**

- **Fase 1 (Tracking Básico):** 2-3 días
- **Fase 2 (Dashboard):** 1-2 días
- **Fase 3 (Comparación):** 1 día
- **Fase 4 (Value Bets):** 1 día

**Total: 5-7 días**

---

## 🚀 **PRÓXIMOS PASOS**

1. Crear `roi-tracking.service.ts`
2. Actualizar `external-bets.service.ts` con `resolveBet()`
3. Crear endpoint `PUT /api/external-bets/:id/resolve`
4. Frontend: Botón resolver en lista de apuestas
5. Frontend: Dashboard de ROI




