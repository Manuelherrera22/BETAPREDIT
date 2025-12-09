# ⚡ Solución Inmediata: Error 405 en Perfil

## ❌ **PROBLEMA**

```
PUT https://betapredit.com/api/user/profile 405 (Method Not Allowed)
```

**Causa:** El backend NO está desplegado en producción. Netlify no puede procesar peticiones PUT a `/api/*` sin un backend.

---

## ✅ **SOLUCIÓN RÁPIDA (2 opciones)**

### **Opción 1: Desplegar Backend en Railway (15 minutos)**

#### **Paso 1: Crear Proyecto en Railway**

1. Ve a https://railway.app
2. Login con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona repositorio `BETAPREDIT`
5. Railway detectará automáticamente `backend/`

#### **Paso 2: Configurar Variables de Entorno**

En Railway → Tu servicio → Variables, agrega:

```env
DATABASE_URL=postgres://postgres:[Herrera123Musfelcrow]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:6543/postgres
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://betapredit.com
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_muy_seguro
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0
SUPABASE_SERVICE_ROLE_KEY=sb_secret_37NifuAx6LXLATCdDCZmA_hW_cdMys
THE_ODDS_API_KEY=06052d2a715f5ff4d5547225853bd5b8
GOOGLE_CLIENT_ID=40911110211-kird31hq5j2t435ummv8mu20fge7pn5p.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

#### **Paso 3: Obtener URL del Backend**

1. Railway → Settings → Generate Domain
2. Te dará una URL como: `https://betapredit-production.up.railway.app`
3. **Copia esta URL**

#### **Paso 4: Configurar Netlify**

**Opción A: Variable de Entorno (RECOMENDADO)**

1. Netlify Dashboard → Site settings → Environment variables
2. Agrega:
   ```
   VITE_API_URL=https://betapredit-production.up.railway.app/api
   ```
   **IMPORTANTE:** Agrega `/api` al final
3. Deploys → Trigger deploy → Deploy site

**Opción B: Proxy en netlify.toml**

1. Edita `netlify.toml`:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://betapredit-production.up.railway.app/api/:splat"
  status = 200
  force = true
```
2. Commit y push

#### **Paso 5: Ejecutar Migraciones**

En Railway, ejecuta:
```bash
npx prisma migrate deploy
```

O agrega en `package.json`:
```json
"deploy": "prisma migrate deploy && npm start"
```

---

### **Opción 2: Usar Variable de Entorno (SIN Proxy)**

Si ya tienes el backend desplegado:

1. Netlify → Environment variables
2. Agrega: `VITE_API_URL=https://tu-backend.railway.app/api`
3. Redeploy

---

## ✅ **VERIFICACIÓN**

1. Abre `https://betapredit.com`
2. Intenta actualizar tu perfil
3. Debería funcionar sin error 405

---

## 📝 **NOTAS**

- Railway ofrece plan gratuito con $5 de crédito mensual
- El backend debe estar corriendo 24/7
- Considera usar Supabase Edge Functions para reducir dependencia del backend

