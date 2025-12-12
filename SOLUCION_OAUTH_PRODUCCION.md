# 🔧 Solución para OAuth en Producción (betapredit.com)

## ❌ Problemas Detectados

### 1. URLs Faltantes en Supabase Dashboard

En tu configuración actual, faltan estas URLs críticas:

**Faltantes:**
- ❌ `https://betapredit.com/auth/callback` (sin www)
- ❌ `https://www.betapredit.com/auth/callback` (con www)

**Ya configuradas:**
- ✅ `https://www.betapredit.com`
- ✅ `http://www.betapredit.com/auth/callback` (pero es HTTP, no HTTPS)

### 2. Site URL con Barra Final

Tu Site URL actual: `https://betapredit.com/` (tiene barra al final)
**Debería ser:** `https://betapredit.com` (sin barra)

---

## ✅ Solución Paso a Paso

### Paso 1: Corregir Site URL

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. **Authentication** → **URL Configuration**
3. En **Site URL**, cambia:
   - ❌ `https://betapredit.com/`
   - ✅ `https://betapredit.com` (sin barra final)
4. Haz clic en **"Save changes"**

### Paso 2: Agregar URLs de Callback Faltantes

1. En la misma página, sección **Redirect URLs**
2. Haz clic en **"Add URL"**
3. Agrega estas URLs (una por una):
   ```
   https://betapredit.com/auth/callback
   https://www.betapredit.com/auth/callback
   ```
4. Guarda los cambios

### Paso 3: Verificar Variables de Entorno en Producción

Asegúrate de que estas variables estén configuradas en tu plataforma de hosting:

#### Frontend (Vercel/Netlify):
```env
VITE_SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
VITE_API_URL=https://api.betapredit.com/api
```

#### Backend (si está desplegado):
```env
FRONTEND_URL=https://betapredit.com
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys
```

---

## 🧪 Verificar que Funciona

### 1. Verificar en Consola del Navegador

1. Abre https://betapredit.com
2. Abre la consola del navegador (F12)
3. Intenta hacer login con Google
4. Revisa los errores en la consola

### 2. Verificar en Network Tab

1. Abre la pestaña **Network** en DevTools
2. Filtra por "oauth" o "auth"
3. Intenta hacer login
4. Revisa las peticiones y sus respuestas

### 3. Errores Comunes

#### Error: "redirect_uri_mismatch"
**Causa:** La URL de callback no está en la lista de Supabase
**Solución:** Agrega `https://betapredit.com/auth/callback` a Redirect URLs

#### Error: "Supabase Auth not configured"
**Causa:** Variables de entorno no configuradas en producción
**Solución:** Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén en tu plataforma de hosting

#### Error: "No se pudo conectar con el servidor"
**Causa:** El frontend no puede conectarse al backend
**Solución:** Verifica que `VITE_API_URL` esté configurado correctamente

---

## 📋 Checklist Final

- [ ] Site URL cambiado a `https://betapredit.com` (sin barra)
- [ ] `https://betapredit.com/auth/callback` agregado a Redirect URLs
- [ ] `https://www.betapredit.com/auth/callback` agregado a Redirect URLs
- [ ] Variables de entorno configuradas en hosting (frontend)
- [ ] Variables de entorno configuradas en hosting (backend, si aplica)
- [ ] Deployment reiniciado después de agregar variables
- [ ] Probado el login en https://betapredit.com

---

## 🔍 Debug Adicional

Si aún no funciona después de estos pasos:

1. **Revisa la consola del navegador** para ver errores específicos
2. **Revisa los logs del backend** (si está desplegado)
3. **Verifica que Supabase Auth esté habilitado** en el dashboard
4. **Verifica que Google OAuth esté configurado** en Supabase

---

## 💡 Nota Importante

El frontend usa `window.location.origin` automáticamente, así que:
- En `https://betapredit.com` → usará `https://betapredit.com/auth/callback`
- En `https://www.betapredit.com` → usará `https://www.betapredit.com/auth/callback`

Por eso necesitas **ambas URLs** en la lista de Redirect URLs.




