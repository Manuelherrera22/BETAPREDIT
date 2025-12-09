# ⚡ Solución Rápida: Comparador de Cuotas en Producción

## 🎯 Problema
El comparador de cuotas no muestra datos porque el backend no está desplegado.

## ✅ Solución Rápida (5 minutos)

### Opción A: Desplegar Backend en Railway (RECOMENDADO)

#### Paso 1: Crear cuenta en Railway
1. Ve a https://railway.app
2. Click en "Login" → "Login with GitHub"
3. Autoriza Railway

#### Paso 2: Desplegar Backend
1. Click en "New Project"
2. "Deploy from GitHub repo"
3. Selecciona tu repositorio `BETAPREDIT`
4. Railway detectará automáticamente `backend/`

#### Paso 3: Configurar Variables
En Railway → Tu servicio → Variables, agrega:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
THE_ODDS_API_KEY=tu_api_key
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://betapredit.com
JWT_SECRET=tu_secret_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_seguro
```

#### Paso 4: Obtener URL del Backend
1. Railway te dará una URL como: `https://betapredit-production.up.railway.app`
2. **Copia esta URL**

#### Paso 5: Configurar Netlify
1. Ve a https://app.netlify.com
2. Tu sitio → "Site settings" → "Environment variables"
3. Agrega:
   ```
   VITE_API_URL=https://betapredit-production.up.railway.app/api
   ```
   **IMPORTANTE**: Agrega `/api` al final

4. "Deploys" → "Trigger deploy" → "Deploy site"

#### Paso 6: Verificar
1. Abre https://betapredit.com/odds-comparison
2. Deberías ver los deportes y eventos

---

### Opción B: Usar Render (Alternativa)

1. Ve a https://render.com
2. "New" → "Web Service"
3. Conecta tu repositorio
4. Configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Agrega las mismas variables de entorno
6. Render te dará una URL como: `https://betapredit-backend.onrender.com`
7. Agrega `VITE_API_URL=https://betapredit-backend.onrender.com/api` en Netlify

---

## 🚨 Si No Puedes Desplegar Ahora

### Solución Temporal: The Odds API Directo

Puedo modificar el frontend para usar The Odds API directamente (sin backend), pero:
- ❌ No guardará datos en Supabase
- ❌ No funcionará para endpoints que requieren autenticación
- ✅ Funcionará inmediatamente

¿Quieres que implemente esta solución temporal?

---

## 📋 Checklist

- [ ] Backend desplegado en Railway/Render
- [ ] Variables de entorno configuradas
- [ ] URL del backend obtenida
- [ ] `VITE_API_URL` configurado en Netlify
- [ ] Frontend redeployado
- [ ] Comparador funcionando en producción

