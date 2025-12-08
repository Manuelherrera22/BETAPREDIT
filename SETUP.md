# Guía de Configuración - BETAPREDIT

Esta guía te ayudará a configurar y ejecutar la plataforma BETAPREDIT en tu entorno local.

## Prerrequisitos

- **Node.js** 18+ y npm 9+
- **Python** 3.10+
- **Docker** y Docker Compose
- **PostgreSQL** 14+ (o usar Docker)
- **Redis** 7+ (o usar Docker)

## Instalación Paso a Paso

### 1. Clonar y Configurar el Proyecto

```bash
# Ya estás en el directorio del proyecto
cd BETAPREDIT
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Configurar base de datos
npx prisma generate
npx prisma migrate dev --name init

# Crear directorio de logs
mkdir -p logs
```

### 3. Configurar ML Services

```bash
cd ../ml-services

# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 4. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

### 5. Iniciar con Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Esto iniciará:
# - PostgreSQL en puerto 5432
# - Redis en puerto 6379
# - Backend en puerto 3000
# - ML Services en puerto 8000
```

### 6. Iniciar Servicios Manualmente (Alternativa)

Si prefieres no usar Docker para desarrollo:

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - ML Services
```bash
cd ml-services
python main.py
```

#### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```

## Configuración de Variables de Entorno

### Backend (.env)

```env
DATABASE_URL="postgresql://betapredit:changeme@localhost:5432/betapredit"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

### ML Services

Crear archivo `.env` en `ml-services/`:

```env
DATABASE_URL="postgresql://betapredit:changeme@localhost:5432/betapredit"
REDIS_URL=redis://localhost:6379
ML_API_PORT=8000
```

## Verificar Instalación

1. **Backend Health Check**: http://localhost:3000/health
2. **ML Services Health Check**: http://localhost:8000/health
3. **Frontend**: http://localhost:5173

## Estructura de Base de Datos

La base de datos se inicializa automáticamente con Prisma. Para ver el esquema:

```bash
cd backend
npx prisma studio
```

Esto abrirá Prisma Studio en http://localhost:5555

## Comandos Útiles

### Backend
```bash
npm run dev          # Desarrollo
npm run build        # Compilar
npm run start        # Producción
npm run migrate      # Ejecutar migraciones
npm run generate     # Generar Prisma Client
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Compilar
npm run preview      # Preview de build
```

### ML Services
```bash
python main.py       # Iniciar servidor
```

## Solución de Problemas

### Error de conexión a PostgreSQL
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que el puerto 5432 esté disponible

### Error de conexión a Redis
- Verificar que Redis esté corriendo
- Verificar configuración en `.env`

### Error en Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # Cuidado: borra datos
```

### Puerto ya en uso
- Cambiar puertos en `.env` y `docker-compose.yml`
- O detener el proceso que usa el puerto

## Próximos Pasos

1. **Crear usuario administrador** (manual o script)
2. **Configurar APIs externas** (Sportradar, etc.)
3. **Entrenar modelos ML** (si es necesario)
4. **Configurar SSL/HTTPS** para producción
5. **Configurar monitoreo** (Prometheus, Grafana)

## Desarrollo

### Agregar Nuevas Funcionalidades

1. **Backend**: Agregar rutas en `backend/src/api/routes/`
2. **ML Services**: Agregar servicios en `ml-services/services/`
3. **Frontend**: Agregar páginas en `frontend/src/pages/`

### Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## Producción

Para producción, considera:

1. Variables de entorno seguras
2. SSL/HTTPS
3. Rate limiting más estricto
4. Monitoreo y logging
5. Backup de base de datos
6. CDN para frontend
7. Load balancing
8. Auto-scaling

