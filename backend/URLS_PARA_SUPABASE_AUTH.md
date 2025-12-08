# 🔗 URLs para Configurar en Supabase Auth

## 📋 URLs que DEBES Agregar

### 1. Site URL
**Valor:** `http://localhost:5173` (desarrollo)

Esta es la URL base de tu aplicación frontend.

---

### 2. Redirect URLs (Authorized Redirect URIs)

Agrega **TODAS** estas URLs en la sección "Redirect URLs":

#### Para Desarrollo Local:
```
http://localhost:5173/auth/callback
http://localhost:3000/api/oauth/google/callback
http://localhost:5173
http://localhost:5173/login
http://localhost:5173/register
```

#### Para Producción (cuando despliegues):
```
https://tu-dominio.com/auth/callback
https://api.tu-dominio.com/api/oauth/google/callback
https://tu-dominio.com
https://tu-dominio.com/login
https://tu-dominio.com/register
```

---

## 🎯 Cómo Agregar las URLs

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Ve a **Authentication** → **URL Configuration**
3. En **Site URL**, ingresa: `http://localhost:5173`
4. En **Redirect URLs**, haz clic en **"Add URL"** y agrega cada una de las URLs de arriba
5. Guarda los cambios

---

## ⚠️ IMPORTANTE

Estas URLs también deben estar configuradas en:

### Google Cloud Console:
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita tu OAuth 2.0 Client ID
3. En **"Authorized redirect URIs"**, agrega:
   - `http://localhost:3000/api/oauth/google/callback` (desarrollo)
   - `https://api.tu-dominio.com/api/oauth/google/callback` (producción)

---

## 🔄 Flujo Actual

1. Usuario hace clic en "Continuar con Google"
2. Frontend → Backend: `GET /api/oauth/google`
3. Backend genera URL de Google OAuth
4. Usuario es redirigido a Google
5. Google redirige a: `http://localhost:3000/api/oauth/google/callback`
6. Backend procesa y redirige a: `http://localhost:5173/auth/callback?token=...`
7. Frontend procesa el token

---

## 📝 Nota sobre "Backend 100% en Supabase"

Actualmente el backend usa:
- ✅ **Supabase Database** (PostgreSQL) - Ya configurado
- ❌ **Autenticación manual** con Google OAuth

Si quieres migrar a **Supabase Auth** completamente, necesitarías:
- Usar `@supabase/supabase-js` en el backend
- Usar Supabase Auth en lugar de la implementación manual de OAuth
- Esto simplificaría mucho la configuración

¿Quieres que migre el sistema de autenticación a Supabase Auth?

