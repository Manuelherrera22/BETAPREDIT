# 🔌 Integración con Kalshi API

## 📋 Descripción

BETAPREDIT ahora incluye integración completa con la API de Kalshi, una plataforma de mercado de predicciones regulada. Esto nos permite:

- ✅ Obtener probabilidades del mercado en tiempo real
- ✅ Comparar nuestras predicciones ML con el sentimiento del mercado
- ✅ Acceder a datos de eventos no solo deportivos
- ✅ Obtener datos de trading y volumen

---

## 🚀 Configuración

### 1. Crear cuenta en Kalshi

1. Ve a [https://kalshi.com](https://kalshi.com)
2. Crea una cuenta
3. Verifica tu email

### 2. Generar Claves API

**Opción A: Desde la Web UI**
1. Inicia sesión en tu cuenta
2. Ve a **Configuración de la cuenta** → **Claves API**
3. Haz clic en **"Crear nueva clave API"**
4. **IMPORTANTE**: Guarda la clave privada RSA inmediatamente, no podrás verla de nuevo
5. Copia el **ID de la clave API** (esto es tu `KALSHI_API_KEY`)

**Opción B: Usando la API (Programáticamente)**
1. Primero necesitas generar un par de claves RSA:
   ```bash
   # Generar clave privada
   openssl genrsa -out kalshi_private_key.pem 2048
   
   # Generar clave pública
   openssl rsa -in kalshi_private_key.pem -pubout -out kalshi_public_key.pem
   ```

2. Usa la API para crear la clave:
   ```bash
   curl --request POST \
     --url https://api.elections.kalshi.com/trade-api/v2/api-keys \
     --header 'Content-Type: application/json' \
     --header 'KALSHI-ACCESS-SIGNATURE: <firma>' \
     --header 'KALSHI-ACCESS-TIMESTAMP: <timestamp>' \
     --data '{
       "name": "BETAPREDIT Integration",
       "public_key": "<contenido de kalshi_public_key.pem>"
     }'
   ```

3. La respuesta incluirá `api_key_id` que usarás como `KALSHI_API_KEY`
4. Guarda la clave privada como `KALSHI_API_SECRET`

### 3. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env` en el backend:

```env
# Kalshi API Configuration
KALSHI_API_KEY=tu_api_key_id_aqui
KALSHI_API_SECRET=-----BEGIN RSA PRIVATE KEY-----\nTu clave privada aquí\n-----END RSA PRIVATE KEY-----
KALSHI_BASE_URL=https://api.demo.kalshi.com/trade-api/v2
KALSHI_TIMEOUT=10000
```

**Nota sobre KALSHI_API_SECRET:**
- Debe incluir los saltos de línea como `\n`
- O puedes usar el formato completo con saltos de línea reales
- Ejemplo:
  ```
  KALSHI_API_SECRET="-----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEA...
  ...
  -----END RSA PRIVATE KEY-----"
  ```

### 4. Entornos Disponibles

**Elections (Para eventos de elecciones):**
```
KALSHI_BASE_URL=https://api.elections.kalshi.com
```

**Demo (Recomendado para desarrollo):**
```
KALSHI_BASE_URL=https://api.demo.kalshi.com
```

**Producción:**
```
KALSHI_BASE_URL=https://api.kalshi.com
```

**Nota:** El servicio automáticamente agrega `/trade-api/v2` a la URL base.

---

## 📡 Endpoints Disponibles

### Públicos (No requieren autenticación)

#### GET `/api/kalshi/exchange/status`
Verifica el estado del exchange de Kalshi.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "exchange_active": true,
    "trading_active": true,
    "exchange_estimated_resume_time": "2023-11-07T05:31:56Z"
  }
}
```

#### GET `/api/kalshi/series`
Obtiene todas las series (categorías) disponibles.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "series_ticker": "SPORTS",
      "title": "Sports",
      "category": "sports",
      "markets_count": 150
    }
  ]
}
```

#### GET `/api/kalshi/events`
Obtiene eventos disponibles.

**Query Parameters:**
- `series_ticker` (opcional): Filtrar por serie
- `category` (opcional): Filtrar por categoría
- `search` (opcional): Buscar eventos
- `limit` (opcional): Límite de resultados (default: 50)

**Ejemplo:**
```
GET /api/kalshi/events?category=sports&limit=20
```

#### GET `/api/kalshi/events/:eventTicker/markets`
Obtiene todos los mercados de un evento.

**Ejemplo:**
```
GET /api/kalshi/events/SPORTS-12345/markets
```

#### GET `/api/kalshi/markets/:marketTicker`
Obtiene detalles de un mercado específico, incluyendo probabilidades.

**Ejemplo:**
```
GET /api/kalshi/markets/SPORTS-12345-WILL-WIN
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "market_ticker": "SPORTS-12345-WILL-WIN",
    "event_ticker": "SPORTS-12345",
    "title": "Will Team A win?",
    "yes_bid": 65.5,
    "yes_ask": 66.0,
    "no_bid": 34.0,
    "no_ask": 34.5,
    "last_price": 65.0,
    "volume": 12500,
    "liquidity": 5000,
    "probability": {
      "yes": 0.65,
      "no": 0.35,
      "confidence": 0.5
    }
  }
}
```

#### GET `/api/kalshi/markets/trending`
Obtiene los mercados con mayor volumen (más activos).

**Query Parameters:**
- `limit` (opcional): Número de mercados (default: 20)

---

### Protegidos (Requieren autenticación)

#### POST `/api/kalshi/compare/:eventTicker/:marketTicker`
Compara las probabilidades de Kalshi con nuestras predicciones ML.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "mlProbability": 0.72
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "kalshiProbability": 0.65,
    "mlProbability": 0.72,
    "difference": 0.07,
    "valueOpportunity": 7.0
  }
}
```

---

## 💡 Casos de Uso

### 1. Comparar Predicciones ML vs Mercado

```typescript
// En tu servicio
const kalshi = getKalshiService();
const comparison = await kalshi.compareWithMLPrediction(
  'SPORTS-12345',
  'SPORTS-12345-WILL-WIN',
  0.72 // Nuestra predicción ML
);

// Si hay diferencia significativa, podría ser un value bet
if (comparison.valueOpportunity > 5) {
  // Crear alerta de value bet
}
```

### 2. Obtener Probabilidades del Mercado

```typescript
const market = await kalshi.getMarketDetails('SPORTS-12345-WILL-WIN');
const probability = kalshi.getMarketProbability(market);
// probability.yes = 0.65 (65% probabilidad de que gane)
```

### 3. Encontrar Eventos Trending

```typescript
const trending = await kalshi.getTrendingMarkets(10);
// Obtiene los 10 mercados con mayor volumen
```

---

## 🔒 Seguridad

- Las claves API deben estar en variables de entorno, nunca en el código
- Usa el entorno demo para desarrollo
- La autenticación usa RSA-PSS signatures
- Todas las requests están firmadas con timestamp para prevenir replay attacks

---

## 📚 Documentación Oficial

- [Kalshi API Docs](https://docs.kalshi.com)
- [Getting Started](https://docs.kalshi.com/getting_started)
- [API Keys](https://docs.kalshi.com/getting_started/api_keys)
- [SDKs](https://docs.kalshi.com/sdks/overview)

---

## 🐛 Troubleshooting

### Error: "Kalshi service not configured"
- Verifica que las variables de entorno estén configuradas
- Reinicia el servidor después de agregar las variables

### Error: "Failed to generate signature"
- Verifica que `KALSHI_API_SECRET` tenga el formato correcto
- Asegúrate de incluir los saltos de línea (`\n`) o el formato completo

### Error: "401 Unauthorized"
- Verifica que `KALSHI_API_KEY` sea correcto
- Verifica que la clave privada sea válida
- Asegúrate de estar usando el entorno correcto (demo vs producción)

---

## 🎯 Próximos Pasos

1. ✅ Configurar credenciales en `.env`
2. ✅ Probar endpoints con Postman/Thunder Client
3. ✅ Integrar datos de Kalshi en el dashboard
4. ✅ Comparar automáticamente con predicciones ML
5. ✅ Crear alertas cuando hay divergencias significativas

