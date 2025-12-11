# 🔍 Verificar Variables de Entorno en Producción

## ❌ Error Actual

```
Error: No se pudo conectar con el servidor. Verifica que el backend esté corriendo en /api
```

Este error indica que:
1. El frontend está intentando usar el backend en lugar de Supabase Auth
2. Las variables de entorno de Supabase no están configuradas en producción

---

## ✅ Solución

### Paso 1: Verificar Variables de Entorno en tu Plataforma de Hosting

#### Si usas Vercel:
1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Verifica que estén configuradas:
   - `VITE_SUPABASE_URL` = `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0`

#### Si usas Netlify:
1. Ve a tu sitio en Netlify
2. **Site settings** → **Environment variables**
3. Agrega las mismas variables

#### Si usas otra plataforma:
Busca la sección de "Environment Variables" o "Config Vars" y agrega las variables.

---

### Paso 2: Reiniciar el Deployment

**IMPORTANTE:** Después de agregar o modificar variables de entorno, debes:
1. **Redeploy** el sitio (o esperar al siguiente deploy automático)
2. Las variables de entorno solo se cargan durante el build

---

### Paso 3: Verificar que las Variables se Cargaron

1. Abre https://betapredit.com
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   ✅ Supabase configured: { url: 'https://mdjzqxhjbisnlfpbjfgb.supabase.co...', hasKey: true }
   ```

Si ves el warning `⚠️ Supabase not configured`, las variables no están cargadas.

---

## 🔧 Cómo Verificar en el Código

El frontend verifica las variables así:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**Nota:** Las variables deben empezar con `VITE_` para que Vite las incluya en el build.

---

## ❌ Errores Comunes

### Error: "No se pudo conectar con el servidor en /api"
**Causa:** `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no están configuradas
**Solución:** Agrega las variables en tu plataforma de hosting y redeploy

### Error: "Supabase not configured"
**Causa:** Las variables no están disponibles en runtime
**Solución:** 
1. Verifica que las variables empiecen con `VITE_`
2. Redeploy el sitio
3. Verifica que no haya errores de build

### El login funciona en localhost pero no en producción
**Causa:** Las variables están en `.env` local pero no en el hosting
**Solución:** Agrega las variables en la plataforma de hosting

---

## 📝 Checklist

- [ ] Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` agregadas en hosting
- [ ] Deployment reiniciado después de agregar variables
- [ ] Consola del navegador muestra "✅ Supabase configured"
- [ ] No hay errores de "Supabase not configured"
- [ ] El login con Google funciona

---

## 🧪 Test Rápido

Abre la consola del navegador en https://betapredit.com y ejecuta:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NO CONFIGURADA');
```

Si ambos muestran valores, las variables están cargadas. Si muestran `undefined`, no están configuradas.



