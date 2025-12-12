# 🔐 Cómo Configurar Google OAuth para BETAPREDIT

## 📋 Requisitos Previos

1. Una cuenta de Google (Gmail)
2. Acceso a Google Cloud Console

---

## 🚀 Pasos para Configurar

### 1. Crear Proyecto en Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Haz clic en el selector de proyectos (arriba a la izquierda)
3. Haz clic en "NUEVO PROYECTO"
4. Ingresa un nombre: `BETAPREDIT` (o el que prefieras)
5. Haz clic en "CREAR"
6. Espera a que se cree el proyecto

---

### 2. Habilitar Google+ API

1. En el menú lateral, ve a **APIs & Services** → **Library**
2. Busca "Google+ API" o "People API"
3. Haz clic en "ENABLE"

**Nota:** Google+ API está deprecada, pero aún funciona. Alternativamente puedes usar "People API".

---

### 3. Configurar Pantalla de Consentimiento OAuth

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **External** (para usuarios externos)
3. Haz clic en **CREATE**
4. Completa el formulario:
   - **App name:** BETAPREDIT
   - **User support email:** Tu email
   - **Developer contact information:** Tu email
5. Haz clic en **SAVE AND CONTINUE**
6. En **Scopes**, haz clic en **ADD OR REMOVE SCOPES**
   - Selecciona:
     - `userinfo.email`
     - `userinfo.profile`
   - Haz clic en **UPDATE**
7. Haz clic en **SAVE AND CONTINUE**
8. En **Test users**, agrega tu email de prueba (opcional)
9. Haz clic en **SAVE AND CONTINUE**
10. Revisa y haz clic en **BACK TO DASHBOARD**

---

### 4. Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Selecciona **Web application**
4. Completa:
   - **Name:** BETAPREDIT Web Client
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (desarrollo)
     - `http://localhost:5173` (frontend desarrollo)
     - Tu URL de producción (ej: `https://betapredit.com`)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/oauth/google/callback` (desarrollo)
     - Tu URL de producción (ej: `https://api.betapredit.com/api/oauth/google/callback`)
5. Haz clic en **CREATE**
6. **¡IMPORTANTE!** Copia:
   - **Client ID** (lo necesitarás)
   - **Client secret** (lo necesitarás)

---

### 5. Configurar Variables de Entorno

Agrega estas variables a tu archivo `backend/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# Frontend URL (para redirecciones después de OAuth)
FRONTEND_URL=http://localhost:5173
```

**Para producción:**
```env
GOOGLE_CLIENT_ID=tu_client_id_produccion.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_produccion
GOOGLE_REDIRECT_URI=https://api.betapredit.com/api/oauth/google/callback
FRONTEND_URL=https://betapredit.com
```

---

### 6. Verificar que Funciona

1. Inicia el backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Inicia el frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Ve a: http://localhost:5173/login
4. Haz clic en "Continuar con Google"
5. Deberías ser redirigido a Google para autenticarte
6. Después de autenticarte, serás redirigido de vuelta a la aplicación

---

## 🔧 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa:** La URI de redirección no coincide con la configurada en Google Cloud Console.

**Solución:**
1. Ve a Google Cloud Console → Credentials
2. Edita tu OAuth 2.0 Client ID
3. Asegúrate de que la **Authorized redirect URI** sea exactamente:
   - `http://localhost:3000/api/oauth/google/callback` (desarrollo)
   - O tu URL de producción

### Error: "invalid_client"

**Causa:** El Client ID o Client Secret son incorrectos.

**Solución:**
1. Verifica que las variables de entorno estén correctas en `backend/.env`
2. Asegúrate de que no haya espacios extra
3. Reinicia el servidor backend

### Error: "access_denied"

**Causa:** El usuario canceló la autenticación o la app no está verificada.

**Solución:**
- Si estás en modo desarrollo, agrega tu email como "Test user" en OAuth consent screen
- Si estás en producción, necesitas verificar tu app con Google (proceso más largo)

---

## 📝 Notas Importantes

1. **Modo Desarrollo:**
   - Puedes usar hasta 100 usuarios de prueba
   - No necesitas verificar la app
   - La pantalla de consentimiento mostrará una advertencia

2. **Modo Producción:**
   - Necesitas verificar tu app con Google
   - Puede tomar varios días
   - Requiere información adicional (política de privacidad, términos de servicio, etc.)

3. **Seguridad:**
   - **NUNCA** compartas tu Client Secret
   - **NUNCA** lo subas a Git
   - Usa variables de entorno siempre

---

## ✅ Verificación Final

Una vez configurado, deberías poder:

- ✅ Ver el botón "Continuar con Google" en Login y Register
- ✅ Ser redirigido a Google al hacer clic
- ✅ Autenticarte con tu cuenta de Google
- ✅ Ser redirigido de vuelta a la app
- ✅ Iniciar sesión automáticamente

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:

1. Verifica los logs del backend
2. Revisa la consola del navegador
3. Verifica que todas las URLs estén correctas
4. Asegúrate de que el backend esté corriendo en el puerto correcto

---

## 📚 Recursos Adicionales

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)





