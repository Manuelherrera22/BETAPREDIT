# 🔧 Solución: Comparador de Cuotas en Producción

## ❌ Problema Actual

El comparador de cuotas no muestra datos en producción (`betapredit.com`) porque:
1. El frontend está desplegado en Netlify
2. El backend NO está desplegado
3. El frontend intenta hacer requests a `/api` que no existe en Netlify

## ✅ Soluciones Posibles

### Opción 1: Desplegar Backend (RECOMENDADO)

#### 1.1 Railway (Gratis para empezar)
1. Ve a https://railway.app
2. Crea una cuenta
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Selecciona el directorio `backend`
6. Railway detectará automáticamente que es Node.js
7. Agrega las variables de entorno:
   ```
   DATABASE_URL=postgresql://...
   THE_ODDS_API_KEY=tu_key
   SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_ANON_KEY=...
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://betapredit.com
   ```
8. Railway te dará una URL como: `https://tu-proyecto.railway.app`
9. Agrega esta URL a Netlify como `VITE_API_URL`

#### 1.2 Render (Alternativa)
1. Ve a https://render.com
2. Crea una cuenta
3. "New" → "Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Name**: `betapredit-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Agrega las variables de entorno
7. Render te dará una URL como: `https://betapredit-backend.onrender.com`
8. Agrega esta URL a Netlify como `VITE_API_URL`

### Opción 2: Netlify Functions (Alternativa Temporal)

Si no puedes desplegar el backend ahora, puedes crear funciones serverless en Netlify:

1. Crea `netlify/functions/the-odds-api.js`
2. Esta función hará proxy a The Odds API directamente
3. **Limitación**: Solo funcionará para APIs públicas, no para endpoints que requieren base de datos

### Opción 3: Configurar Proxy en Netlify (Más Complejo)

1. Crea `netlify.toml` en la raíz del proyecto
2. Configura redirects para hacer proxy al backend
3. **Limitación**: Requiere que el backend esté desplegado en algún lugar

---

## 🚀 Pasos Inmediatos (Opción 1 - Railway)

### Paso 1: Desplegar Backend en Railway

1. **Crear cuenta en Railway:**
   - Ve a https://railway.app
   - Inicia sesión con GitHub

2. **Crear nuevo proyecto:**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona tu repositorio `BETAPREDIT`

3. **Configurar servicio:**
   - Railway detectará automáticamente el directorio `backend`
   - Si no, configura:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

4. **Agregar variables de entorno:**
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
   THE_ODDS_API_KEY=tu_api_key
   SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   SUPABASE_ANON_KEY=tu_anon_key
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://betapredit.com
   JWT_SECRET=tu_jwt_secret
   JWT_REFRESH_SECRET=tu_refresh_secret
   ```

5. **Obtener URL del backend:**
   - Railway te dará una URL como: `https://betapredit-production.up.railway.app`
   - Copia esta URL

### Paso 2: Configurar Frontend en Netlify

1. **Ve a Netlify Dashboard:**
   - https://app.netlify.com
   - Selecciona tu sitio `betapredit`

2. **Agregar Variable de Entorno:**
   - Ve a "Site settings" → "Environment variables"
   - Agrega:
     ```
     VITE_API_URL=https://betapredit-production.up.railway.app/api
     ```
   - **IMPORTANTE**: Agrega `/api` al final de la URL

3. **Redeploy:**
   - Ve a "Deploys"
   - Click en "Trigger deploy" → "Deploy site"

### Paso 3: Verificar

1. Abre `https://betapredit.com/odds-comparison`
2. Abre la consola del navegador (F12)
3. Verifica que:
   - `API Base URL` muestre la URL de Railway
   - No haya errores de CORS
   - Los deportes se carguen correctamente

---

## 🔍 Verificación de Errores

### Si los deportes no se cargan:

1. **Abre la consola del navegador (F12)**
2. **Ve a la pestaña "Network"**
3. **Intenta cargar la página**
4. **Busca requests a `/api/the-odds-api/sports`**
5. **Verifica:**
   - ¿El request se está haciendo a la URL correcta?
   - ¿Hay errores de CORS?
   - ¿El backend está respondiendo?

### Errores Comunes:

1. **CORS Error:**
   - El backend debe tener `FRONTEND_URL=https://betapredit.com` configurado
   - Verifica que Railway tenga esta variable

2. **404 Not Found:**
   - Verifica que `VITE_API_URL` tenga `/api` al final
   - Verifica que el backend esté corriendo en Railway

3. **Network Error:**
   - Verifica que el backend esté desplegado y funcionando
   - Prueba la URL del backend directamente: `https://tu-backend.railway.app/api/the-odds-api/sports`

---

## 📝 Checklist

- [ ] Backend desplegado en Railway/Render
- [ ] Variables de entorno configuradas en Railway
- [ ] `VITE_API_URL` configurado en Netlify
- [ ] `FRONTEND_URL` configurado en Railway
- [ ] Backend respondiendo correctamente
- [ ] Frontend redeployado en Netlify
- [ ] Comparador de cuotas funcionando en producción

---

## 🚨 Si No Puedes Desplegar el Backend Ahora

### Solución Temporal: Usar The Odds API Directamente

Puedes modificar el frontend para usar The Odds API directamente (sin backend):

1. **Limitación**: No guardará datos en Supabase
2. **Limitación**: No funcionará para endpoints que requieren autenticación
3. **Ventaja**: Funcionará inmediatamente

¿Quieres que implemente esta solución temporal mientras desplegamos el backend?



