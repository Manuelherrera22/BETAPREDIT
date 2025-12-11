# 🎯 Configuración Final de Supabase Auth

## ✅ Variables de Entorno Configuradas

### Backend (.env)
```env
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 Configuración en Supabase Dashboard

### Paso 1: Configurar Google OAuth Provider

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. En el menú izquierdo, ve a **Authentication** → **Providers**
3. Busca **Google** en la lista de proveedores
4. Haz clic en **Google** para configurarlo
5. Habilita el toggle **"Enable Google provider"**
6. Completa los campos:
   - **Client ID (for OAuth):** `40911110211-kird31hq5j2t435ummv8mu20fge7pn5p.apps.googleusercontent.com`
   - **Client Secret (for OAuth):** `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`
7. Haz clic en **Save**

### Paso 2: Configurar URLs de Redirección

1. En el mismo dashboard, ve a **Authentication** → **URL Configuration**
2. En **Site URL**, ingresa:
   ```
   http://localhost:5173
   ```
3. En **Redirect URLs**, haz clic en **"Add URL"** y agrega:
   ```
   http://localhost:5173/auth/callback
   ```
4. Haz clic en **Save changes**

---

## 🚀 Iniciar los Servidores

### Backend
```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Supabase Admin client initialized
✅ Supabase Client initialized
✅ Connected to Supabase database successfully
```

### Frontend
```bash
cd frontend
npm run dev
```

---

## 🧪 Probar el Login con Google

1. Abre: http://localhost:5173
2. Ve a la página de Login
3. Haz clic en **"Continuar con Google"**
4. Deberías ser redirigido a Google para autenticación
5. Después de autenticarte, serás redirigido de vuelta a la aplicación

---

## 🔍 Verificar que Funciona

### Verificar en Backend
```bash
cd backend
node scripts/test-supabase-connection.js
```

### Verificar en Frontend
Abre la consola del navegador (F12) y verifica que no haya errores relacionados con Supabase.

---

## ❌ Troubleshooting

### Error: "Supabase Auth not configured"
- Verifica que las variables de entorno estén en `.env`
- Reinicia el servidor después de agregar las variables

### Error: "redirect_uri_mismatch"
- Verifica que la URL de redirección esté en Supabase Dashboard
- Verifica que `FRONTEND_URL` en backend/.env sea `http://localhost:5173`

### Error: "Google OAuth not configured"
- Verifica que Google esté habilitado en Supabase Dashboard
- Verifica que Client ID y Secret sean correctos

### El login no redirige correctamente
- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén en frontend/.env
- Reinicia el servidor de desarrollo del frontend

---

## 📝 Notas Importantes

1. **Service Role Key es SECRETO**: Nunca lo expongas en el frontend
2. **Anon Key es seguro**: Puede estar en el frontend
3. **URLs de desarrollo**: Para producción, cambia las URLs a tu dominio
4. **Reiniciar servidores**: Siempre reinicia después de cambiar variables de entorno

---

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en backend/.env
- [ ] Variables de entorno configuradas en frontend/.env
- [ ] Google OAuth habilitado en Supabase Dashboard
- [ ] Client ID y Secret configurados en Supabase
- [ ] Site URL configurada en Supabase
- [ ] Redirect URLs configuradas en Supabase
- [ ] Backend reiniciado
- [ ] Frontend reiniciado
- [ ] Login con Google probado y funcionando

---

¡Listo! Tu sistema ahora está 100% en Supabase (Database + Auth) 🎉



