# 🔄 CI/CD Workflows - BETAPREDIT

Este directorio contiene los workflows de GitHub Actions para CI/CD.

## 📋 Workflows Disponibles

### 1. **ci.yml** - Continuous Integration
**Trigger:** Pull Requests y pushes a `main`, `master`, `develop`

**Jobs:**
- ✅ **Lint** - Verifica código con ESLint (backend y frontend)
- ✅ **Test Backend** - Ejecuta tests del backend con cobertura
- ✅ **Test Frontend** - Ejecuta tests del frontend con cobertura
- ✅ **Build Backend** - Verifica que el backend compile correctamente
- ✅ **Build Frontend** - Verifica que el frontend compile correctamente
- ✅ **Security** - Escaneo básico de vulnerabilidades (npm audit)
- ✅ **Quality Gates** - Resumen final de todas las verificaciones

**Cobertura Mínima:**
- Backend: 50%
- Frontend: 40%

---

### 2. **deploy-staging.yml** - Deploy a Staging
**Trigger:** Push a `develop` o manual (workflow_dispatch)

**Jobs:**
- 🚀 **Deploy Edge Functions** - Despliega Edge Functions a Supabase (staging)
- 🚀 **Deploy Frontend** - Despliega frontend a Netlify (staging)

**Requisitos:**
- Secrets configurados en GitHub:
  - `SUPABASE_ACCESS_TOKEN` - Token de acceso de Supabase
  - `NETLIFY_SITE_ID_STAGING` - Site ID de Netlify para staging
  - `VITE_SUPABASE_URL` - URL de Supabase
  - `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
  - `VITE_API_URL_STAGING` - URL del API (opcional, usa Edge Functions)

---

### 3. **deploy-production.yml** - Deploy a Producción
**Trigger:** Push a `main`/`master` o manual con confirmación

**Jobs:**
- ✅ **Pre-Deployment Checks** - Verificaciones antes de deployar
- 🚀 **Deploy Edge Functions** - Despliega Edge Functions a Supabase (producción)
- 🚀 **Deploy Frontend** - Despliega frontend a Netlify (producción)
- ✅ **Post-Deployment Verification** - Verificaciones después del deploy

**Seguridad:**
- Requiere confirmación manual para deployment
- Health checks después del deploy
- Notificaciones a Slack (opcional)

**Requisitos:**
- Secrets configurados en GitHub:
  - `SUPABASE_ACCESS_TOKEN` - Token de acceso de Supabase
  - `NETLIFY_SITE_ID_PRODUCTION` - Site ID de Netlify para producción
  - `VITE_SUPABASE_URL` - URL de Supabase
  - `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
  - `SLACK_WEBHOOK_URL` (opcional)

---

## 🔐 Configuración de Secrets

### En GitHub:
1. Ve a tu repositorio
2. **Settings** → **Secrets and variables** → **Actions**
3. Agrega los siguientes secrets:

#### Supabase (Edge Functions)
```
SUPABASE_ACCESS_TOKEN=tu_supabase_access_token
```
**Cómo obtener:**
1. Ve a https://supabase.com/dashboard/account/tokens
2. Genera un nuevo access token
3. Agrega como secret en GitHub

#### Netlify (Frontend)
```
NETLIFY_AUTH_TOKEN=nfp_AoU3hMmYfrijsaWDCCr62vcAgkJDTQ4p88b1
NETLIFY_SITE_ID_STAGING=tu_site_id_staging
NETLIFY_SITE_ID_PRODUCTION=tu_site_id_production
```
**Nota:** El token de Netlify ya está configurado en los workflows. Solo necesitas agregar los SITE_ID.

#### Variables de Entorno
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_API_URL_STAGING=https://backend-staging.railway.app/api
VITE_API_URL_PRODUCTION=https://backend-production.railway.app/api
```

#### Notificaciones (Opcional)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 🚀 Flujo de Trabajo Recomendado

### Desarrollo
1. Crear branch desde `develop`
2. Hacer cambios
3. Crear Pull Request a `develop`
4. CI se ejecuta automáticamente
5. Si pasa, merge a `develop`
6. Auto-deploy a staging

### Producción
1. Merge `develop` → `main`
2. CI se ejecuta automáticamente
3. Si pasa, se puede hacer deploy manual a producción
4. O configurar auto-deploy (recomendado solo después de pruebas)

---

## 📊 Quality Gates

Para que un PR sea mergeable, debe pasar:
- ✅ Linting (sin errores)
- ✅ Tests (todos pasando)
- ✅ Build (sin errores)
- ✅ Cobertura mínima (Backend: 50%, Frontend: 40%)
- ✅ Security scan (sin vulnerabilidades críticas)

---

## 🔧 Troubleshooting

### Tests fallan en CI pero pasan localmente
- Verificar que las variables de entorno estén configuradas
- Verificar que la base de datos de test esté disponible
- Revisar logs del workflow

### Build falla
- Verificar que todas las dependencias estén en `package.json`
- Verificar que no haya errores de TypeScript
- Revisar logs del build

### Deployment falla
- Verificar que los secrets estén configurados
- Verificar que las URLs de los servicios sean correctas
- Revisar logs del deployment

---

## 📝 Notas

- Los workflows usan Node.js 18
- Los tests usan PostgreSQL 15 en un servicio de GitHub Actions
- Los deployments requieren confirmación manual para producción
- Las notificaciones a Slack son opcionales

---

**Última actualización:** Enero 2025
