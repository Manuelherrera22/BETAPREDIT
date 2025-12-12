# 🔧 Configurar Variables de Entorno en Netlify

## 📋 Paso a Paso para Netlify

### Paso 1: Acceder a tu Sitio en Netlify

1. Ve a: https://app.netlify.com
2. Inicia sesión con tu cuenta
3. Selecciona tu sitio **BETAPREDIT** (o el nombre que tenga)

---

### Paso 2: Ir a Site Settings

1. En la página de tu sitio, haz clic en **"Site settings"** (en el menú superior)
2. O haz clic en el icono de **⚙️ Settings** en la barra lateral

---

### Paso 3: Ir a Environment Variables

1. En el menú lateral izquierdo, busca y haz clic en **"Environment variables"**
2. O ve directamente a: `https://app.netlify.com/sites/[TU-SITIO]/configuration/env`

---

### Paso 4: Agregar Primera Variable

1. Haz clic en el botón **"Add a variable"** (o **"Add variable"**)
2. En el campo **"Key"**, escribe:
   ```
   VITE_SUPABASE_URL
   ```
3. En el campo **"Value"**, pega:
   ```
   https://mdjzqxhjbisnlfpbjfgb.supabase.co
   ```
4. **IMPORTANTE:** Asegúrate de que el **"Scope"** esté configurado para:
   - ✅ **Production**
   - ✅ **Deploy previews**
   - ✅ **Branch deploys** (opcional, pero recomendado)
5. Haz clic en **"Save"** o **"Add variable"**

---

### Paso 5: Agregar Segunda Variable

1. Haz clic en **"Add a variable"** nuevamente
2. En el campo **"Key"**, escribe:
   ```
   VITE_SUPABASE_ANON_KEY
   ```
3. En el campo **"Value"**, pega:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
   ```
4. Asegúrate de que el **"Scope"** esté configurado igual que antes
5. Haz clic en **"Save"** o **"Add variable"**

---

### Paso 6: Verificar Variables Agregadas

Deberías ver una lista con:
- ✅ `VITE_SUPABASE_URL` = `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...` (mostrará los primeros caracteres)

---

### Paso 7: Hacer Redeploy

**⚠️ CRÍTICO:** Las variables de entorno solo se cargan durante el BUILD. Debes hacer redeploy.

#### Opción 1: Redeploy Manual
1. Ve a la pestaña **"Deploys"** (en el menú superior)
2. Encuentra el último deployment
3. Haz clic en los **3 puntos** (⋯) a la derecha
4. Selecciona **"Trigger deploy"** → **"Deploy site"**
5. Espera a que el build termine

#### Opción 2: Redeploy Automático
1. Haz un pequeño cambio en tu código (o simplemente haz commit y push)
2. Netlify detectará el cambio y hará deploy automáticamente
3. Las nuevas variables estarán disponibles en este nuevo build

---

## ✅ Verificación

Después del redeploy:

1. **Abre tu sitio:** https://betapredit.com
2. **Abre la consola del navegador:** Presiona `F12` o `Ctrl+Shift+I`
3. **Ve a la pestaña "Console"**
4. **Deberías ver:**
   ```
   ✅ Supabase configured: { url: 'https://mdjzqxhjbisnlfpbjfgb.supabase.co...', hasKey: true, keyLength: 208 }
   ```

5. **Intenta hacer login con Google**
6. **Deberías ver:**
   ```
   ✅ Using Supabase Auth (no backend needed)
   ```

---

## 🔍 Verificar Variables en Netlify

Si quieres verificar que las variables están configuradas:

1. Ve a **Site settings** → **Environment variables**
2. Deberías ver ambas variables listadas
3. Puedes hacer clic en el icono de **👁️** para ver el valor (parcialmente oculto por seguridad)

---

## ❌ Troubleshooting

### Las variables no aparecen después del deploy

**Causa:** Las variables se agregan pero el deploy anterior ya estaba en proceso.

**Solución:**
1. Espera a que el deploy actual termine
2. Haz un nuevo deploy (Trigger deploy → Deploy site)
3. O haz un pequeño cambio y push para trigger un nuevo deploy

### Sigo viendo "Supabase not configured"

**Causa 1:** Las variables no están en el scope correcto
- **Solución:** Verifica que estén en "Production" scope

**Causa 2:** El deploy no se ha completado
- **Solución:** Espera a que el build termine y verifica que esté en estado "Published"

**Causa 3:** Las variables tienen nombres incorrectos
- **Solución:** Verifica que empiecen con `VITE_` (no `SUPABASE_URL`, sino `VITE_SUPABASE_URL`)

### El build falla después de agregar variables

**Causa:** Puede haber un error de sintaxis en los valores

**Solución:**
1. Verifica que no haya espacios extra al inicio o final
2. Verifica que las URLs estén completas
3. Revisa los logs del build en Netlify

---

## 📝 Checklist Final

- [ ] Variables `VITE_SUPABASE_URL` agregada en Netlify
- [ ] Variable `VITE_SUPABASE_ANON_KEY` agregada en Netlify
- [ ] Ambas variables tienen scope "Production"
- [ ] Redeploy realizado
- [ ] Build completado exitosamente
- [ ] Consola muestra `✅ Supabase configured`
- [ ] Login con Google funciona

---

## 🎯 Resumen Rápido

1. **Netlify Dashboard** → Tu sitio → **Site settings**
2. **Environment variables** → **Add a variable**
3. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. **Deploys** → **Trigger deploy** → **Deploy site**
5. Espera y verifica en la consola

---

¡Después de estos pasos, el login con Google debería funcionar! 🚀




