# ✅ Verificar Variables de Entorno en Netlify

## 🔍 **Problema: Error 401 en Edge Function**

El error 401 indica que `VITE_SUPABASE_ANON_KEY` probablemente **NO está configurada** en Netlify.

## 📋 **Pasos para Verificar y Configurar**

### **1. Ir a Netlify Dashboard**

1. Ve a: https://app.netlify.com
2. Selecciona tu sitio (betapredit)
3. Ve a **Site settings** → **Environment variables**

### **2. Verificar Variables**

Debes tener estas variables configuradas:

```
VITE_SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
```

### **3. Si NO Existen, Agregarlas**

1. Click en **"Add a variable"**
2. **Key**: `VITE_SUPABASE_URL`
3. **Value**: `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
4. Click **"Add variable"**
5. Repite para `VITE_SUPABASE_ANON_KEY`

### **4. Redesplegar el Sitio**

Después de agregar las variables:

1. Ve a **Deploys**
2. Click en **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Espera a que termine el deploy

---

## 🧪 **Verificar que Funciona**

Después del redeploy:

1. Abre https://betapredit.com
2. Abre la consola (F12)
3. Deberías ver: `✅ Supabase configured:`
4. NO deberías ver: `❌ Supabase not configured!`
5. Ve a la página de Arbitraje
6. NO deberías ver errores 401

---

## 📝 **Nota Importante**

- Las variables que empiezan con `VITE_` son **públicas** (se incluyen en el bundle)
- Esto es **normal y seguro** para `VITE_SUPABASE_ANON_KEY` (es la clave pública)
- La clave privada (`SUPABASE_SERVICE_ROLE_KEY`) **NUNCA** debe estar en el frontend

---

**¿Ya verificaste las variables en Netlify?** Si no están, agrégalas y redesplega.




