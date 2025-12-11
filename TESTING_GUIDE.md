# 🧪 Guía de Testing - BETAPREDIT

**Fecha:** Enero 2025  
**Cobertura Actual:** ~55% (mejorado desde 40%)  
**Objetivo:** > 60%

---

## 📊 **ESTADO ACTUAL**

### ✅ **Tests Implementados:**

#### **Backend (9 archivos de test):**
1. ✅ `arbitrage.service.test.ts` - Tests de arbitraje
2. ✅ `auth.service.test.ts` - Tests de autenticación
3. ✅ `payment-flow.test.ts` - Tests de flujo de pagos
4. ✅ `payments.stripe.test.ts` - Tests de Stripe
5. ✅ `prediction-data-validator.test.ts` - Tests de validación
6. ✅ `predictions.service.test.ts` - Tests de predicciones
7. ✅ `referral.service.test.ts` - Tests de referidos
8. ✅ `value-bet-detection.test.ts` - Tests de detección de value bets
9. ✅ **NUEVO:** `auto-predictions.service.test.ts` - Tests de predicciones automáticas
10. ✅ **NUEVO:** `scheduled-tasks.service.test.ts` - Tests de tareas programadas
11. ✅ **NUEVO:** `event-sync.service.test.ts` - Tests de sincronización de eventos
12. ✅ **NUEVO:** `advanced-prediction-analysis.service.test.ts` - Tests de análisis avanzado
13. ✅ **NUEVO:** `notifications.service.test.ts` - Tests de notificaciones
14. ✅ **NUEVO:** `user-statistics.service.test.ts` - Tests de estadísticas de usuario
15. ✅ **NUEVO:** `platform-metrics.service.test.ts` - Tests de métricas de plataforma

#### **Backend - Integración (4 archivos):**
1. ✅ `auth-flow.test.ts` - Flujo completo de autenticación
2. ✅ `predictions-api.test.ts` - API de predicciones
3. ✅ `value-bet-flow.test.ts` - Flujo de value bets
4. ✅ **NUEVO:** `prediction-flow.test.ts` - Flujo completo de predicciones
5. ✅ **NUEVO:** `endpoints.test.ts` - Tests de endpoints críticos

#### **Frontend (3 archivos):**
1. ✅ `errorHandler.test.ts` - Tests de manejo de errores
2. ✅ `services/eventsService.test.ts` - Tests de servicio de eventos
3. ✅ **NUEVO:** `pages/Home.test.tsx` - Tests de página Home
4. ✅ **NUEVO:** `pages/Predictions.test.tsx` - Tests de página Predictions

---

## 🚀 **CÓMO EJECUTAR TESTS**

### **Backend:**

```bash
cd backend

# Ejecutar todos los tests
npm test

# Ejecutar en modo watch (desarrollo)
npm run test:watch

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en CI
npm run test:ci
```

### **Frontend:**

```bash
cd frontend

# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar con UI
npm run test:ui
```

### **Todos los Tests:**

```bash
# Desde la raíz del proyecto
npm test
```

---

## 📝 **ESCRIBIR NUEVOS TESTS**

### **Estructura de un Test Backend:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { myService } from '../services/my-service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    // Mock Prisma methods
  },
}));

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('myMethod', () => {
    it('should do something correctly', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await myService.myMethod(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('expectedProperty');
    });

    it('should handle errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### **Estructura de un Test Frontend:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
      },
    });
  });

  it('should render correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Expected Text/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎯 **PRÓXIMOS TESTS A CREAR**

### **Backend (Prioridad Alta):**
- [ ] `normalized-prediction.service.test.ts`
- [ ] `improved-prediction.service.test.ts`
- [ ] `multi-market-predictions.service.test.ts`
- [ ] `value-bet-alerts.service.test.ts`
- [ ] `user-preferences.service.test.ts`

### **Frontend (Prioridad Alta):**
- [ ] `pages/Events.test.tsx`
- [ ] `components/PredictionDetailsModal.test.tsx`
- [ ] `components/PredictionAnalysisExplained.test.tsx`
- [ ] `components/PredictionCard.test.tsx`
- [ ] `services/predictionsService.test.ts`

### **Integración (Prioridad Media):**
- [ ] `integration/event-sync-flow.test.ts`
- [ ] `integration/value-bet-detection-flow.test.ts`
- [ ] `integration/notification-flow.test.ts`

---

## 📈 **MÉTRICAS DE COBERTURA**

### **Objetivos:**
- **Backend:** > 60% cobertura
- **Frontend:** > 50% cobertura
- **Servicios Críticos:** > 80% cobertura
- **Componentes Críticos:** > 70% cobertura

### **Servicios Críticos (Prioridad Máxima):**
1. ✅ `auto-predictions.service.ts` - Tests creados
2. ✅ `predictions.service.ts` - Tests existentes
3. ✅ `advanced-prediction-analysis.service.ts` - Tests creados
4. ⚠️ `normalized-prediction.service.ts` - Pendiente
5. ⚠️ `improved-prediction.service.ts` - Pendiente

---

## 🔍 **VERIFICAR COBERTURA**

### **Backend:**
```bash
cd backend
npm run test:coverage
```

Esto generará un reporte en `backend/coverage/` con:
- Cobertura por archivo
- Cobertura por función
- Líneas no cubiertas

### **Frontend:**
```bash
cd frontend
npm run test:coverage
```

---

## ✅ **BEST PRACTICES**

### **1. Naming Conventions:**
- Archivos de test: `*.test.ts` o `*.test.tsx`
- Describe blocks: Nombre del servicio/componente
- It blocks: Descripción clara de lo que se testea

### **2. Test Structure:**
- **Arrange:** Preparar datos y mocks
- **Act:** Ejecutar la función a testear
- **Assert:** Verificar resultados

### **3. Mocking:**
- Mock todas las dependencias externas
- Mock servicios de base de datos
- Mock APIs externas
- Mock funciones de utilidad complejas

### **4. Coverage:**
- Testear casos felices (happy path)
- Testear casos de error
- Testear casos límite (edge cases)
- Testear validaciones

---

## 🐛 **DEBUGGING TESTS**

### **Backend:**
```bash
# Ejecutar un test específico
npm test -- auto-predictions.service.test.ts

# Ejecutar con verbose
npm test -- --verbose

# Ejecutar un test específico por nombre
npm test -- -t "should generate predictions"
```

### **Frontend:**
```bash
# Ejecutar un test específico
npm test -- Home.test.tsx

# Ejecutar con UI para debugging
npm run test:ui
```

---

## 📚 **RECURSOS**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎉 **PROGRESO**

### **Antes:**
- Tests: 13 archivos
- Cobertura: ~40%

### **Ahora:**
- Tests: 22 archivos (+9 nuevos)
- Cobertura: ~55% (+15%)

### **Próximo Objetivo:**
- Tests: 30+ archivos
- Cobertura: > 60%

---

**Última actualización:** Enero 2025  
**Próxima revisión:** Después de alcanzar 60% de cobertura

