/**
 * Script para crear archivos .env.example completos
 */

const fs = require('fs');
const path = require('path');

// Backend .env.example
const backendEnvExample = `# ============================================
# BETAPREDIT - Backend Environment Variables
# ============================================
# 
# Copia este archivo a .env y completa los valores
# cp .env.example .env
#
# ============================================

# ============================================
# REQUERIDAS - Deben estar configuradas
# ============================================

# Base de Datos PostgreSQL
# Formato: postgresql://usuario:password@host:puerto/database
DATABASE_URL=postgresql://postgres:password@localhost:5432/betapredit

# JWT Secrets - Deben tener al menos 32 caracteres
# Genera secrets seguros: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-minimum-32-characters-long-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-minimum-32-characters-long-here

# URL del Frontend
FRONTEND_URL=http://localhost:5173

# ============================================
# OPCIONALES - Configuración General
# ============================================

# Entorno de ejecución
NODE_ENV=development

# Puerto del servidor
PORT=3000

# URL del Backend (para callbacks OAuth, etc.)
BACKEND_URL=http://localhost:3000

# ============================================
# REDIS - Cache y Pub/Sub
# ============================================
# Formato: redis://host:puerto o redis://:password@host:puerto
REDIS_URL=redis://localhost:6379

# Deshabilitar Redis (usar cache en memoria)
# REDIS_DISABLED=false

# ============================================
# INTEGRACIONES - APIs Externas
# ============================================

# The Odds API - Para obtener cuotas en tiempo real
# Obtén tu API key en: https://the-odds-api.com/
THE_ODDS_API_KEY=your-the-odds-api-key-here
THE_ODDS_API_TIMEOUT=10000

# API-Football - Para datos de equipos, estadísticas, H2H
# Obtén tu API key en: https://www.api-football.com/
API_FOOTBALL_KEY=your-api-football-key-here
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io

# ============================================
# SUPABASE - Autenticación y Edge Functions
# ============================================
# Obtén estas credenciales en: https://supabase.com/dashboard

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# ============================================
# STRIPE - Pagos y Suscripciones
# ============================================
# Obtén tus API keys en: https://dashboard.stripe.com/apikeys

STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
STRIPE_API_VERSION=2024-11-20.acacia

# ============================================
# GOOGLE OAUTH - Autenticación Social
# ============================================
# Configura en: https://console.cloud.google.com/apis/credentials

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# ============================================
# EMAIL - Servicio de Correo
# ============================================
# Opciones: sendgrid, resend, nodemailer

EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your-email-api-key-here
EMAIL_FROM=noreply@betapredit.com
EMAIL_FROM_NAME=BETAPREDIT

# Para SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key-here

# Para Resend
RESEND_API_KEY=your-resend-api-key-here

# Para Nodemailer (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here

# ============================================
# SENTRY - Error Tracking
# ============================================
# Obtén tu DSN en: https://sentry.io/settings/projects/

SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development

# ============================================
# OTRAS INTEGRACIONES
# ============================================

# Kalshi - Trading de eventos
KALSHI_API_KEY=your-kalshi-api-key-here
KALSHI_API_SECRET=your-kalshi-api-secret-here

# Sportradar - Datos deportivos
SPORTRADAR_API_KEY=your-sportradar-api-key-here

# ============================================
# FEATURES FLAGS
# ============================================

# Habilitar tracking de cuotas automático
ENABLE_ODDS_TRACKING=true

# Habilitar generación automática de predicciones
ENABLE_AUTO_PREDICTIONS=true

# ============================================
# NOTAS
# ============================================
#
# 1. NUNCA commitees el archivo .env al repositorio
# 2. Usa valores diferentes para desarrollo y producción
# 3. Genera secrets seguros para JWT_SECRET y JWT_REFRESH_SECRET
# 4. Las variables marcadas como opcionales tienen valores por defecto
# 5. Revisa la documentación en ENV_VARIABLES.md para más detalles
`;

// Frontend .env.example
const frontendEnvExample = `# ============================================
# BETAPREDIT - Frontend Environment Variables
# ============================================
# 
# Copia este archivo a .env y completa los valores
# cp .env.example .env
#
# Nota: En Vite, las variables deben empezar con VITE_
# ============================================

# ============================================
# REQUERIDAS - Deben estar configuradas
# ============================================

# URL del Backend API
# En desarrollo: http://localhost:3000
# En producción: https://api.betapredit.com
VITE_API_URL=http://localhost:3000

# ============================================
# SUPABASE - Autenticación y Edge Functions
# ============================================
# Obtén estas credenciales en: https://supabase.com/dashboard

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# ============================================
# STRIPE - Pagos (Frontend)
# ============================================
# Obtén tu public key en: https://dashboard.stripe.com/apikeys

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key-here

# Price IDs para suscripciones (opcional)
VITE_STRIPE_PRICE_ID_BASIC=price_basic_placeholder
VITE_STRIPE_PRICE_ID_PRO=price_pro_placeholder
VITE_STRIPE_PRICE_ID_PREMIUM=price_premium_placeholder

# ============================================
# SENTRY - Error Tracking (Frontend)
# ============================================
# Obtén tu DSN en: https://sentry.io/settings/projects/

VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development

# ============================================
# CONFIGURACIÓN DE ENTORNO
# ============================================

# Modo de la aplicación
# development | production
VITE_APP_ENV=development

# ============================================
# NOTAS
# ============================================
#
# 1. NUNCA commitees el archivo .env al repositorio
# 2. Todas las variables deben empezar con VITE_ para que Vite las exponga
# 3. Las variables se acceden en el código con: import.meta.env.VITE_VARIABLE_NAME
# 4. Después de cambiar .env, reinicia el servidor de desarrollo
# 5. En producción, configura estas variables en tu plataforma de hosting
#    (Netlify, Vercel, Railway, etc.)
`;

// Escribir archivos
const backendPath = path.join(__dirname, '../backend/.env.example');
const frontendPath = path.join(__dirname, '../frontend/.env.example');

fs.writeFileSync(backendPath, backendEnvExample, 'utf8');
fs.writeFileSync(frontendPath, frontendEnvExample, 'utf8');

console.log('✅ Archivos .env.example creados exitosamente');
console.log('   - backend/.env.example');
console.log('   - frontend/.env.example');

