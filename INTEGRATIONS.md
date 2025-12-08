# Guía de Integraciones - BETAPREDIT

Este documento detalla las integraciones con proveedores externos de datos y servicios B2B.

## Categorías de Proveedores

### I. Fuentes de Datos en Tiempo Real

#### 1. Sportradar
**Propósito**: Datos de cuotas y eventos en tiempo real, integridad del mercado

**Configuración**:
```env
SPORTRADAR_API_KEY=your-api-key
SPORTRADAR_API_URL=https://api.sportradar.com
```

**Características**:
- Actualizaciones de cuotas en tiempo real (baja latencia)
- Universal Fraud Detection System (UFDS)
- Monitoreo de integridad del mercado
- Datos de eventos en vivo

**Endpoints**:
- `GET /api/integrations/sportradar/odds/:eventId` - Obtener cuotas en tiempo real
- `GET /api/integrations/sportradar/events/live` - Eventos en vivo
- `POST /api/integrations/sportradar/integrity/check` - Verificar integridad

**Requisitos de Latencia**: < 100ms para actualizaciones de odds

---

#### 2. ShotTracker / KINEXON
**Propósito**: Datos granulares a nivel de jugador y balón

**Configuración**:
```env
SHOTTRACKER_API_KEY=your-api-key
SHOTTRACKER_API_URL=https://api.shottracker.com
KINEXON_API_KEY=your-api-key
KINEXON_API_URL=https://api.kinexon.com
```

**Características**:
- Tracking de jugadores con UWB (Ultra-Wideband)
- Tracking de balón con RFID
- Más de 3 TB de datos por partido
- Métricas avanzadas a nivel de jugador

**Endpoints**:
- `GET /api/integrations/player-data/:eventId` - Datos de tracking
- `GET /api/integrations/player-data/:eventId/metrics` - Métricas agregadas
- `GET /api/integrations/player-data/:eventId/player/:playerId` - Métricas de jugador específico

**Importancia**: Los datos a nivel de jugador son críticos para modelos ML precisos, ya que las estadísticas agregadas del equipo no reflejan lesiones o rendimiento individual.

---

### II. Proveedores B2B (Soluciones Llave en Mano)

#### 1. Altenar
**Propósito**: Infraestructura compartida, soporte legal, centralización de datos

**Características**:
- Conecta kioscos, cajas y cuentas online
- Soporte legal diseñado para cada mercado
- Centralización de datos (fidelidad, comportamiento, CRM)
- Gestión unificada de cuentas

**Configuración**:
```env
ALTENAR_API_KEY=your-api-key
ALTENAR_API_URL=https://api.altenar.com
```

---

#### 2. BtoBet
**Propósito**: Soluciones de software para operadores iGaming

**Características**:
- Optimización de ingresos
- Plataforma completa de apuestas

**Configuración**:
```env
BTOBET_API_KEY=your-api-key
BTOBET_API_URL=https://api.btobet.com
```

---

#### 3. Evolution Gaming
**Propósito**: Soluciones de casino en vivo

**Características**:
- Más de 600 operadores como clientes
- Juegos de casino en vivo

---

#### 4. Microgaming (Games Global)
**Propósito**: Tragaperras online

**Características**:
- Más de 50 proveedores consolidados
- Plataforma Quickfire

---

### III. Algoritmos Predictivos (ML/AI)

#### 1. ZCode System
**Propósito**: Análisis estadístico avanzado y predicciones

**Configuración**:
```env
ZCODE_API_KEY=your-api-key
ZCODE_API_URL=https://api.zcode.com
```

**Endpoints**:
- `POST /api/integrations/predictions/zcode` - Obtener predicciones
- `POST /api/integrations/bet-sizing/zcode` - Recomendaciones de bet sizing
- `POST /api/integrations/value-bets/zcode` - Identificar value bets

---

#### 2. Trademate Sports
**Propósito**: Plataforma de algoritmos para apuestas deportivas

**Configuración**:
```env
TRADEMATE_API_KEY=your-api-key
TRADEMATE_API_URL=https://api.trademate.com
```

---

#### 3. OddsJam
**Propósito**: Análisis de valor y comparación de cuotas

**Configuración**:
```env
ODDSJAM_API_KEY=your-api-key
ODDSJAM_API_URL=https://api.oddsjam.com
```

---

#### 4. BetBurger
**Propósito**: Detección de arbitraje y value bets

**Configuración**:
```env
BETBURGER_API_KEY=your-api-key
BETBURGER_API_URL=https://api.betburger.com
```

---

## Estrategias de Integración

### Bet Sizing
Los algoritmos predictivos permiten implementar **bet sizing**: asignar más capital donde el modelo predice mayor probabilidad de ganar.

**Ejemplo de uso**:
```typescript
const recommendation = await predictiveAlgorithmsService.getBetSizing(
  'zcode',
  eventId,
  bankroll
);

// recommendation contiene:
// - Selecciones recomendadas
// - Tamaño de apuesta sugerido
// - Valor esperado (EV)
// - Probabilidad estimada
```

### Valor de Datos Granulares
Los datos a nivel de jugador (ShotTracker/KINEXON) son esenciales porque:
1. Las estadísticas agregadas del equipo no reflejan lesiones
2. El rendimiento individual modifica probabilidades
3. Los modelos ML requieren granularidad para precisión

### Migración desde Excel
Para escalabilidad, es crucial migrar de herramientas como Excel a:
- Base de datos estructurada (PostgreSQL)
- APIs para acceso a datos
- Procesamiento en tiempo real
- Almacenamiento de datos históricos

---

## Arquitectura de Datos

### Flujo de Datos en Tiempo Real

```
Sportradar API → Backend → Redis Cache → WebSocket → Frontend
     ↓
  Database (PostgreSQL)
     ↓
  ML Services (para análisis)
```

### Flujo de Datos de Jugadores

```
ShotTracker/KINEXON → Backend → Processing → MatchMetrics
     ↓
  Database (PlayerTrackingData)
     ↓
  ML Models (para predicciones mejoradas)
```

---

## Mejores Prácticas

1. **Caché Agresivo**: Usar Redis para datos frecuentes (odds, eventos)
2. **TTL Corto**: Para datos en tiempo real, TTL de 5-30 segundos
3. **Fallback**: Si un proveedor falla, usar datos en caché o proveedor alternativo
4. **Rate Limiting**: Respetar límites de APIs externas
5. **Monitoreo**: Logging de todas las llamadas a APIs externas
6. **Retry Logic**: Implementar reintentos con exponential backoff

---

## Configuración de Producción

### Variables de Entorno Requeridas

```env
# Datos en Tiempo Real
SPORTRADAR_API_KEY=required
SPORTRADAR_API_URL=https://api.sportradar.com

# Datos Granulares (Opcional pero recomendado)
SHOTTRACKER_API_KEY=optional
KINEXON_API_KEY=optional

# Algoritmos Predictivos (Opcional)
ZCODE_API_KEY=optional
TRADEMATE_API_KEY=optional
ODDSJAM_API_KEY=optional
BETBURGER_API_KEY=optional

# B2B Providers (Opcional)
ALTENAR_API_KEY=optional
BTOBET_API_KEY=optional
```

### Priorización de Proveedores

1. **Crítico**: Sportradar (datos de odds y eventos)
2. **Importante**: ShotTracker/KINEXON (datos granulares)
3. **Opcional**: Algoritmos predictivos (mejoran precisión)
4. **Opcional**: B2B providers (para operaciones completas)

---

## Troubleshooting

### Error: "Service not configured"
- Verificar que las variables de entorno estén configuradas
- Verificar que las API keys sean válidas

### Latencia Alta
- Verificar conexión a internet
- Revisar configuración de timeout
- Considerar usar WebSockets en lugar de polling

### Datos Desactualizados
- Verificar TTL de caché
- Aumentar frecuencia de actualización
- Verificar que el proveedor esté enviando actualizaciones

---

## Referencias

- [Sportradar Documentation](https://sportradar.com)
- [ShotTracker Documentation](https://shottracker.com)
- [KINEXON Documentation](https://kinexon.com)
- [ZCode System](https://zcode.com)
- [Trademate Sports](https://trademate.com)

