# 🚀 Configuración de Supabase Auth para Producción (betapredit.com)

## 📋 URLs de Producción

### Frontend
- **URL:** https://betapredit.com
- **Callback URL:** https://betapredit.com/auth/callback

### Backend (API)
- **URL:** https://api.betapredit.com (o la URL que uses)
- **Callback URL:** https://api.betapredit.com/api/oauth/google/callback

---

## 🔧 Configuración en Supabase Dashboard

### Paso 1: Configurar Google OAuth Provider

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. **Authentication** → **Providers** → **Google**
3. Habilita **Google**
4. Completa:
   - **Client ID:** `40911110211-kird31hq5j2t435ummv8mu20fge7pn5p.apps.googleusercontent.com`
   - **Client Secret:** `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`
5. **Save**

### Paso 2: Configurar URLs de Producción

1. **Authentication** → **URL Configuration**
2. **Site URL** (producción):
   ```
   https://betapredit.com
   ```
3. **Redirect URLs** (agrega todas):
   ```
   https://betapredit.com/auth/callback
   https://betapredit.com
   https://betapredit.com/login
   https://betapredit.com/register
   ```

**Nota:** Si también quieres mantener localhost para desarrollo, agrega ambas:
- `http://localhost:5173/auth/callback` (desarrollo)
- `https://betapredit.com/auth/callback` (producción)

---

## 🔑 Variables de Entorno de Producción

### Backend (Vercel/Netlify/Railway/etc.)

```env
# Supabase
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
SUPABASE_SERVICE_ROLE_KEY=sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys

# URLs de Producción
FRONTEND_URL=https://betapredit.com
BACKEND_URL=https://api.betapredit.com
```

### Frontend (Vercel/Netlify/etc.)

```env
# API
VITE_API_URL=https://api.betapredit.com/api

# Supabase
VITE_SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
```

---

## 🔄 Configuración en Google Cloud Console

También necesitas actualizar las URLs de redirección en Google Cloud Console:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita tu OAuth 2.0 Client ID
3. En **"Authorized redirect URIs"**, agrega:
   ```
   https://api.betapredit.com/api/oauth/google/callback
   ```
   (Si usas Supabase Auth, esto puede no ser necesario, pero es bueno tenerlo)

---

## 🧪 Verificar Configuración

### 1. Verificar que las URLs estén en Supabase

```bash
# Verifica que las URLs de producción estén en Supabase Dashboard
# Authentication → URL Configuration
```

### 2. Verificar variables de entorno en producción

Asegúrate de que las variables estén configuradas en tu plataforma de hosting:
- **Vercel:** Settings → Environment Variables
- **Netlify:** Site settings → Environment variables
- **Railway:** Variables tab

### 3. Probar el flujo completo

1. Ve a: https://betapredit.com
2. Haz clic en "Continuar con Google"
3. Deberías ser redirigido a Google
4. Después de autenticarte, deberías volver a `https://betapredit.com/auth/callback`

---

## ❌ Troubleshooting Producción

### Error: "redirect_uri_mismatch"

**Causa:** La URL de redirección no está en la lista de Supabase o Google Cloud Console.

**Solución:**
1. Verifica que `https://betapredit.com/auth/callback` esté en Supabase Dashboard
2. Verifica que `FRONTEND_URL` en backend sea `https://betapredit.com`
3. Verifica que `VITE_SUPABASE_URL` en frontend sea correcta

### Error: "Supabase Auth not configured"

**Causa:** Las variables de entorno no están configuradas en producción.

**Solución:**
1. Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén en las variables de entorno del backend
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén en las variables de entorno del frontend
3. **Reinicia el deployment** después de agregar las variables

### Error: "No se pudo conectar con el servidor"

**Causa:** El frontend está intentando conectarse a una URL incorrecta.

**Solución:**
1. Verifica que `VITE_API_URL` en frontend sea `https://api.betapredit.com/api`
2. Verifica que el backend esté accesible en esa URL
3. Verifica CORS en el backend para permitir `https://betapredit.com`

### El login funciona en localhost pero no en producción

**Causa:** Las URLs de producción no están configuradas en Supabase.

**Solución:**
1. Agrega `https://betapredit.com/auth/callback` a Redirect URLs en Supabase
2. Cambia Site URL a `https://betapredit.com` en Supabase
3. Verifica que `FRONTEND_URL` en backend sea `https://betapredit.com`

---

## 📝 Checklist de Producción

- [ ] Google OAuth habilitado en Supabase Dashboard
- [ ] Client ID y Secret configurados en Supabase
- [ ] Site URL configurada a `https://betapredit.com` en Supabase
- [ ] Redirect URLs incluyen `https://betapredit.com/auth/callback`
- [ ] Variables de entorno del backend configuradas en hosting
- [ ] Variables de entorno del frontend configuradas en hosting
- [ ] `FRONTEND_URL` en backend apunta a `https://betapredit.com`
- [ ] `VITE_API_URL` en frontend apunta a la URL del backend
- [ ] CORS configurado en backend para permitir `https://betapredit.com`
- [ ] Deployment reiniciado después de agregar variables
- [ ] Login con Google probado en producción

---

## 🔄 Actualizar desde Desarrollo a Producción

Si ya tienes todo funcionando en localhost:

1. **Agrega las URLs de producción en Supabase** (no reemplaces, agrega)
2. **Configura las variables de entorno en tu plataforma de hosting**
3. **Reinicia los deployments**
4. **Prueba el flujo completo**

---

¡Listo! Tu sistema debería funcionar en producción 🚀



