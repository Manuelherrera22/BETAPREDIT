# 🚀 Guía de Despliegue en Netlify

## Configuración Automática

El proyecto ya está configurado con `netlify.toml` para despliegue automático.

### Configuración en Netlify

1. **Conectar el repositorio:**
   - Ve a [Netlify](https://app.netlify.com)
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket

2. **Configuración de Build (ya está en netlify.toml):**
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/dist`
   - **Node version:** 18

3. **Variables de Entorno (opcional):**
   - Si tienes un backend desplegado, agrega:
     - `VITE_API_URL` = `https://tu-backend-url.com/api`
   - Si no, el frontend usará rutas relativas `/api`

## Configuración Manual (si prefieres)

Si prefieres configurar manualmente en el dashboard de Netlify:

### Build Settings:
- **Base directory:** (dejar vacío)
- **Build command:** `cd frontend && npm install && npm run build`
- **Publish directory:** `frontend/dist`

### Environment Variables:
```
NODE_VERSION=18
VITE_API_URL=https://tu-backend-url.com/api (opcional)
```

## Verificación del Build

Para verificar que el build funciona localmente:

```bash
cd frontend
npm install
npm run build
```

El resultado estará en `frontend/dist/`

## Notas Importantes

1. **SPA Routing:** El archivo `frontend/public/_redirects` asegura que todas las rutas redirijan a `index.html` para React Router.

2. **API Backend:** 
   - Si no tienes backend desplegado, el frontend funcionará en modo demo con datos mock
   - Para conectar con un backend, configura `VITE_API_URL` en las variables de entorno de Netlify

3. **Modo Demo:**
   - El sistema permite login con cualquier credencial en modo desarrollo
   - En producción, se requiere autenticación real

## Troubleshooting

### Error: "Build failed"
- Verifica que Node.js 18 esté disponible
- Revisa los logs de build en Netlify
- Asegúrate de que `package.json` tenga todos los scripts necesarios

### Error: "404 en rutas"
- Verifica que `frontend/public/_redirects` esté presente
- Asegúrate de que `netlify.toml` tenga la configuración de redirects

### Error: "API no funciona"
- Verifica la variable `VITE_API_URL` en Netlify
- Asegúrate de que el backend tenga CORS configurado correctamente

## Próximos Pasos

1. Despliega el backend en Heroku, Railway, o similar
2. Configura `VITE_API_URL` en Netlify apuntando a tu backend
3. Configura dominio personalizado si lo deseas

