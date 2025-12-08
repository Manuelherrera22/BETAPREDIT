# Configuración de Supabase Auth para Google OAuth

## URLs Necesarias en Supabase Dashboard

### 1. Site URL
**URL:** `http://localhost:5173` (desarrollo) o `https://tu-dominio.com` (producción)

Esta es la URL base de tu aplicación frontend.

### 2. Redirect URLs (Authorized Redirect URIs)

Debes agregar **TODAS** estas URLs en la sección "Redirect URLs" de Supabase:

#### Para Desarrollo Local:
```
http://localhost:5173/auth/callback
http://localhost:3000/api/oauth/google/callback
http://localhost:5173
```

#### Para Producción:
```
https://tu-dominio-frontend.com/auth/callback
https://tu-dominio-backend.com/api/oauth/google/callback
https://tu-dominio-frontend.com
```

### 3. Configuración en Google Cloud Console

También necesitas agregar estas URLs en Google Cloud Console:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita tu OAuth 2.0 Client ID
3. En "Authorized redirect URIs", agrega:
   - `http://localhost:3000/api/oauth/google/callback` (desarrollo)
   - `https://tu-dominio-backend.com/api/oauth/google/callback` (producción)

### 4. Variables de Entorno

#### Backend (.env):
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

#### Frontend (.env):
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Flujo de OAuth

1. Usuario hace clic en "Continuar con Google"
2. Frontend llama a: `GET /api/oauth/google`
3. Backend genera URL de Google OAuth
4. Usuario es redirigido a Google para autenticación
5. Google redirige a: `http://localhost:3000/api/oauth/google/callback`
6. Backend procesa el callback y redirige a: `http://localhost:5173/auth/callback?token=...`
7. Frontend procesa el token y completa el login

## Verificación

Para verificar que todo está configurado:

1. **Backend:**
   ```bash
   cd backend
   npm run verify-oauth
   ```

2. **Probar endpoint:**
   ```bash
   curl http://localhost:3000/api/oauth/google
   ```

3. **Verificar en navegador:**
   - Abre: `http://localhost:3000/api/oauth/google`
   - Deberías ver un JSON con `authUrl`

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que la URI en `.env` coincida exactamente con la de Google Cloud Console
- Verifica que esté en la lista de Redirect URLs de Supabase

### Error: "No se pudo conectar con el servidor"
- Verifica que el backend esté corriendo: `npm run dev` en `backend/`
- Verifica que `VITE_API_URL` esté configurado en `frontend/.env`

### Error: "Google OAuth no está configurado"
- Verifica que `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, y `GOOGLE_REDIRECT_URI` estén en `backend/.env`

