# 🚀 Guía de Inicio Rápido - BETAPREDIT

**Última actualización:** Enero 2025  
**Tiempo estimado:** 15-20 minutos

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js 18+** - [Descargar](https://nodejs.org/)
- ✅ **npm 9+** (viene con Node.js)
- ✅ **Git** - [Descargar](https://git-scm.com/)
- ✅ **Cuenta de Supabase** - [Crear cuenta](https://supabase.com) (gratis)
- ⚠️ **Supabase CLI** (opcional, para Edge Functions):
  ```bash
  npm install -g supabase
  ```

---

## ⚡ Instalación Rápida (5 pasos)

### Paso 1: Clonar y Navegar

```bash
git clone <tu-repositorio>
cd BETPREDIT
```

### Paso 2: Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
# (Ver backend/.env.example para guía completa)
```

**Variables Mínimas Requeridas:**
```env
DATABASE_URL=postgresql://postgres:password@db.tu-proyecto.supabase.co:5432/postgres
JWT_SECRET=tu_secret_minimo_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret_minimo_32_caracteres
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Paso 3: Configurar Base de Datos

```bash
# Generar Prisma Client
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy
```

### Paso 4: Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
```

**Variables Mínimas Requeridas:**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_API_URL=http://localhost:3000/api
```

### Paso 5: Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend corriendo en: http://localhost:3000  
✅ Swagger UI disponible en: http://localhost:3000/api-docs

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend corriendo en: http://localhost:5173

---

## 🔑 Obtener Credenciales de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea una cuenta (gratis)
3. Click en "New Project"
4. Completa el formulario:
   - **Name**: betapredit
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Elige la más cercana

### 2. Obtener Variables de Entorno

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia:
   - **Project URL** → `SUPABASE_URL` y `VITE_SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` y `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (solo backend)

### 3. Obtener DATABASE_URL

1. Ve a **Settings** → **Database**
2. Busca "Connection string" → **URI**
3. Copia la URL y reemplaza `[YOUR-PASSWORD]` con tu contraseña
4. Usa esta URL como `DATABASE_URL`

---

## 🧪 Verificar Instalación

### 1. Verificar Backend

```bash
# En otra terminal
curl http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "redis": "connected" o "disconnected (using mock)"
  }
}
```

### 2. Verificar Frontend

1. Abre http://localhost:5173
2. Deberías ver la landing page
3. Abre la consola del navegador (F12)
4. Deberías ver: `✅ Supabase configured`

### 3. Verificar Swagger

1. Abre http://localhost:3000/api-docs
2. Deberías ver la documentación completa de la API

---

## 🚀 Próximos Pasos

### Desarrollo Local

1. **Crear un usuario de prueba:**
   - Ve a http://localhost:5173/register
   - Regístrate con un email de prueba

2. **Explorar la API:**
   - Ve a http://localhost:3000/api-docs
   - Prueba los endpoints documentados

3. **Ver eventos:**
   - Inicia sesión en el frontend
   - Navega a la página de Eventos

### Desplegar Edge Functions (Opcional)

```bash
# Login en Supabase
supabase login

# Linkear proyecto
supabase link --project-ref tu-project-ref

# Desplegar funciones
supabase functions deploy external-bets
supabase functions deploy user-statistics
# ... etc
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- ✅ Verifica que `DATABASE_URL` esté correcta
- ✅ Verifica que la contraseña sea correcta
- ✅ Verifica que Supabase esté activo

### Error: "JWT_SECRET must be at least 32 characters"
- ✅ Genera un secret seguro:
  ```bash
  openssl rand -base64 32
  ```

### Error: "Supabase not configured" en frontend
- ✅ Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén en `.env`
- ✅ Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Prisma Client not generated"
- ✅ Ejecuta: `npx prisma generate`

### Error: "Migration failed"
- ✅ Verifica que la base de datos esté accesible
- ✅ Verifica que tengas permisos en Supabase

---

## 📚 Recursos Adicionales

- **[ANALISIS_COMPLETO_ESTADO_SISTEMA.md](./ANALISIS_COMPLETO_ESTADO_SISTEMA.md)** - Estado completo del proyecto
- **[GUIA_COMPLETA_PRISMA_SUPABASE.md](./GUIA_COMPLETA_PRISMA_SUPABASE.md)** - Guía detallada de Prisma/Supabase
- **[.github/workflows/README.md](./.github/workflows/README.md)** - CI/CD y deployment
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía de contribución

---

## ✅ Checklist de Verificación

- [ ] Node.js 18+ instalado
- [ ] Repositorio clonado
- [ ] Dependencias del backend instaladas
- [ ] Dependencias del frontend instaladas
- [ ] Archivo `.env` del backend configurado
- [ ] Archivo `.env` del frontend configurado
- [ ] Prisma Client generado
- [ ] Migraciones aplicadas
- [ ] Backend corriendo en http://localhost:3000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Health check responde correctamente
- [ ] Swagger UI accesible
- [ ] Frontend muestra landing page

---

**¿Problemas?** Revisa la sección de Troubleshooting o crea un issue en el repositorio.

**¡Listo!** Ya puedes empezar a desarrollar. 🎉

---

**Última actualización:** Enero 2025
