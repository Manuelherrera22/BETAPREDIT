# 🔧 Agregar Variables de Entorno en Producción

## ❌ Problema Detectado

Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` **NO están configuradas** en tu plataforma de hosting.

---

## ✅ Solución: Agregar Variables en tu Hosting

### Si usas Vercel:

1. **Ve a tu proyecto en Vercel:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto `BETAPREDIT`

2. **Ve a Settings:**
   - Click en **Settings** (en el menú superior)
   - Click en **Environment Variables** (en el menú lateral)

3. **Agrega las variables:**
   - Click en **Add New**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
   - **Environment:** Selecciona **Production**, **Preview**, y **Development**
   - Click en **Save**

   - Click en **Add New** (otra vez)
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0`
   - **Environment:** Selecciona **Production**, **Preview**, y **Development**
   - Click en **Save**

4. **Redeploy:**
   - Ve a la pestaña **Deployments**
   - Click en los **3 puntos** del último deployment
   - Click en **Redeploy**
   - O simplemente haz un nuevo commit y push (Vercel redeploy automáticamente)

---

### Si usas Netlify:

1. **Ve a tu sitio en Netlify:**
   - https://app.netlify.com
   - Selecciona tu sitio `BETAPREDIT`

2. **Ve a Site settings:**
   - Click en **Site settings** (en el menú superior)
   - Click en **Environment variables** (en el menú lateral)

3. **Agrega las variables:**
   - Click en **Add a variable**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
   - Click en **Save**

   - Click en **Add a variable** (otra vez)
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0`
   - Click en **Save**

4. **Redeploy:**
   - Ve a la pestaña **Deploys**
   - Click en **Trigger deploy** → **Deploy site**
   - O haz un nuevo commit y push

---

### Si usas otra plataforma (Railway, Render, etc.):

1. Busca la sección de **Environment Variables** o **Config Vars**
2. Agrega:
   - `VITE_SUPABASE_URL` = `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0`
3. **Redeploy** el sitio

---

## ⚠️ IMPORTANTE

**Las variables de entorno solo se cargan durante el BUILD.**

Después de agregar las variables, **DEBES hacer redeploy** para que se carguen.

---

## ✅ Verificación

Después del redeploy:

1. Abre https://betapredit.com
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   ✅ Supabase configured: { url: 'https://mdjzqxhjbisnlfpbjfgb.supabase.co...', hasKey: true, keyLength: 208 }
   ```

4. Intenta hacer login con Google
5. Deberías ver:
   ```
   ✅ Using Supabase Auth (no backend needed)
   ```

---

## 📋 Checklist

- [ ] Variables agregadas en la plataforma de hosting
- [ ] Redeploy realizado
- [ ] Consola muestra `✅ Supabase configured`
- [ ] Login con Google funciona

---

## 🆘 Si aún no funciona

1. **Verifica que las variables empiecen con `VITE_`**
   - ✅ Correcto: `VITE_SUPABASE_URL`
   - ❌ Incorrecto: `SUPABASE_URL`

2. **Verifica que el redeploy se haya completado**
   - Espera a que el build termine
   - Verifica que el deployment esté en "Ready"

3. **Limpia la caché del navegador**
   - Ctrl+Shift+R (hard refresh)
   - O abre en modo incógnito

4. **Verifica en la consola:**
   ```javascript
   console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'MISSING');
   ```

---

¡Después de agregar las variables y hacer redeploy, el login con Google debería funcionar! 🚀





