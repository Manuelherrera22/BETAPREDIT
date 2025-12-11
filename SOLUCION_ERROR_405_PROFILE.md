# 🔧 Solución Error 405 (Method Not Allowed) - Perfil

## ❌ **PROBLEMA**

El error `PUT https://betapredit.com/api/user/profile 405 (Method Not Allowed)` indica que:

1. **El backend no está desplegado** o no está accesible desde producción
2. **Netlify no tiene configurado un proxy** para redirigir peticiones `/api/*` al backend

## ✅ **SOLUCIONES**

### **Opción 1: Desplegar Backend y Configurar Proxy (RECOMENDADO)**

#### **Paso 1: Desplegar Backend**

Puedes usar:
- **Railway** (recomendado): https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io
- **Heroku**: https://heroku.com

#### **Paso 2: Configurar Proxy en Netlify**

1. Edita `netlify.toml` y reemplaza `YOUR_BACKEND_URL` con la URL de tu backend desplegado:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://tu-backend.railway.app/api/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify"}
```

2. Haz commit y push:
```bash
git add netlify.toml
git commit -m "fix: Agregar proxy para API en Netlify"
git push
```

3. Netlify hará redeploy automáticamente

#### **Paso 3: Configurar Variable de Entorno (Alternativa)**

Si prefieres usar variable de entorno en lugar de proxy:

1. En Netlify Dashboard → Site settings → Environment variables
2. Agrega: `VITE_API_URL=https://tu-backend.railway.app/api`
3. Redeploy

---

### **Opción 2: Usar Supabase para Perfil (TEMPORAL)**

Si no puedes desplegar el backend ahora, podemos migrar el perfil a Supabase:

1. Crear tabla en Supabase para perfil de usuario
2. Usar Supabase Edge Functions para actualizar perfil
3. Actualizar frontend para usar Supabase directamente

**Nota:** Esta opción requiere cambios en el código.

---

## 🎯 **RECOMENDACIÓN**

**Usa la Opción 1** - Despliega el backend en Railway (es gratis para empezar) y configura el proxy en Netlify.

### **Pasos Rápidos para Railway:**

1. Ve a https://railway.app
2. Crea cuenta y nuevo proyecto
3. Conecta tu repositorio de GitHub
4. Selecciona el directorio `backend`
5. Railway detectará automáticamente Node.js
6. Agrega variables de entorno:
   - `DATABASE_URL` (tu Supabase connection string)
   - `JWT_SECRET`
   - `FRONTEND_URL=https://betapredit.com`
   - Otras variables necesarias
7. Railway generará una URL como: `https://betapredit-backend.railway.app`
8. Usa esa URL en el proxy de Netlify

---

## 📋 **CHECKLIST**

- [ ] Backend desplegado en Railway/Render/etc.
- [ ] URL del backend obtenida
- [ ] `netlify.toml` actualizado con la URL del backend
- [ ] Commit y push realizado
- [ ] Netlify redeploy completado
- [ ] Probar actualizar perfil en producción

---

## ⚠️ **IMPORTANTE**

El proxy de Netlify solo funciona para peticiones GET/POST/PUT/DELETE estándar. Si tienes problemas, considera:

1. Usar variable de entorno `VITE_API_URL` en lugar de proxy
2. Desplegar el backend en el mismo dominio (subdominio)
3. Usar Supabase Edge Functions para todas las operaciones



