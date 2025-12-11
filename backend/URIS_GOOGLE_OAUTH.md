# 🔗 URIs para Google OAuth - BETAPREDIT

## 📋 URIs para Configurar en Google Cloud Console

### 1. Orígenes Autorizados de JavaScript (Authorized JavaScript Origins)

**Para Desarrollo:**
```
http://localhost:5173
http://localhost:3000
```

**Para Producción:**
```
https://betapredit.com
https://www.betapredit.com
```

---

### 2. URIs de Redireccionamiento Autorizados (Authorized Redirect URIs)

**Para Desarrollo:**
```
http://localhost:3000/api/oauth/google/callback
```

**Para Producción (si backend y frontend están en el mismo dominio):**
```
https://betapredit.com/api/oauth/google/callback
https://www.betapredit.com/api/oauth/google/callback
```

**Para Producción (si backend está en subdominio separado):**
```
https://api.betapredit.com/api/oauth/google/callback
```

---

## 🎯 Configuración Recomendada

### Opción 1: Backend y Frontend en el mismo dominio (betapredit.com)

**Orígenes Autorizados de JavaScript:**
```
https://betapredit.com
https://www.betapredit.com
http://localhost:5173
http://localhost:3000
```

**URIs de Redireccionamiento Autorizados:**
```
https://betapredit.com/api/oauth/google/callback
https://www.betapredit.com/api/oauth/google/callback
http://localhost:3000/api/oauth/google/callback
```

---

### Opción 2: Backend en subdominio (api.betapredit.com)

**Orígenes Autorizados de JavaScript:**
```
https://betapredit.com
https://www.betapredit.com
http://localhost:5173
```

**URIs de Redireccionamiento Autorizados:**
```
https://api.betapredit.com/api/oauth/google/callback
http://localhost:3000/api/oauth/google/callback
```

---

## 📝 Variables de Entorno Correspondientes

### Para Desarrollo (backend/.env):
```env
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Para Producción (backend/.env):
```env
# Si backend y frontend están en el mismo dominio:
GOOGLE_REDIRECT_URI=https://betapredit.com/api/oauth/google/callback
FRONTEND_URL=https://betapredit.com

# O si backend está en subdominio:
GOOGLE_REDIRECT_URI=https://api.betapredit.com/api/oauth/google/callback
FRONTEND_URL=https://betapredit.com
```

---

## ✅ Checklist

- [ ] Agregar todas las URIs de desarrollo
- [ ] Agregar todas las URIs de producción
- [ ] Verificar que no haya espacios extra
- [ ] Verificar que las URLs terminen correctamente (sin / al final, excepto en el path)
- [ ] Guardar los cambios en Google Cloud Console
- [ ] Actualizar las variables de entorno en backend/.env
- [ ] Reiniciar el backend

---

## ⚠️ Importante

1. **No agregues espacios** antes o después de las URIs
2. **Usa https://** para producción (nunca http://)
3. **Usa http://** solo para localhost en desarrollo
4. **No agregues** la barra final (/) después del path, excepto si es parte del path
5. **Guarda los cambios** en Google Cloud Console antes de probar

---

## 🔍 Verificación

Después de configurar, verifica que:

1. Las URIs en Google Cloud Console coincidan exactamente con las de tu `.env`
2. El backend esté corriendo en el puerto correcto
3. El frontend esté corriendo en el puerto correcto
4. No haya errores de CORS



