# 🔧 Solución: Error 400 redirect_uri_mismatch

## ❌ Error Actual

```
Error 400: redirect_uri_mismatch
Acceso bloqueado: La solicitud de esta app no es válida
```

Este error significa que la URL de redirección que Supabase está enviando a Google **NO está en la lista de URLs autorizadas** en Google Cloud Console.

---

## 🔍 ¿Qué URL está usando Supabase?

Cuando usas Supabase Auth con Google OAuth, Supabase maneja las URLs automáticamente. La URL que Supabase usa es:

```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback
```

Esta es la URL que Supabase usa internamente para recibir el callback de Google, y luego Supabase redirige a tu frontend.

---

## ✅ Solución: Agregar URL en Google Cloud Console

### Paso 1: Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto (o el proyecto donde está tu OAuth Client ID)
3. Ve a **APIs & Services** → **Credentials**
4. Busca tu **OAuth 2.0 Client ID** (el que tiene el Client ID: `40911110211-kird31hq5j2t435ummv8mu20fge7pn5p.apps.googleusercontent.com`)
5. Haz clic en el **lápiz** (editar) para editar el cliente

### Paso 2: Agregar URL de Supabase

1. En la sección **"Authorized redirect URIs"**, haz clic en **"+ ADD URI"**
2. Agrega esta URL:
   ```
   https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback
   ```
3. Haz clic en **"SAVE"**

### Paso 3: Verificar URLs Existentes

Asegúrate de que también tengas estas URLs (si las necesitas para desarrollo):

```
http://localhost:3000/api/oauth/google/callback
https://betapredit.com/auth/callback
https://www.betapredit.com/auth/callback
```

**Pero la más importante es:**
```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback
```

---

## 📋 Lista Completa de URLs para Google Cloud Console

Agrega **TODAS** estas URLs en "Authorized redirect URIs":

### URLs de Supabase (REQUERIDAS):
```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback
```

### URLs de Producción (si las necesitas):
```
https://betapredit.com/auth/callback
https://www.betapredit.com/auth/callback
```

### URLs de Desarrollo (opcional):
```
http://localhost:3000/api/oauth/google/callback
http://localhost:5173/auth/callback
```

---

## 🔍 Verificar en Supabase Dashboard

También verifica que en Supabase Dashboard estén configuradas:

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. **Authentication** → **URL Configuration**
3. **Site URL:** `https://betapredit.com`
4. **Redirect URLs:**
   - `https://betapredit.com/auth/callback`
   - `https://www.betapredit.com/auth/callback`

---

## 🧪 Probar Después de Configurar

1. **Guarda los cambios en Google Cloud Console**
2. **Espera 1-2 minutos** (puede tomar tiempo para propagarse)
3. **Intenta hacer login con Google nuevamente**
4. Debería funcionar

---

## ❌ Si Aún No Funciona

### Verificar que el Client ID sea Correcto

1. En Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Verifica que el **Client ID** sea: `40911110211-kird31hq5j2t435ummv8mu20fge7pn5p.apps.googleusercontent.com`
3. Verifica que el **Client Secret** sea correcto

### Verificar el Project ID de Supabase

La URL de callback debe usar tu Project ID correcto:
- Project ID: `mdjzqxhjbisnlfpbjfgb`
- URL: `https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback`

---

## 📝 Checklist

- [ ] URL `https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback` agregada en Google Cloud Console
- [ ] Cambios guardados en Google Cloud Console
- [ ] Esperado 1-2 minutos para propagación
- [ ] Probado login con Google nuevamente
- [ ] URLs también configuradas en Supabase Dashboard

---

## 💡 Nota Importante

**Cuando usas Supabase Auth, NO necesitas configurar las URLs de tu frontend en Google Cloud Console.**

Supabase actúa como intermediario:
1. Tu frontend → Supabase: `signInWithOAuth()`
2. Supabase → Google: Redirige a Google con su propia URL de callback
3. Google → Supabase: Redirige a `https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback`
4. Supabase → Tu frontend: Redirige a `https://betapredit.com/auth/callback`

Por eso solo necesitas la URL de Supabase en Google Cloud Console.

---

¡Después de agregar la URL de Supabase en Google Cloud Console, el login debería funcionar! 🚀




