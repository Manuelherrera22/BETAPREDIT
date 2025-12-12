# 🔐 Configuración Completa de Supabase Auth

## 📋 Variables de Entorno Necesarias

### Backend (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Database (ya configurado)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Supabase Configuration
VITE_SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

---

## 🔑 Cómo Obtener las Keys de Supabase

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Ve a **Settings** → **API**
3. Encuentra:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` (frontend)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (backend) ⚠️ **SECRETO**

---

## 🔗 Configuración en Supabase Dashboard

### 1. Authentication → URL Configuration

#### Site URL:
```
http://localhost:5173
```

#### Redirect URLs (agrega todas):
```
http://localhost:5173/auth/callback
http://localhost:5173
http://localhost:5173/login
http://localhost:5173/register
```

### 2. Authentication → Providers → Google

1. Habilita **Google** provider
2. Agrega tu **Client ID** y **Client Secret** de Google Cloud Console
3. Guarda los cambios

**Nota:** Ya NO necesitas configurar URLs de redirección en Google Cloud Console cuando usas Supabase Auth. Supabase maneja eso automáticamente.

---

## 🎯 Flujo con Supabase Auth

1. Usuario hace clic en "Continuar con Google"
2. Frontend → Supabase: `signInWithOAuth({ provider: 'google' })`
3. Usuario es redirigido a Google
4. Google redirige a: `http://localhost:5173/auth/callback?code=...`
5. Frontend intercambia código por sesión: `exchangeCodeForSession(code)`
6. Frontend sincroniza usuario con backend: `POST /api/auth/supabase/sync`
7. Backend crea/actualiza usuario en nuestra DB
8. Usuario autenticado ✅

---

## ✅ Ventajas de Supabase Auth

1. **Menos configuración:** No necesitas manejar URLs de redirección manualmente
2. **Más seguro:** Supabase maneja tokens y sesiones
3. **Múltiples proveedores:** Fácil agregar más (GitHub, Facebook, etc.)
4. **Gestión de sesiones:** Supabase maneja refresh tokens automáticamente
5. **Email verification:** Incluido automáticamente

---

## 🔄 Migración Completada

El sistema ahora:
- ✅ Usa Supabase Auth cuando está configurado
- ✅ Hace fallback a OAuth manual si Supabase no está configurado
- ✅ Sincroniza usuarios de Supabase con nuestra base de datos
- ✅ Mantiene compatibilidad con el sistema anterior

---

## 🧪 Prueba la Configuración

1. **Verifica variables de entorno:**
   ```bash
   cd backend
   npm run verify-oauth
   ```

2. **Inicia el backend:**
   ```bash
   npm run dev
   ```

3. **Inicia el frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

4. **Prueba el login con Google**

---

## 📝 Notas Importantes

- **Service Role Key** es SECRETO - nunca lo expongas en el frontend
- **Anon Key** es seguro para el frontend
- Supabase Auth maneja automáticamente las URLs de redirección
- No necesitas configurar `GOOGLE_REDIRECT_URI` cuando usas Supabase Auth




