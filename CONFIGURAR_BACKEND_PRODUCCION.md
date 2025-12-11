# 🚀 Configurar Backend en Producción

## 📋 **SITUACIÓN ACTUAL**

El frontend está desplegado en Netlify (`betapredit.com`), pero el backend **NO está desplegado**, causando errores 405 cuando se intenta actualizar el perfil.

## ✅ **SOLUCIÓN: Desplegar Backend en Railway**

### **Paso 1: Crear Proyecto en Railway**

1. Ve a https://railway.app
2. Inicia sesión con GitHub
3. Click en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio `BETAPREDIT`
6. Selecciona el directorio `backend`

### **Paso 2: Configurar Variables de Entorno**

En Railway Dashboard → Variables, agrega:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:6543/postgres
JWT_SECRET=tu_jwt_secret_muy_seguro
FRONTEND_URL=https://betapredit.com
VITE_SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
THE_ODDS_API_KEY=tu_the_odds_api_key
ALL_SPORTS_API_KEY=tu_all_sports_api_key
```

### **Paso 3: Configurar Build y Start**

Railway debería detectar automáticamente:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

Si no, configúralo manualmente.

### **Paso 4: Obtener URL del Backend**

Railway generará una URL como:
```
https://betapredit-backend-production.up.railway.app
```

### **Paso 5: Configurar Proxy en Netlify**

1. Edita `netlify.toml`:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://betapredit-backend-production.up.railway.app/api/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify"}
```

2. O configura variable de entorno en Netlify:
   - `VITE_API_URL=https://betapredit-backend-production.up.railway.app/api`

### **Paso 6: Ejecutar Migraciones**

En Railway, ejecuta:
```bash
npx prisma migrate deploy
```

O agrega un script en `package.json`:
```json
"deploy": "prisma migrate deploy && npm start"
```

---

## 🔄 **ALTERNATIVA: Usar Variable de Entorno**

Si prefieres NO usar proxy, configura en Netlify:

1. Site settings → Environment variables
2. Agrega: `VITE_API_URL=https://tu-backend.railway.app/api`
3. Redeploy

El frontend usará esta URL directamente.

---

## ✅ **VERIFICACIÓN**

Después de desplegar:

1. Verifica que el backend responde: `https://tu-backend.railway.app/health`
2. Prueba actualizar perfil en producción
3. Verifica logs en Railway para errores

---

## 📝 **NOTAS**

- Railway ofrece plan gratuito con límites
- El backend debe estar corriendo 24/7 para producción
- Considera usar Supabase Edge Functions para reducir dependencia del backend



