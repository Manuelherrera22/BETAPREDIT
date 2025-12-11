# 🚀 Guía de Deployment - BETAPREDIT

## 📋 Requisitos Previos

### Variables de Entorno Requeridas

#### Backend
```env
# Base
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://betapredit.com

# Base de Datos
DATABASE_URL=postgresql://user:password@host:port/database

# Autenticación
JWT_SECRET=tu_jwt_secret_muy_seguro_y_largo
JWT_REFRESH_SECRET=tu_refresh_secret_muy_seguro

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# APIs Externas
THE_ODDS_API_KEY=tu_the_odds_api_key
API_FOOTBALL_KEY=tu_api_football_key

# OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Stripe (Opcional)
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=tu_webhook_secret

# Monitoreo
SENTRY_DSN=tu_sentry_dsn

# Redis (Opcional)
REDIS_URL=redis://host:port
REDIS_DISABLED=false
```

#### Frontend
```env
VITE_API_URL=https://api.betapredit.com
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SENTRY_DSN=tu_sentry_dsn
```

---

## 🏗️ Deployment del Backend

### Opción 1: Railway (Recomendado)

1. **Crear Proyecto en Railway**
   - Ve a https://railway.app
   - Inicia sesión con GitHub
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio `BETAPREDIT`
   - Selecciona el directorio `backend`

2. **Configurar Build**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Configurar Variables de Entorno**
   - Agrega todas las variables de entorno listadas arriba
   - Railway generará una URL como: `https://betapredit-backend-production.up.railway.app`

4. **Configurar Base de Datos**
   - Railway puede crear una PostgreSQL automáticamente
   - O conecta tu Supabase PostgreSQL usando `DATABASE_URL`

5. **Ejecutar Migraciones**
   ```bash
   npm run db:migrate
   ```

### Opción 2: Heroku

1. **Instalar Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Crear App**
   ```bash
   cd backend
   heroku create betapredit-backend
   ```

3. **Configurar Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_URL=...
   # ... agregar todas las variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Ejecutar Migraciones**
   ```bash
   heroku run npm run db:migrate
   ```

### Opción 3: Docker

1. **Crear Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build y Run**
   ```bash
   docker build -t betapredit-backend .
   docker run -p 3000:3000 --env-file .env betapredit-backend
   ```

---

## 🎨 Deployment del Frontend

### Opción 1: Netlify (Recomendado)

1. **Conectar Repositorio**
   - Ve a https://netlify.com
   - Inicia sesión con GitHub
   - Click en "New site from Git"
   - Selecciona tu repositorio
   - Directorio base: `frontend`

2. **Configurar Build**
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

3. **Configurar Variables de Entorno**
   - Agrega todas las variables `VITE_*` en Netlify Dashboard
   - Settings → Environment variables

4. **Configurar Redirects** (netlify.toml)
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://api.betapredit.com/api/:splat"
     status = 200
     force = true
   ```

### Opción 2: Vercel

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Configurar Variables**
   - En Vercel Dashboard → Settings → Environment Variables

---

## ✅ Checklist Pre-Deployment

### Backend
- [ ] Todas las variables de entorno configuradas
- [ ] Migraciones de base de datos ejecutadas
- [ ] Prisma Client generado (`npm run generate`)
- [ ] Tests pasando (`npm test`)
- [ ] Build exitoso (`npm run build`)
- [ ] Health check funcionando (`/health`)
- [ ] Swagger documentación accesible (`/api-docs`)

### Frontend
- [ ] Variables de entorno configuradas
- [ ] Build exitoso (`npm run build`)
- [ ] No hay errores de TypeScript
- [ ] Linter pasando (`npm run lint`)
- [ ] Tests pasando (`npm test`)

### Base de Datos
- [ ] Migraciones aplicadas
- [ ] Datos de prueba (opcional)
- [ ] Índices creados
- [ ] Backups configurados

### Seguridad
- [ ] JWT_SECRET seguro y único
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo
- [ ] Helmet configurado
- [ ] Variables sensibles no en código

---

## 🔍 Verificación Post-Deployment

### Backend
```bash
# Health check
curl https://api.betapredit.com/health

# Swagger docs
curl https://api.betapredit.com/api-docs

# Test endpoint (requiere auth)
curl https://api.betapredit.com/api/predictions/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend
- [ ] Página carga correctamente
- [ ] Login funciona
- [ ] API calls funcionan
- [ ] No hay errores en consola
- [ ] WebSockets conectan

---

## 🐛 Troubleshooting

### Backend no responde
1. Verificar logs: `railway logs` o `heroku logs --tail`
2. Verificar variables de entorno
3. Verificar conexión a base de datos
4. Verificar que el puerto esté correcto

### Frontend no carga
1. Verificar build en Netlify/Vercel
2. Verificar variables de entorno
3. Verificar que `VITE_API_URL` apunte al backend correcto
4. Verificar CORS en backend

### Errores de base de datos
1. Verificar `DATABASE_URL`
2. Ejecutar migraciones: `npm run db:migrate`
3. Verificar conexión: `npm run verify-db`

### Errores de autenticación
1. Verificar `JWT_SECRET` en backend
2. Verificar que tokens se generen correctamente
3. Verificar que frontend envíe tokens en headers

---

## 📊 Monitoreo

### Sentry
- Configurar `SENTRY_DSN` en backend y frontend
- Errores se enviarán automáticamente a Sentry

### Logs
- Railway: Dashboard → Logs
- Heroku: `heroku logs --tail`
- Netlify: Deploys → View logs

### Health Checks
- Configurar uptime monitoring (UptimeRobot, etc.)
- Monitorear endpoint `/health`

---

## 🔄 Actualizaciones

### Backend
```bash
git push origin main
# Railway/Heroku detectará cambios y redeployará automáticamente
```

### Frontend
```bash
git push origin main
# Netlify/Vercel detectará cambios y redeployará automáticamente
```

### Migraciones
```bash
# Después de cambios en schema.prisma
npm run db:migrate:dev -- --name nombre_migracion
npm run db:migrate  # En producción
```

---

## 📝 Notas Importantes

1. **Nunca** commitees archivos `.env` al repositorio
2. **Siempre** ejecuta migraciones después de cambios en schema
3. **Verifica** que todas las variables estén configuradas antes de deployar
4. **Monitorea** logs después del deployment
5. **Prueba** endpoints críticos después del deployment

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.

