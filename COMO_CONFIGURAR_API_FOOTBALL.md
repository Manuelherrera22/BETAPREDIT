# ⚽ Cómo Configurar API-Football

## 📋 Paso 1: Obtener tu API Key

1. **Ve a**: https://www.api-football.com/
2. **Crea una cuenta** (si no tienes una)
3. **Ve a tu Dashboard**: https://dashboard.api-football.com/
4. **Copia tu API Key** (está en la sección "API Keys")

### Planes Disponibles:
- **Free**: 100 requests/día
- **Basic**: 300 requests/día ($9.99/mes)
- **Pro**: 10,000 requests/día ($29.99/mes)

---

## 📝 Paso 2: Agregar la API Key al .env

Abre `backend/.env` y agrega:

```env
API_FOOTBALL_KEY=tu_api_key_aqui
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_TIMEOUT=10000
```

**Ejemplo:**
```env
API_FOOTBALL_KEY=abc123def456ghi789jkl012mno345pqr678
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_TIMEOUT=10000
```

---

## 🧪 Paso 3: Reiniciar el Backend

Después de agregar la API key, **reinicia el backend**:

```bash
cd backend
npm run dev
```

---

## ✅ Paso 4: Probar que Funciona

Ejecuta el test:

```bash
node backend/scripts/test-complete-integrations.js
```

O prueba manualmente:

```bash
# Obtener fixtures de la Premier League
curl http://localhost:3000/api/api-football/fixtures?league=39&season=2024&next=5
```

---

## 📚 Endpoints Disponibles

Una vez configurado, puedes usar:

- `/api/api-football/fixtures` - Partidos
- `/api/api-football/head-to-head` - Historial entre equipos
- `/api/api-football/standings` - Tabla de posiciones
- `/api/api-football/teams` - Información de equipos
- `/api/api-football/players` - Estadísticas de jugadores
- `/api/api-football/injuries` - Lesiones y suspensiones

---

## 🔍 IDs Útiles de Ligas

- **Premier League**: 39
- **La Liga**: 140
- **Serie A**: 135
- **Bundesliga**: 78
- **Ligue 1**: 61
- **Champions League**: 2

---

## ⚠️ Notas Importantes

1. **Rate Limits**: El plan free tiene 100 requests/día
2. **Caching**: El sistema usa Redis para cachear respuestas
3. **Timeout**: Por defecto es 10 segundos
4. **Autenticación**: Solo necesitas la API key, NO login de usuario

---

## 🆘 Problemas Comunes

### "API-Football service not configured"
- Verifica que `API_FOOTBALL_KEY` esté en el `.env`
- Reinicia el backend después de agregar la key

### "401 Unauthorized"
- Tu API key es inválida o expiró
- Verifica que la copiaste correctamente (sin espacios)

### "429 Too Many Requests"
- Has excedido tu límite diario
- Espera hasta mañana o actualiza tu plan



