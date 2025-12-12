# 🧪 Tests con Datos Reales - Guía Completa

**Última actualización:** Enero 2025  
**Objetivo:** Validar que TODO el sistema funciona al 100% con datos reales, sin mocks ni datos ficticios

---

## 📋 Índice

1. [Tipos de Tests](#tipos-de-tests)
2. [Tests con Datos Reales](#tests-con-datos-reales)
3. [Cómo Ejecutar](#cómo-ejecutar)
4. [Requisitos](#requisitos)
5. [Validación Completa](#validación-completa)
6. [Troubleshooting](#troubleshooting)

---

## 🔍 Tipos de Tests

### Tests Unitarios (con Mocks)
- **Ubicación:** `backend/src/tests/*.test.ts` (excepto `integration/`)
- **Propósito:** Validar lógica individual de funciones
- **Datos:** Usan mocks para aislar componentes
- **Ejecución:** `npm test`

### Tests de Integración con Datos Reales ⭐
- **Ubicación:** `backend/src/tests/integration/real-data-*.test.ts`
- **Propósito:** Validar que TODO funciona con datos reales
- **Datos:** Base de datos real, APIs reales, sin mocks
- **Ejecución:** `npm run test:real-data`

---

## ✅ Tests con Datos Reales

### 1. `real-data-prediction-flow.test.ts`

**Qué valida:**
- ✅ Algoritmo predictivo con cuotas reales de la BD
- ✅ Uso de datos históricos reales
- ✅ Generación de predicciones para eventos reales
- ✅ Integración con The Odds API (si está configurada)
- ✅ Precisión con predicciones completadas reales
- ✅ Consistencia del algoritmo con datos reales

**Requisitos:**
- Base de datos con eventos y cuotas reales
- Opcional: `THE_ODDS_API_KEY` configurada

### 2. `real-data-end-to-end.test.ts`

**Qué valida:**
- ✅ Flujo completo: API → BD → Predicciones → Value Bets
- ✅ Sincronización de eventos desde API real
- ✅ Obtención de cuotas reales
- ✅ Cálculo de predicciones con algoritmo real
- ✅ Detección de value bets con datos reales
- ✅ Validación de consistencia de datos en BD

**Requisitos:**
- Base de datos conectada
- `THE_ODDS_API_KEY` configurada (recomendado)

---

## 🚀 Cómo Ejecutar

### Ejecutar Todos los Tests con Datos Reales

```bash
cd backend
npm run test:real-data
```

### Ejecutar Tests de Integración

```bash
cd backend
npm run test:integration
```

### Ejecutar Validación Completa

```bash
cd backend
npm run validate-all-real-data
```

Este script valida:
- ✅ Conexión a base de datos real
- ✅ Eventos reales en BD
- ✅ Cuotas reales en BD
- ✅ Algoritmo con datos reales
- ✅ The Odds API (si está configurada)
- ✅ Predicciones reales

### Ejecutar Validación de Precisión

```bash
cd backend
npm run validate-predictions
```

---

## ⚙️ Requisitos

### 1. Base de Datos Real

**Configurar `.env`:**
```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

**Verificar conexión:**
```bash
cd backend
npm run verify-db
```

### 2. Datos en Base de Datos

**Mínimo requerido:**
- Al menos 1 evento activo
- Al menos 1 mercado con cuotas
- Opcional: Predicciones completadas para validar precisión

**Sincronizar eventos (si no hay):**
```bash
# El sistema sincroniza automáticamente, o puedes usar:
# POST /api/events/sync
```

### 3. The Odds API (Opcional pero Recomendado)

**Configurar `.env`:**
```env
THE_ODDS_API_KEY=tu_api_key_aqui
```

**Nota:** Si no está configurada, algunos tests se omitirán pero otros seguirán funcionando.

---

## 📊 Validación Completa

### Script: `validate-all-real-data.ts`

Este script valida que **TODO** funciona con datos reales:

```bash
npm run validate-all-real-data
```

**Salida esperada:**
```
============================================================
📊 VALIDACIÓN COMPLETA CON DATOS REALES
============================================================

✅ PASS Database
   Conectado a base de datos real: betapredit_prod

✅ PASS Events
   15 eventos reales encontrados de 15 totales

✅ PASS Odds
   150 cuotas reales encontradas de 150 totales
   Detalles: {"total":150,"real":150,"avgDecimal":"2.45"}

✅ PASS Algorithm
   Algoritmo funcionó correctamente con 10/10 pruebas

✅ PASS The Odds API
   API funcionando correctamente - 25 eventos obtenidos

✅ PASS Predictions
   50 predicciones reales encontradas

============================================================
📈 RESUMEN:
   ✅ Pasados: 6
   ❌ Fallidos: 0
   ⚠️  Omitidos: 0
============================================================

✅ VALIDACIÓN EXITOSA - Todo funciona con datos reales
```

---

## 🔍 Qué Validan los Tests

### Validación de Datos Reales

Los tests verifican que:

1. **No hay datos ficticios:**
   - Eventos no son "Test Event" o "Mock Event"
   - Cuotas están en rango razonable (1.01 - 1000)
   - Predicciones están vinculadas a eventos/markets reales

2. **Datos son consistentes:**
   - Eventos tienen deportes asociados
   - Cuotas tienen selecciones válidas
   - Predicciones tienen probabilidades válidas (0-1)

3. **Algoritmo funciona:**
   - Calcula probabilidades correctamente
   - Usa datos históricos reales si están disponibles
   - Produce resultados consistentes

4. **APIs funcionan:**
   - The Odds API devuelve datos reales
   - Cuotas son válidas y razonables
   - Eventos tienen información completa

---

## 🐛 Troubleshooting

### Error: "No hay eventos reales en la base de datos"

**Solución:**
1. Sincronizar eventos:
   ```bash
   # Usar el servicio de sincronización
   # O hacer POST a /api/events/sync
   ```

2. Verificar que hay eventos:
   ```bash
   npm run db:studio
   # Revisar tabla Event
   ```

### Error: "No hay cuotas reales"

**Solución:**
1. Sincronizar cuotas desde The Odds API
2. Verificar que `THE_ODDS_API_KEY` está configurada
3. Verificar que hay eventos con mercados

### Error: "API Key inválida"

**Solución:**
1. Verificar `THE_ODDS_API_KEY` en `.env`
2. Verificar que la API key tiene créditos
3. Algunos tests se omitirán si la API no está disponible

### Error: "Límite de cuota alcanzado"

**Solución:**
- Esperar a que se renueve la cuota
- Los tests seguirán validando con datos de BD

### Tests muy lentos

**Normal:** Los tests con datos reales son más lentos porque:
- Hacen queries reales a la BD
- Llaman a APIs reales
- Validan flujos completos

**Timeout:** Los tests tienen 30 segundos de timeout (configurado en `jest.config.js`)

---

## 📝 Checklist de Validación

Antes de considerar que todo funciona al 100%:

- [ ] Todos los tests con datos reales pasan
- [ ] Validación completa (`validate-all-real-data`) pasa
- [ ] Hay eventos reales en la BD
- [ ] Hay cuotas reales en la BD
- [ ] El algoritmo funciona con datos reales
- [ ] The Odds API funciona (si está configurada)
- [ ] No hay datos ficticios en la BD
- [ ] Las predicciones son reales y consistentes

---

## 🎯 Diferencia entre Tests

### Tests Unitarios (con Mocks)
```typescript
// ✅ Válido para tests unitarios
jest.mock('../config/database');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
```

**Uso:** Validar lógica individual, rápido, aislado

### Tests de Integración (Datos Reales)
```typescript
// ✅ Válido para tests de integración
import { prisma } from '../config/database'; // Real, no mock
const realEvents = await prisma.event.findMany(); // Datos reales
```

**Uso:** Validar flujo completo, datos reales, end-to-end

---

## 📚 Archivos Clave

- **Tests con datos reales:**
  - `backend/src/tests/integration/real-data-prediction-flow.test.ts`
  - `backend/src/tests/integration/real-data-end-to-end.test.ts`

- **Scripts de validación:**
  - `backend/src/scripts/validate-all-real-data.ts`
  - `backend/src/scripts/validate-prediction-accuracy.ts`

- **Configuración:**
  - `backend/jest.config.js`
  - `backend/package.json` (scripts)

---

## ✅ Conclusión

Los tests con datos reales garantizan que:

1. ✅ **Todo funciona con datos reales** (no ficticios)
2. ✅ **El algoritmo es preciso** (validado con datos reales)
3. ✅ **Las APIs funcionan** (The Odds API, etc.)
4. ✅ **Los datos son consistentes** (validación completa)
5. ✅ **El flujo completo funciona** (end-to-end)

**Ejecuta regularmente:**
```bash
npm run validate-all-real-data
```

Para asegurar que todo sigue funcionando con datos reales.

---

**Última actualización:** Enero 2025  
**Mantenedor:** Equipo de Desarrollo BETAPREDIT
