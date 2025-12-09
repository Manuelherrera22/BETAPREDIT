# 🔧 Solución: Error 401 en Edge Function

## ❌ **Problema**

La Edge Function retorna `401 (Unauthorized)` cuando se intenta acceder desde el frontend.

## 🔍 **Causa**

Las Edge Functions de Supabase requieren autenticación por defecto. Aunque estamos enviando el `Authorization: Bearer <anon_key>`, puede que la función necesite estar configurada como pública.

## ✅ **Soluciones**

### **Opción 1: Configurar Función como Pública (Recomendado)**

En el dashboard de Supabase:

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/functions
2. Click en la función `the-odds-api`
3. Ve a **Settings** → **Authentication**
4. Marca **"Public function"** o desactiva **"Require JWT verification"**
5. Guarda los cambios

### **Opción 2: Verificar Variables de Entorno en Netlify**

Asegúrate de que `VITE_SUPABASE_ANON_KEY` esté configurado correctamente en Netlify:

1. Ve a Netlify Dashboard
2. Tu sitio → **Site settings** → **Environment variables**
3. Verifica que `VITE_SUPABASE_ANON_KEY` tenga el valor correcto:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
   ```

### **Opción 3: Usar Header `apikey` en lugar de `Authorization`**

El frontend ya está enviando ambos headers, pero si persiste el error, puedes verificar en la consola del navegador qué headers se están enviando.

---

## 🧪 **Verificar que Funciona**

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Busca una petición a `supabase.co/functions/v1/the-odds-api`
4. Verifica que:
   - El header `Authorization` esté presente
   - El header `apikey` esté presente (si lo agregamos)
   - La respuesta no sea 401

---

## 📝 **Nota Importante**

La función fue desplegada con `--no-verify-jwt`, lo que debería permitir que funcione sin verificación estricta de JWT. Si el error persiste, es probable que necesites configurarla como pública en el dashboard de Supabase.

---

**Última actualización**: 2025-12-09

