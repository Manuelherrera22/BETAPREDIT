# 🚀 Cómo Agregar Nuevos Dominios al Modelo Universal

**Guía completa para expandir el modelo predictivo a nuevos mercados**

---

## 📋 **DOMINIOS SOPORTADOS**

### **Actual:**
- ✅ **Sports** (Deportes) - Implementado

### **Futuro:**
- 🔄 **Finance** (Mercados Financieros)
- 🔄 **Crypto** (Criptomonedas)
- 🔄 **Politics** (Eventos Políticos)
- 🔄 **Generic** (Cualquier mercado con datos temporales)

---

## 🎯 **PROCESO: Agregar Nuevo Dominio**

### **Paso 1: Preparar Datos de Entrenamiento** (1-2 días)

**Necesitas datos históricos con:**
- Features del evento
- Datos históricos (series temporales)
- Resultados reales (outcomes)

**Formato de datos:**
```json
{
  "features": {
    "marketOdds": [2.0, 3.5, 2.5],  // Si aplica
    "sources": [
      {"value": 0.5, "probability": 0.5}
    ],
    "volume": 1.0,
    "activity": 1.0,
    "timestamp": "2024-01-15T10:00:00Z",
    // Features específicas del dominio
  },
  "historical": [
    {
      "value": 0.5,
      "probability": 0.5,
      "timestamp": 1705312800
    }
  ],
  "outcome": 1.0,  // Resultado real (0-1)
  "probability": 0.6  // Probabilidad real
}
```

**Mínimo recomendado:** 100-500 muestras para entrenamiento inicial

---

### **Paso 2: Crear Script de Entrenamiento** (2-4 horas)

**Template para nuevo dominio:**

```python
# ml-services/scripts/train_{domain}_adapter.py

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.universal_predictor import UniversalPredictor
from dotenv import load_dotenv

load_dotenv()

class {Domain}AdapterTrainer:
    def __init__(self):
        self.predictor = UniversalPredictor()
    
    async def fetch_training_data(self, limit: int = 500):
        """
        Fetch historical data for {domain}
        Replace with your data source
        """
        # TODO: Implement data fetching
        # - From database
        # - From API
        # - From file
        pass
    
    async def train_adapter(self, training_data):
        """
        Train adapter for {domain}
        """
        self.predictor.add_domain_adapter("{domain}", training_data)
        print(f"✅ {domain} adapter trained!")

async def main():
    trainer = {Domain}AdapterTrainer()
    data = await trainer.fetch_training_data()
    await trainer.train_adapter(data)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### **Paso 3: Entrenar Adaptador** (1-2 horas)

**Ejecutar script:**
```bash
cd ml-services
python scripts/train_{domain}_adapter.py
```

**Salida esperada:**
```
✅ {domain} adapter trained successfully!
   - Training samples: 500
   - Domain: {domain}
```

---

### **Paso 4: Integrar con Backend** (1-2 horas)

**Usar el servicio universal:**

```typescript
// backend/src/services/universal-prediction.service.ts

// Para nuevo dominio
const prediction = await universalPredictionService.getUniversalPrediction({
  domain: 'finance', // o 'crypto', 'politics', etc.
  eventId: 'event123',
  features: {
    // Features específicas del dominio
  },
  historicalData: [...],
});
```

---

### **Paso 5: Testing** (2-4 horas)

**Probar predicciones:**
```bash
# Test via API
curl -X POST http://localhost:8000/api/universal/predict \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "finance",
    "eventId": "test",
    "features": {...}
  }'
```

---

## 📊 **EJEMPLOS POR DOMINIO**

### **1. Finance (Mercados Financieros)**

**Features específicas:**
```json
{
  "features": {
    "marketOdds": [1.5, 2.0, 3.0],  // Precios de opciones
    "volume": 1000000,  // Volumen de trading
    "activity": 0.8,  // Actividad del mercado
    "volatility": 0.25,  // Volatilidad (VIX)
    "trend": 0.6,  // Tendencia
    "timestamp": "2024-01-15T10:00:00Z"
  },
  "historical": [
    {
      "value": 150.5,  // Precio histórico
      "probability": 0.6,
      "timestamp": 1705312800
    }
  ],
  "outcome": 1.0  // Subió (1) o bajó (0)
}
```

**Fuentes de datos:**
- Yahoo Finance API
- Alpha Vantage
- IEX Cloud
- Polygon.io

---

### **2. Crypto (Criptomonedas)**

**Features específicas:**
```json
{
  "features": {
    "marketOdds": [1.8, 2.2],  // Precios de futuros
    "volume": 50000000,  // Volumen 24h
    "activity": 0.9,  // Actividad en redes
    "sentiment": 0.7,  // Sentimiento (Twitter/Reddit)
    "timestamp": "2024-01-15T10:00:00Z"
  },
  "historical": [
    {
      "value": 45000,  // Precio BTC histórico
      "probability": 0.65,
      "timestamp": 1705312800
    }
  ],
  "outcome": 1.0  // Subió (1) o bajó (0)
}
```

**Fuentes de datos:**
- CoinGecko API
- Binance API
- CryptoCompare
- Social sentiment APIs

---

### **3. Politics (Eventos Políticos)**

**Features específicas:**
```json
{
  "features": {
    "marketOdds": [1.3, 4.0],  // Probabilidades de mercado
    "volume": 10000,  // Volumen de trading
    "activity": 0.7,  // Actividad en redes
    "sentiment": 0.6,  // Sentimiento (Twitter)
    "polls": 0.55,  // Promedio de encuestas
    "timestamp": "2024-01-15T10:00:00Z"
  },
  "historical": [
    {
      "value": 0.52,  // Probabilidad histórica
      "probability": 0.52,
      "timestamp": 1705312800
    }
  ],
  "outcome": 1.0  // Ganó (1) o perdió (0)
}
```

**Fuentes de datos:**
- PredictIt API
- Kalshi API
- FiveThirtyEight
- Twitter API (sentiment)

---

## 🔧 **CONFIGURACIÓN**

### **Variables de Entorno**

Agregar a `.env`:
```env
# ML Service
ML_SERVICE_URL=http://localhost:8000

# Domain-specific APIs (opcional)
FINANCE_API_KEY=your_key
CRYPTO_API_KEY=your_key
POLITICS_API_KEY=your_key
```

---

## 📈 **MEJORAS CONTINUAS**

### **Re-entrenar Adaptador**

**Cuándo:**
- Cada mes con nuevos datos
- Cuando precisión baja
- Después de cambios significativos

**Cómo:**
```bash
# Re-entrenar con más datos
python scripts/train_{domain}_adapter.py --limit 2000
```

---

## ✅ **CHECKLIST**

Antes de considerar un dominio "listo":

- [ ] Datos de entrenamiento recopilados (100+ muestras)
- [ ] Script de entrenamiento creado
- [ ] Adaptador entrenado exitosamente
- [ ] Testing básico pasado
- [ ] Integrado con backend
- [ ] Documentado en código
- [ ] Variables de entorno configuradas
- [ ] Testing de producción realizado

---

## 🚀 **PRÓXIMOS DOMINIOS SUGERIDOS**

1. **Finance** - Mercados de acciones/opciones
2. **Crypto** - Criptomonedas
3. **Politics** - Eventos políticos/elecciones
4. **Weather** - Predicciones meteorológicas
5. **Entertainment** - Premios, ratings, etc.

---

## 💡 **TIPS**

1. **Empieza pequeño:** 100-200 muestras son suficientes para empezar
2. **Itera rápido:** Re-entrena frecuentemente con más datos
3. **Features universales:** Usa las features universales cuando sea posible
4. **Testing continuo:** Prueba con datos reales antes de producción
5. **Documenta:** Mantén documentación actualizada

---

## 🆘 **TROUBLESHOOTING**

### **Error: "Not enough training data"**
- **Solución:** Reduce `limit` o genera datos sintéticos iniciales

### **Error: "Adapter training failed"**
- **Solución:** Verifica formato de datos, debe tener `features`, `historical`, `outcome`

### **Error: "Domain not found"**
- **Solución:** Asegúrate de entrenar el adaptador antes de usarlo

---

## 📚 **RECURSOS**

- [Documentación Universal Predictor](../ml-services/services/universal_predictor.py)
- [Ejemplo Sports Adapter](../ml-services/scripts/train_sports_adapter.py)
- [Universal Prediction Service](../backend/src/services/universal-prediction.service.ts)

---

**¿Listo para agregar tu primer dominio?** 🚀

