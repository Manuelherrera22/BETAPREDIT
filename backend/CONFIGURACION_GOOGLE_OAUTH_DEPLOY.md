# Configuración de Google OAuth para Deploy

## Variables de Entorno Necesarias

Para que Google OAuth funcione correctamente en producción, necesitas configurar las siguientes variables de entorno:

### Backend (.env)

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://tu-dominio-backend.com/api/oauth/google/callback

# Frontend URL (para redirecciones después del login)
FRONTEND_URL=https://tu-dominio-frontend.com
```

### Frontend (.env)

```env
VITE_API_URL=https://tu-dominio-backend.com
```

## Configuración en Google Cloud Console

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Selecciona tu proyecto**
3. **Ve a "APIs & Services" > "Credentials"**
4. **Edita tu OAuth 2.0 Client ID**

### URIs de Redirección Autorizadas

Debes agregar **AMBAS** URIs (desarrollo y producción):

```
# Desarrollo (localhost)
http://localhost:3000/api/oauth/google/callback

# Producción (tu dominio)
https://tu-dominio-backend.com/api/oauth/google/callback
```

### Orígenes JavaScript Autorizados

```
# Desarrollo
http://localhost:5173

# Producción
https://tu-dominio-frontend.com
```

## Verificación

1. **Backend debe estar accesible públicamente** (no solo localhost)
2. **El endpoint `/api/oauth/google/callback` debe ser accesible**
3. **Las variables de entorno deben estar configuradas en tu plataforma de deploy**

## Ejemplo de Configuración por Plataforma

### Vercel (Frontend)
```env
VITE_API_URL=https://api.tu-dominio.com
```

### Railway / Render / Heroku (Backend)
```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=https://api.tu-dominio.com/api/oauth/google/callback
FRONTEND_URL=https://tu-dominio.com
```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que la URI en `.env` coincida exactamente con la configurada en Google Cloud Console
- Asegúrate de incluir el protocolo (`https://`) y la ruta completa

### Error: "invalid_client"
- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
- Asegúrate de que las variables de entorno estén cargadas en producción

### No redirige después del login
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que el frontend esté accesible en esa URL




