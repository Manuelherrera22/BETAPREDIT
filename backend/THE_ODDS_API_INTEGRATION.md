# 🎯 Integración con The Odds API<>

## 📋 Descripción

**The Odds API** es la API más útil para BETAPREDIT porque:

- ✅ Compara cuotas de **múltiples casas de apuestas** (Bet365, Betfair, Pinnacle, William Hill, etc.)
- ✅ Detecta automáticamente la **mejor cuota disponible**
- ✅ Perfecto para **detección de value bets**
- ✅ Actualización en tiempo real
- ✅ Plan gratuito disponible (500 requests/mes)

---

## 🚀 Configuración

### 1. Crear cuenta y obtener API Key

1. Ve a [https://the-odds-api.com](https://the-odds-api.com)
2. Crea una cuenta (gratis)
3. Ve a **Dashboard** → **API Keys**
4. Copia tu **API Key**

### 2. Configurar Variables de Entorno

Agrega al `.env` del backend:

```env
# The Odds API Configuration
THE_ODDS_API_KEY=tu_api_key_aqui
THE_ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
THE_ODDS_API_TIMEOUT=10000
```

### 3. Planes Disponibles

- **Free**: 500 requests/mes (perfecto para desarrollo)
- **Starter**: $10/mes - 5,000 requests
- **Developer**: $50/mes - 50,000 requests
- **Business**: $200/mes - 200,000 requests

---

## 📡 Endpoints Disponibles

### GET `/api/the-odds-api/sports`
Obtiene todos los deportes disponibles.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "key": "soccer",
      "title": "Soccer",
      "active": true
    },
    {
      "key": "basketball",
      "title": "Basketball",
      "active": true
    }
  ]
}
```

### GET `/api/the-odds-api/sports/:sport/odds`
Obtiene cuotas de todos los eventos de un deporte.

**Query Parameters:**
- `regions` (opcional): `us,uk,eu` (default: `us,uk,eu`)
- `markets` (opcional): `h2h,spreads,totals` (default: `h2h,spreads,totals`)
- `oddsFormat` (opcional): `decimal` o `american` (default: `decimal`)

**Ejemplo:**
```
GET /api/the-odds-api/sports/soccer/odds?regions=us,uk&markets=h2h
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_123",
      "sport_key": "soccer",
      "sport_title": "Soccer",
      "commence_time": "2025-01-20T15:00:00Z",
      "home_team": "Real Madrid",
      "away_team": "Barcelona",
      "bookmakers": [
        {
          "key": "bet365",
          "title": "Bet365",
          "last_update": "2025-01-20T10:30:00Z",
          "markets": [
            {
              "key": "h2h",
              "last_update": "2025-01-20T10:30:00Z",
              "outcomes": [
                { "name": "Real Madrid", "price": 2.10 },
                { "name": "Barcelona", "price": 3.20 },
                { "name": "Draw", "price": 3.50 }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2025-01-20T10:30:00Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                { "name": "Real Madrid", "price": 2.15 },
                { "name": "Barcelona", "price": 3.25 },
                { "name": "Draw", "price": 3.40 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### GET `/api/the-odds-api/sports/:sport/events/:eventId/compare`
Compara cuotas de todas las casas de apuestas y encuentra la mejor.

**Query Parameters:**
- `market` (opcional): `h2h`, `spreads`, `totals` (default: `h2h`)

**Ejemplo:**
```
GET /api/the-odds-api/sports/soccer/events/event_123/compare?market=h2h
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "event": { /* event data */ },
    "comparisons": {
      "Real Madrid": {
        "selection": "Real Madrid",
        "bestOdds": 2.15,
        "bestBookmaker": "Betfair",
        "allOdds": [
          { "bookmaker": "Bet365", "odds": 2.10 },
          { "bookmaker": "Betfair", "odds": 2.15 },
          { "bookmaker": "Pinnacle", "odds": 2.12 }
        ],
        "averageOdds": 2.12,
        "maxDifference": 0.05
      },
      "Barcelona": {
        "selection": "Barcelona",
        "bestOdds": 3.25,
        "bestBookmaker": "Betfair",
        "allOdds": [
          { "bookmaker": "Bet365", "odds": 3.20 },
          { "bookmaker": "Betfair", "odds": 3.25 }
        ],
        "averageOdds": 3.22,
        "maxDifference": 0.05
      }
    },
    "bestBookmakers": {
      "Real Madrid": "Betfair",
      "Barcelona": "Betfair",
      "Draw": "Pinnacle"
    }
  }
}
```

### POST `/api/the-odds-api/sports/:sport/events/:eventId/value-bets`
Detecta value bets comparando cuotas con probabilidades predichas.

**Body:**
```json
{
  "predictedProbabilities": {
    "Real Madrid": 0.50,
    "Barcelona": 0.30,
    "Draw": 0.20
  },
  "minValue": 0.05
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "selection": "Real Madrid",
      "bookmaker": "Betfair",
      "odds": 2.15,
      "predictedProbability": 0.50,
      "impliedProbability": 0.465,
      "value": 0.075,
      "expectedValue": 7.5
    }
  ]
}
```

### GET `/api/the-odds-api/sports/:sport/search`
Busca eventos por nombre de equipo.

**Query Parameters:**
- `team` (requerido): Nombre del equipo

**Ejemplo:**
```
GET /api/the-odds-api/sports/soccer/search?team=Real Madrid
```

---

## 💡 Casos de Uso

### 1. Comparar Cuotas y Encontrar Mejor

```typescript
// En tu servicio
const theOddsAPI = getTheOddsAPIService();
const comparison = await theOddsAPI.compareOdds('soccer', 'event_123', 'h2h');

// comparison.comparisons['Real Madrid'].bestBookmaker = "Betfair"
// comparison.comparisons['Real Madrid'].bestOdds = 2.15
```

### 2. Detectar Value Bets Automáticamente

```typescript
const valueBets = await theOddsAPI.detectValueBets(
  'soccer',
  'event_123',
  {
    'Real Madrid': 0.50, // Nuestra predicción ML
    'Barcelona': 0.30,
    'Draw': 0.20,
  },
  0.05 // Mínimo 5% de valor
);

// Retorna value bets con value >= 5%
```

### 3. Obtener Todas las Cuotas de un Deporte

```typescript
const odds = await theOddsAPI.getOdds('soccer', {
  regions: ['us', 'uk', 'eu'],
  markets: ['h2h', 'spreads', 'totals'],
});
```

---

## 🔒 Seguridad

- La API key se envía como query parameter (seguro con HTTPS)
- No requiere autenticación adicional
- Rate limiting según tu plan

---

## 📚 Documentación Oficial

- [The Odds API Docs](https://the-odds-api.com/liveapi/guides/v4/)
- [Getting Started](https://the-odds-api.com/liveapi/guides/getting-started/)
- [API Reference](https://the-odds-api.com/liveapi/guides/v4/api-reference/)

---

## 🐛 Troubleshooting

### Error: "The Odds API service not configured"
- Verifica que `THE_ODDS_API_KEY` esté en el `.env`
- Reinicia el backend

### Error: "401 Unauthorized"
- Verifica que la API key sea correcta
- Verifica que no hayas excedido el límite de requests

### Error: "429 Too Many Requests"
- Has excedido el límite de tu plan
- Espera o actualiza tu plan

---

## 🎯 Próximos Pasos

1. ✅ Obtener API key de The Odds API
2. ✅ Configurar en `.env`
3. ✅ Reiniciar backend
4. ✅ Probar endpoints
5. ✅ Integrar en frontend para comparación de cuotas real

---

## 💡 Ventajas vs Kalshi

| Característica | The Odds API | Kalshi |
|---------------|--------------|--------|
| Compara cuotas de casas | ✅ Sí | ❌ No |
| Bet365, Betfair, etc. | ✅ Sí | ❌ No |
| Value bets | ✅ Perfecto | ⚠️ Limitado |
| Deportes | ✅ Todos | ⚠️ No específico |
| Precio | $0-50/mes | Variable |
| **Útil para BETAPREDIT** | ✅✅✅ | ⚠️ Limitado |

---

¿Listo para usar! 🚀

