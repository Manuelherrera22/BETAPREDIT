# 🔐 Configuración de Secrets en GitHub

## 📋 Secrets Requeridos

Para que los workflows funcionen correctamente, necesitas configurar los siguientes secrets en GitHub:

### 1. Supabase Access Token

**Nombre:** `SUPABASE_ACCESS_TOKEN`

**Cómo obtenerlo:**
1. Ve a https://supabase.com/dashboard/account/tokens
2. Click en "Generate new token"
3. Copia el token generado
4. Agrega como secret en GitHub: Settings → Secrets and variables → Actions → New repository secret

**Uso:** Para desplegar Edge Functions a Supabase

---

### 2. Netlify Site ID

**Nombre:** `NETLIFY_ID` (o `NETLIFY_SITE_ID_STAGING` y `NETLIFY_SITE_ID_PRODUCTION` separados)

**Cómo obtenerlo:**
1. Ve a https://app.netlify.com
2. Selecciona tu sitio
3. Ve a **Site settings** → **General**
4. Copia el **Site ID** (formato: `xxxx-xxxx-xxxx`)
5. Agrega como secret `NETLIFY_ID` en GitHub

**Nota:** 
- El token de Netlify (`nfp_AoU3hMmYfrijsaWDCCr62vcAgkJDTQ4p88b1`) ya está configurado en los workflows
- Si usas el mismo Site ID para staging y producción, solo necesitas `NETLIFY_ID`
- Si tienes sitios separados, usa `NETLIFY_SITE_ID_STAGING` y `NETLIFY_SITE_ID_PRODUCTION`

---

### 3. Variables de Entorno (Opcionales)

Estas variables se usan durante el build del frontend:

- `VITE_SUPABASE_URL` - URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `VITE_API_URL_STAGING` - URL del API para staging (opcional)
- `VITE_API_URL_PRODUCTION` - URL del API para producción (opcional)

**Nota:** Si no las configuras, el frontend usará las Edge Functions de Supabase automáticamente.

---

### 4. Slack Webhook (Opcional)

**Nombre:** `SLACK_WEBHOOK_URL`

**Cómo obtenerlo:**
1. Ve a https://api.slack.com/apps
2. Crea una nueva app o selecciona una existente
3. Ve a **Incoming Webhooks**
4. Activa los webhooks y crea uno nuevo
5. Copia la URL del webhook
6. Agrega como secret en GitHub

**Uso:** Para recibir notificaciones de deployments

---

## 📝 Pasos para Configurar

1. Ve a tu repositorio en GitHub
2. Click en **Settings**
3. Ve a **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agrega cada secret con su nombre y valor
6. Click en **Add secret**

---

## ✅ Checklist

- [ ] `SUPABASE_ACCESS_TOKEN` configurado
- [ ] `NETLIFY_SITE_ID_STAGING` configurado
- [ ] `NETLIFY_SITE_ID_PRODUCTION` configurado
- [ ] `VITE_SUPABASE_URL` configurado (opcional)
- [ ] `VITE_SUPABASE_ANON_KEY` configurado (opcional)
- [ ] `SLACK_WEBHOOK_URL` configurado (opcional)

---

## 🔒 Seguridad

- **NUNCA** commitees estos tokens en el código
- Los secrets solo son accesibles en los workflows de GitHub Actions
- Los valores no se muestran en los logs (se ocultan automáticamente)
- Si un token se compromete, revócalo inmediatamente y genera uno nuevo

---

**Última actualización:** Enero 2025
