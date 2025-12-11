# 📋 Variables de Entorno - BETAPREDIT

**Última actualización:** Enero 2025

---

## 📖 **Guía Rápida**

1. **Backend:** Copia `backend/.env.example` a `backend/.env` y completa los valores
2. **Frontend:** Copia `frontend/.env.example` a `frontend/.env` y completa los valores
3. **Revisa** este documento para entender cada variable

---

## 🔴 **Variables Requeridas**

### **Backend:**
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `JWT_SECRET` - Secret para firmar JWT tokens (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` - Secret para refresh tokens (mínimo 32 caracteres)
- `FRONTEND_URL` - URL del frontend para CORS

### **Frontend:**
- `VITE_API_URL` - URL del backend API
- `VITE_SUPABASE_URL` - URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Anon key de Supabase

---

## 🟡 **Variables Opcionales (Recomendadas)**

### **Integraciones:**
- `THE_ODDS_API_KEY` - Para obtener cuotas en tiempo real
- `API_FOOTBALL_KEY` - Para datos de equipos y estadísticas
- `STRIPE_SECRET_KEY` - Para pagos y suscripciones
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Para OAuth con Google
- `SENTRY_DSN` - Para tracking de errores

---

## 📚 **Documentación Completa**

### **Backend Variables:**

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `DATABASE_URL` | ✅ | URL de PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | Secret para JWT (min 32 chars) | `your-secret-here` |
| `JWT_REFRESH_SECRET` | ✅ | Secret para refresh tokens | `your-refresh-secret` |
| `FRONTEND_URL` | ✅ | URL del frontend | `http://localhost:5173` |
| `PORT` | ❌ | Puerto del servidor (default: 3000) | `3000` |
| `NODE_ENV` | ❌ | Entorno (default: development) | `development` |
| `REDIS_URL` | ❌ | URL de Redis | `redis://localhost:6379` |
| `THE_ODDS_API_KEY` | ❌ | API key de The Odds API | `your-key` |
| `API_FOOTBALL_KEY` | ❌ | API key de API-Football | `your-key` |
| `SUPABASE_URL` | ❌ | URL de Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ❌ | Anon key de Supabase | `your-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Service role key | `your-key` |
| `STRIPE_SECRET_KEY` | ❌ | Secret key de Stripe | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Webhook secret | `whsec_xxx` |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth secret | `your-secret` |
| `SENTRY_DSN` | ❌ | DSN de Sentry | `https://xxx@sentry.io/xxx` |
| `EMAIL_PROVIDER` | ❌ | Proveedor de email | `sendgrid` |
| `EMAIL_API_KEY` | ❌ | API key del proveedor | `your-key` |

### **Frontend Variables:**

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `VITE_API_URL` | ✅ | URL del backend | `http://localhost:3000` |
| `VITE_SUPABASE_URL` | ✅ | URL de Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Anon key de Supabase | `your-key` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ❌ | Public key de Stripe | `pk_test_xxx` |
| `VITE_SENTRY_DSN` | ❌ | DSN de Sentry | `https://xxx@sentry.io/xxx` |

---

## 🔐 **Generar Secrets Seguros**

### **JWT Secrets:**
```bash
# Genera un secret seguro de 32 caracteres
openssl rand -base64 32

# O usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **Verificar Secrets:**
```bash
# Verifica que el secret tenga al menos 32 caracteres
echo -n "your-secret" | wc -c
```

---

## 🚀 **Configuración por Entorno**

### **Desarrollo:**
```bash
# Backend
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=development
```

### **Producción:**
```bash
# Backend
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://betapredit.com

# Frontend
VITE_API_URL=https://api.betapredit.com
VITE_APP_ENV=production
```

---

## ⚠️ **Seguridad**

1. **NUNCA** commitees archivos `.env` al repositorio
2. **Usa** valores diferentes para desarrollo y producción
3. **Rota** secrets regularmente en producción
4. **Usa** secret managers en producción (AWS Secrets Manager, etc.)
5. **Valida** que todos los secrets tengan la longitud mínima requerida

---

## 📝 **Notas Adicionales**

- Las variables de frontend deben empezar con `VITE_` para que Vite las exponga
- Después de cambiar `.env`, reinicia el servidor
- Revisa `backend/src/config/env-validator.ts` para validación automática
- Consulta `CONFIGURACION_INTEGRACIONES.md` para detalles de cada integración

---

**¿Problemas?** Revisa los logs del servidor para ver qué variables faltan.

