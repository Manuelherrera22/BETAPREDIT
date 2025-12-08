# 🔑 Cómo Obtener API Key de Kalshi

## 📋 Opción 1: Desde la Web UI (Primera vez - Más fácil)

### Paso 1: Crear cuenta
1. Ve a [https://kalshi.com](https://kalshi.com)
2. Crea una cuenta
3. Verifica tu email

### Paso 2: Generar API Key desde la Web
1. Inicia sesión en tu cuenta
2. Ve a **Configuración de la cuenta** → **Claves API**
3. Haz clic en **"Crear nueva clave API"** o **"Generate API Key"**
4. Ingresa un nombre (ej: "BETAPREDIT Integration")
5. **IMPORTANTE**: Copia inmediatamente:
   - **API Key ID** (esto es tu `KALSHI_API_KEY`)
   - **Private Key** (esto es tu `KALSHI_API_SECRET`)
6. ⚠️ **La private key NO se puede recuperar después**, guárdala bien

### Paso 3: Configurar en .env
```env
KALSHI_BASE_URL=https://api.elections.kalshi.com
KALSHI_API_KEY=tu_api_key_id_aqui
KALSHI_API_SECRET=-----BEGIN RSA PRIVATE KEY-----\nTu clave privada aquí\n-----END RSA PRIVATE KEY-----
```

---

## 📋 Opción 2: Usando la API (Programáticamente)

### Si ya tienes una API key existente:

1. **Agrega tus credenciales actuales al .env:**
   ```env
   KALSHI_BASE_URL=https://api.elections.kalshi.com
   KALSHI_API_KEY=tu_api_key_existente
   KALSHI_API_SECRET=tu_private_key_existente
   ```

2. **Ejecuta el script:**
   ```bash
   node backend/scripts/get-kalshi-api-key.js
   ```

3. **El script:**
   - Genera automáticamente un nuevo par de claves
   - Te muestra el `api_key_id` y `private_key`
   - Guarda la información en `kalshi_api_key.txt`

4. **Actualiza el .env con las nuevas credenciales**

---

## 📋 Opción 3: Usando cURL Manualmente

### Endpoint: POST `/api-keys/generate`

```bash
curl --request POST \
  --url https://api.elections.kalshi.com/trade-api/v2/api-keys/generate \
  --header 'Content-Type: application/json' \
  --header 'KALSHI-ACCESS-KEY: <tu_api_key_existente>' \
  --header 'KALSHI-ACCESS-SIGNATURE: <firma_rsa>' \
  --header 'KALSHI-ACCESS-TIMESTAMP: <timestamp>' \
  --data '{
    "name": "BETAPREDIT Integration"
  }'
```

**Respuesta:**
```json
{
  "api_key_id": "tu_nuevo_api_key_id",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
}
```

---

## 🎯 Recomendación

**Para la primera vez:** Usa la **Opción 1 (Web UI)** porque es más fácil y no necesitas autenticarte.

**Para generar más API keys:** Usa la **Opción 2 (Script)** una vez que tengas tu primera API key.

---

## ⚠️ Importante

1. **La private key NO se puede recuperar** - Guárdala de forma segura
2. **No compartas tus credenciales** - Son como contraseñas
3. **Usa diferentes API keys** para desarrollo y producción
4. **Rota las claves periódicamente** por seguridad

---

## 🔒 Formato de Private Key en .env

Puedes usar dos formatos:

**Formato 1: Con \n (recomendado)**
```env
KALSHI_API_SECRET=-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----
```

**Formato 2: Con saltos de línea reales**
```env
KALSHI_API_SECRET="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----"
```

---

## ✅ Verificar que funciona

Después de configurar, prueba el endpoint:

```bash
curl http://localhost:3000/api/kalshi/exchange/status
```

Si funciona, verás:
```json
{
  "success": true,
  "data": {
    "exchange_active": true,
    "trading_active": true
  }
}
```

---

¿Necesitas ayuda con algún paso específico? 🚀

