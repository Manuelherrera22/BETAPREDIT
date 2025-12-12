# 🚀 Guía Rápida: Desplegar Backend en Railway

## ⚡ Pasos Rápidos (5 minutos)

### 1. Crear Cuenta en Railway
- Ve a https://railway.app
- Click en "Login" → "Login with GitHub"
- Autoriza Railway

### 2. Crear Proyecto
1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Selecciona tu repositorio `BETAPREDIT`
4. Railway detectará automáticamente el directorio `backend`

### 3. Configurar Variables de Entorno

En Railway, ve a tu servicio → "Variables" y agrega:

```env
# Base de datos
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key

# The Odds API
THE_ODDS_API_KEY=tu_api_key

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_muy_seguro

# Configuración
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://betapredit.com
BACKEND_URL=https://tu-proyecto.railway.app
```

### 4. Obtener URL del Backend

1. En Railway, ve a tu servicio
2. Click en "Settings"
3. Busca "Public Domain" o "Generate Domain"
4. Railway te dará una URL como: `https://betapredit-production.up.railway.app`
5. **Copia esta URL**

### 5. Configurar Netlify

1. Ve a https://app.netlify.com
2. Selecciona tu sitio `betapredit`
3. Ve a "Site settings" → "Environment variables"
4. Agrega:
   ```
   VITE_API_URL=https://betapredit-production.up.railway.app/api
   ```
   **IMPORTANTE**: Agrega `/api` al final

5. Ve a "Deploys" → "Trigger deploy" → "Deploy site"

### 6. Verificar

1. Abre `https://betapredit.com/odds-comparison`
2. Abre la consola (F12)
3. Deberías ver:
   - `API Base URL: https://betapredit-production.up.railway.app/api`
   - Los deportes cargándose
   - Los eventos apareciendo

---

## 🔧 Configuración Adicional en Railway

### Build Settings (si Railway no detecta automáticamente):

- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Health Check:

Railway verificará automáticamente que el servicio esté funcionando.

---

## 🐛 Troubleshooting

### El backend no inicia:
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Railway
- Verifica que `DATABASE_URL` sea correcta

### CORS Error:
- Verifica que `FRONTEND_URL=https://betapredit.com` esté en Railway
- Verifica que `BACKEND_URL` sea la URL de Railway

### 404 en `/api`:
- Verifica que `VITE_API_URL` tenga `/api` al final
- Verifica que el backend esté corriendo

---

## 📊 Verificar que Funciona

### Test Manual:
```bash
# Probar que el backend responde
curl https://tu-backend.railway.app/api/the-odds-api/sports

# Debería retornar JSON con deportes
```

### Test desde Frontend:
1. Abre `https://betapredit.com/odds-comparison`
2. Abre la consola (F12)
3. Deberías ver requests exitosos a `/api/the-odds-api/sports`




