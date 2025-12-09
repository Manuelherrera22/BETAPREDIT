# 🚨 Plan de Mitigación: Uso Excesivo de The Odds API

## 📊 **Análisis del Problema**

### **Llamadas Identificadas:**

1. **Página de Arbitraje** (`Arbitrage.tsx`):
   - `getOdds()`: 1 llamada para obtener eventos
   - `compareOdds()`: Hasta **150 llamadas** (para `limit * 3` eventos)
   - **Total por carga**: ~151 llamadas
   - Se ejecuta cada vez que cambian los filtros

2. **Página de Comparación de Cuotas** (`OddsComparison.tsx`):
   - `getOdds()`: Cada **60 segundos** (auto-refresh)
   - `compareOdds()`: Cada **30 segundos** (auto-refresh)
   - **Total por usuario/minuto**: ~3 llamadas
   - Si 10 usuarios están 10 minutos: **300 llamadas**

3. **Sin Caching en Frontend**:
   - Cada llamada va directo a la API
   - No hay cache local
   - No hay debouncing

### **Cálculo de Uso:**
- **500 créditos/mes** en plan free
- Si 5 usuarios usan la plataforma 1 hora/día:
  - Arbitraje: 151 llamadas × 5 usuarios = **755 llamadas/día**
  - Comparación: 3 llamadas/min × 60 min × 5 usuarios = **900 llamadas/día**
  - **Total: ~1,655 llamadas/día = 49,650 llamadas/mes** ❌

---

## ✅ **Plan de Mitigación**

### **1. Implementar Caching Agresivo**

#### **Frontend (LocalStorage + Memory Cache)**
- Cache de eventos: 5 minutos
- Cache de comparaciones: 2 minutos
- Cache de deportes: 1 hora

#### **Backend/Edge Function (Redis)**
- Ya existe cache de 60 segundos
- Aumentar a 2-5 minutos para datos menos críticos

### **2. Reducir Frecuencia de Auto-Refresh**

#### **OddsComparison.tsx**
- Cambiar de 60s a **5 minutos** para eventos
- Cambiar de 30s a **2 minutos** para comparaciones
- Usar WebSocket como fuente principal (ya implementado)

#### **Arbitrage.tsx**
- No auto-refresh automático
- Solo refresh manual o cuando cambian filtros
- Usar WebSocket para actualizaciones en tiempo real

### **3. Optimizar Llamadas de Arbitraje**

#### **Problema Actual:**
- Hace `compareOdds()` para cada evento (hasta 150)
- Cada `compareOdds()` es una llamada separada

#### **Solución:**
- Usar solo los datos de `getOdds()` (ya incluye todas las cuotas)
- Calcular arbitraje directamente desde esos datos
- Solo hacer `compareOdds()` si el usuario hace click en un evento específico

### **4. Implementar Debouncing**

- Esperar 500ms antes de hacer llamadas cuando cambian filtros
- Evitar múltiples llamadas simultáneas

### **5. Limitar Número de Eventos Procesados**

- Reducir `limit * 3` a `limit * 1.5` (de 150 a 75 eventos)
- Procesar solo eventos más cercanos en el tiempo

### **6. Monitoreo de Uso**

- Agregar contador de llamadas
- Mostrar advertencia cuando se acerca al límite
- Bloquear llamadas si se excede el límite

---

## 🎯 **Objetivo**

Reducir de **~1,655 llamadas/día** a **~50-100 llamadas/día** (reducción del 95%)

---

## 📋 **Implementación Priorizada**

1. ✅ **Caching en Frontend** (Alto impacto, fácil)
2. ✅ **Reducir frecuencia de refresh** (Alto impacto, fácil)
3. ✅ **Optimizar arbitraje** (Alto impacto, medio)
4. ✅ **Debouncing** (Medio impacto, fácil)
5. ✅ **Monitoreo** (Bajo impacto, útil)

---

**¿Procedo con la implementación?**

