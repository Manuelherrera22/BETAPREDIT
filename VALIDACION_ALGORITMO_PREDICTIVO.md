# 🎯 Validación del Algoritmo Predictivo - Guía Completa

**Última actualización:** Enero 2025  
**Objetivo:** Garantizar que el algoritmo predictivo funciona al 100%

---

## 📋 Índice

1. [Resumen del Algoritmo](#resumen-del-algoritmo)
2. [Tests Automatizados](#tests-automatizados)
3. [Validación con Datos Reales](#validación-con-datos-reales)
4. [Métricas de Éxito](#métricas-de-éxito)
5. [Cómo Interpretar los Resultados](#cómo-interpretar-los-resultados)
6. [Troubleshooting](#troubleshooting)

---

## 🔍 Resumen del Algoritmo

### Cómo Funciona

El algoritmo predictivo (`improved-prediction.service.ts`) calcula probabilidades usando:

1. **Promedio del Mercado** (Base principal)
   - Calcula la probabilidad implícita promedio de todas las casas de apuestas
   - Ejemplo: Si 5 casas ofrecen odds de 2.0, 2.1, 1.9, 2.0, 2.05
   - Probabilidad implícita promedio ≈ 0.5 (50%)

2. **Consenso del Mercado**
   - Mide cuánto están de acuerdo las casas (desviación estándar)
   - Alto consenso = alta confianza
   - Bajo consenso = oportunidad de value bet

3. **Datos Históricos** (Opcional, si están disponibles)
   - Analiza predicciones pasadas similares
   - Ajusta probabilidad basado en precisión histórica
   - Peso: 20% histórico, 80% mercado actual

4. **Confianza del Modelo**
   - Basada en:
     - Número de casas (más = más confianza)
     - Rango de odds (más estrecho = más confianza)
     - Consenso del mercado
     - Datos históricos disponibles

### Archivos Clave

- `backend/src/services/improved-prediction.service.ts` - Algoritmo principal
- `backend/src/services/auto-predictions.service.ts` - Generación automática
- `backend/src/services/predictions.service.ts` - Gestión de predicciones
- `backend/src/tests/improved-prediction-accuracy.test.ts` - Tests de precisión

---

## 🧪 Tests Automatizados

### ⚠️ IMPORTANTE: Tests con Datos Reales

Para validar que el algoritmo funciona al 100% con datos reales (sin mocks):

```bash
cd backend
npm run test:real-data
```

Estos tests usan:
- ✅ Base de datos real
- ✅ Cuotas reales
- ✅ APIs reales (The Odds API)
- ✅ Sin mocks ni datos ficticios

### Ejecutar Todos los Tests (Incluye Unitarios con Mocks)

```bash
cd backend
npm test
```

### Ejecutar Solo Tests de Precisión

```bash
cd backend
npm test improved-prediction-accuracy.test.ts
```

### Validación Completa con Datos Reales

```bash
cd backend
npm run validate-all-real-data
```

Ver [TESTS_DATOS_REALES.md](./TESTS_DATOS_REALES.md) para más detalles.

### Tests Incluidos

#### 1. **Precisión con Consenso Total**
- Valida que cuando todas las casas están de acuerdo, el algoritmo calcula correctamente
- **Esperado:** Probabilidad ≈ promedio implícito, confianza > 0.7

#### 2. **Detección de Desacuerdo del Mercado**
- Valida que detecta cuando las casas no están de acuerdo
- **Esperado:** Bajo consenso (< 0.6) cuando hay desacuerdo

#### 3. **Uso Correcto del Promedio del Mercado**
- Valida que usa el promedio como base
- **Esperado:** Probabilidad predicha ≈ promedio implícito

#### 4. **Mejora con Datos Históricos**
- Valida que ajusta probabilidad cuando hay datos históricos
- **Esperado:** Probabilidad entre mercado e histórico (80% mercado, 20% histórico)

#### 5. **Consistencia**
- Valida que mismo input = mismo output
- **Esperado:** Variación mínima (< 1%)

#### 6. **Suma de Probabilidades**
- Valida que probabilidades de un mercado suman ≈ 1
- **Esperado:** Suma entre 0.85 y 1.15

#### 7. **Manejo de Edge Cases**
- Odds extremas (muy bajas/altas)
- Inputs inválidos
- Rangos válidos de probabilidad y confianza

#### 8. **Cálculo de Value**
- Valida que calcula value bets correctamente
- **Esperado:** Value = (predicted_prob * odds) - 1

---

## 📊 Validación con Datos Reales

### Script de Validación

El script `validate-prediction-accuracy.ts` analiza predicciones reales de la base de datos y compara con resultados.

### Ejecutar Validación

```bash
cd backend
npm run validate-predictions
```

### Qué Hace el Script

1. **Obtiene Predicciones Completadas**
   - Busca predicciones que tienen `wasCorrect` y `actualResult`
   - Analiza las últimas 1000 predicciones

2. **Calcula Métricas**
   - **Precisión General:** % de predicciones correctas
   - **Brier Score:** Medida de calibración (menor es mejor, ideal < 0.25)
   - **Calibración por Confianza:**
     - Alta confianza (≥75%): ¿Son realmente más precisas?
     - Confianza media (60-75%): ¿Están bien calibradas?
     - Baja confianza (<60%): ¿Reflejan incertidumbre?

3. **Genera Reporte**
   - Muestra métricas en consola
   - Indica si el algoritmo funciona correctamente

### Ejemplo de Salida

```
============================================================
📊 RESULTADOS DE VALIDACIÓN DEL ALGORITMO PREDICTIVO
============================================================

📈 Total de Predicciones Analizadas: 500
✅ Predicciones Correctas: 275
❌ Predicciones Incorrectas: 225

🎯 Precisión General: 55.00%
📊 Confianza Promedio: 68.50%
📉 Brier Score: 0.2345 (menor es mejor, ideal < 0.25)

------------------------------------------------------------
📊 CALIBRACIÓN POR NIVEL DE CONFIANZA
------------------------------------------------------------

🔴 Alta Confianza (≥75%):
   Predicciones: 150
   Precisión: 72.00%
   Estado: ✅ BUENO

🟡 Confianza Media (60-75%):
   Predicciones: 250
   Precisión: 56.00%
   Estado: ✅ BUENO

🟢 Baja Confianza (<60%):
   Predicciones: 100
   Precisión: 42.00%
   Estado: ✅ BUENO

============================================================
📋 INTERPRETACIÓN DE RESULTADOS
============================================================

✅ EXCELENTE: El algoritmo tiene precisión superior al 55%
   Esto es mejor que el azar (50%) y muestra que el algoritmo funciona.

✅ EXCELENTE: Brier Score bajo indica buenas predicciones probabilísticas

✅ EXCELENTE: El algoritmo está bien calibrado en todos los niveles
```

---

## ✅ Métricas de Éxito

### Precisión General

- **✅ EXCELENTE:** ≥ 55% (mejor que el azar)
- **⚠️  ACEPTABLE:** 50-55% (similar al azar)
- **❌ PROBLEMA:** < 50% (peor que el azar)

### Brier Score

- **✅ EXCELENTE:** < 0.25 (muy buena calibración)
- **⚠️  ACEPTABLE:** 0.25-0.35 (calibración moderada)
- **❌ PROBLEMA:** > 0.35 (calibración pobre)

### Calibración por Confianza

- **Alta Confianza (≥75%):**
  - **✅ BUENO:** Precisión ≥ 70%
  - **⚠️  MEJORABLE:** Precisión < 70%

- **Confianza Media (60-75%):**
  - **✅ BUENO:** Precisión ≥ 55%
  - **⚠️  MEJORABLE:** Precisión < 55%

- **Baja Confianza (<60%):**
  - **✅ BUENO:** Precisión ≥ 40%
  - **⚠️  MEJORABLE:** Precisión < 40%

---

## 📖 Cómo Interpretar los Resultados

### Si la Precisión es ≥ 55%

✅ **El algoritmo funciona correctamente**

- Está superando el azar (50%)
- Puede usarse en producción
- Considera mejorar con más datos históricos

### Si la Precisión es 50-55%

⚠️ **El algoritmo funciona pero puede mejorar**

- Está al nivel del azar
- Necesita más datos históricos
- Considera ajustar los pesos (mercado vs histórico)

### Si la Precisión es < 50%

❌ **El algoritmo necesita revisión**

- Está peor que el azar
- Revisa:
  - ¿Los datos de entrada son correctos?
  - ¿El cálculo del promedio del mercado es correcto?
  - ¿Hay errores en el código?

### Si el Brier Score es Alto (> 0.35)

❌ **El algoritmo no está bien calibrado**

- Las probabilidades no reflejan la realidad
- Revisa:
  - ¿El cálculo de probabilidades es correcto?
  - ¿Los ajustes históricos son apropiados?

### Si la Calibración por Confianza Falla

⚠️ **El algoritmo necesita mejor calibración**

- Las predicciones de alta confianza deberían ser más precisas
- Revisa:
  - ¿El cálculo de confianza es correcto?
  - ¿Los factores de confianza están bien balanceados?

---

## 🔧 Troubleshooting

### Problema: No hay predicciones para validar

**Solución:**
1. Espera a que algunos eventos terminen
2. Asegúrate de que `updatePredictionResult()` se llama cuando eventos terminan
3. Verifica que hay eventos con `status = 'FINISHED'` en la BD

### Problema: Precisión muy baja (< 50%)

**Posibles Causas:**
1. **Datos de entrada incorrectos**
   - Verifica que las odds son correctas
   - Verifica que el promedio del mercado se calcula bien

2. **Algoritmo no ajustado**
   - Revisa los pesos (80% mercado, 20% histórico)
   - Considera ajustar según resultados

3. **Datos históricos incorrectos**
   - Verifica que `getHistoricalAccuracy()` funciona
   - Asegúrate de que hay suficientes datos históricos

**Solución:**
```bash
# Revisar logs
cd backend
npm run dev

# Verificar cálculo manualmente
# Usa el debugger o console.log en improved-prediction.service.ts
```

### Problema: Brier Score alto (> 0.35)

**Causa:** Las probabilidades no están bien calibradas

**Solución:**
1. Revisa el cálculo de `predictedProbability`
2. Asegúrate de que no hay ajustes arbitrarios
3. Verifica que el promedio del mercado se calcula correctamente

### Problema: Tests fallan

**Solución:**
```bash
# Ejecutar tests con más detalle
cd backend
npm test -- --verbose

# Ejecutar un test específico
npm test improved-prediction-accuracy.test.ts

# Ver cobertura
npm run test:coverage
```

---

## 🚀 Próximos Pasos

### Para Mejorar el Algoritmo

1. **Recopilar Más Datos Históricos**
   - Cuantas más predicciones completadas, mejor
   - Objetivo: > 1000 predicciones para análisis robusto

2. **Ajustar Pesos**
   - Actualmente: 80% mercado, 20% histórico
   - Experimenta con diferentes pesos según resultados

3. **Agregar Más Factores**
   - Estadísticas de equipos
   - Forma reciente
   - Lesiones
   - Head-to-head

4. **Mejorar Calibración**
   - Ajusta confianza según precisión histórica
   - Usa Brier Score para optimizar

---

## 📚 Referencias

- [Tests de Precisión](./backend/src/tests/improved-prediction-accuracy.test.ts)
- [Script de Validación](./backend/src/scripts/validate-prediction-accuracy.ts)
- [Servicio de Predicciones](./backend/src/services/improved-prediction.service.ts)
- [Documentación de Brier Score](https://en.wikipedia.org/wiki/Brier_score)

---

## ✅ Checklist de Validación

Antes de considerar que el algoritmo funciona al 100%:

- [ ] Todos los tests automatizados pasan
- [ ] Precisión general ≥ 55%
- [ ] Brier Score < 0.35 (ideal < 0.25)
- [ ] Calibración por confianza correcta
- [ ] Al menos 100 predicciones analizadas
- [ ] No hay errores en logs
- [ ] El algoritmo es consistente (mismo input = mismo output)
- [ ] Las probabilidades están en rango válido [0.01, 0.99]
- [ ] La confianza está en rango válido [0.45, 0.95]

---

**Última actualización:** Enero 2025  
**Mantenedor:** Equipo de Desarrollo BETAPREDIT
