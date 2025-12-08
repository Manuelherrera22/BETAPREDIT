# ✅ Checklist de Despliegue en Netlify

## Pre-requisitos ✅

- [x] Build funciona correctamente (`npm run build` en frontend)
- [x] Archivo `netlify.toml` configurado
- [x] Archivo `frontend/public/_redirects` para SPA routing
- [x] Variables de entorno configuradas en código
- [x] Código commiteado y pusheado a repositorio

## Pasos para Desplegar en Netlify

### 1. Conectar Repositorio
- [ ] Ir a [Netlify Dashboard](https://app.netlify.com)
- [ ] Click en "Add new site" → "Import an existing project"
- [ ] Seleccionar tu proveedor (GitHub/GitLab/Bitbucket)
- [ ] Autorizar acceso al repositorio
- [ ] Seleccionar el repositorio `BETAPREDIT`

### 2. Configuración de Build (Automática)
Netlify detectará automáticamente `netlify.toml`:
- **Base directory:** (vacío)
- **Build command:** `cd frontend && npm install && npm run build`
- **Publish directory:** `frontend/dist`

### 3. Variables de Entorno (Opcional)
Si tienes backend desplegado:
- [ ] Ir a "Site settings" → "Environment variables"
- [ ] Agregar: `VITE_API_URL` = `https://tu-backend-url.com/api`

### 4. Deploy
- [ ] Click en "Deploy site"
- [ ] Esperar a que el build complete
- [ ] Verificar que el sitio funcione

## Verificación Post-Deploy

- [ ] El sitio carga correctamente
- [ ] Las rutas funcionan (navegar entre páginas)
- [ ] El login funciona (modo demo)
- [ ] Los datos mock se muestran correctamente
- [ ] Las animaciones funcionan
- [ ] El diseño responsive funciona en móvil

## Troubleshooting

### Build Falla
1. Verificar logs en Netlify
2. Asegurarse de que Node.js 18 esté disponible
3. Verificar que todas las dependencias estén en `package.json`

### 404 en Rutas
1. Verificar que `frontend/public/_redirects` esté presente
2. Verificar configuración en `netlify.toml`

### API No Funciona
1. Verificar variable `VITE_API_URL` en Netlify
2. Verificar CORS en backend
3. El frontend funcionará en modo demo sin backend

## URLs Importantes

- **Netlify Dashboard:** https://app.netlify.com
- **Documentación Netlify:** https://docs.netlify.com
- **Guía de Despliegue:** Ver `NETLIFY_DEPLOY.md`

## Notas Finales

- El frontend funciona completamente en modo demo sin backend
- El modo demo permite login con cualquier credencial
- Todos los datos son mock y se actualizan automáticamente
- El sitio es completamente responsive

