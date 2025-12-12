# 🎯 BETAPREDIT - Plataforma de Análisis Predictivo y Apuestas Deportivas

**Versión:** 1.0.0  
**Estado:** ✅ **Listo para Producción** (Score: 9.2/10)  
**Última actualización:** Enero 2025

Plataforma moderna de análisis predictivo para apuestas deportivas con tecnología de baja latencia, inteligencia artificial y herramientas avanzadas de análisis de valor.

## 🎯 Características Principales

### Tecnología de Baja Latencia
- APIs optimizadas para actualización de cuotas en tiempo real (milisegundos)
- Arquitectura de microservicios para escalabilidad
- Redis para caché de alta velocidad
- WebSockets para streaming de datos en vivo

### Inteligencia Artificial y Machine Learning
- **Odds Setting Automático**: Agentes de IA para cálculo y ajuste dinámico de cuotas
- **Trading Algorítmico**: Sistemas virtuales de trading 24/7
- **Análisis Predictivo**: Modelos ML con datos granulares a nivel jugador
- **Gestión de Riesgos**: Detección automática de anomalías y ajuste de márgenes

### Integridad y Cumplimiento
- **Detección de Fraude**: Sistema avanzado para identificar match-fixing y patrones sospechosos
- **Juego Responsable (RG)**: IA para detección proactiva de comportamientos de riesgo
- **KYC/AML**: Cumplimiento automatizado de regulaciones
- **Multi-jurisdicción**: Soporte para diferentes marcos regulatorios

### Integración de Datos
- **APIs de datos deportivos en tiempo real**: Integración con múltiples proveedores de datos
- **Datos granulares a nivel de jugador**: Tracking avanzado y análisis detallado
- **Sistemas de integridad**: Detección de anomalías y patrones sospechosos
- **Algoritmos predictivos**: Modelos propietarios de análisis estadístico
- **Proveedores B2B**: Integraciones con plataformas de terceros

## 🏗️ Arquitectura

```
betapredit/
├── backend/              # API principal (Node.js/TypeScript)
│   ├── src/
│   │   ├── api/         # Endpoints REST y WebSocket
│   │   ├── services/    # Lógica de negocio
│   │   ├── models/      # Modelos de datos
│   │   └── middleware/  # Autenticación, validación, etc.
│   └── config/          # Configuración
├── ml-services/         # Servicios de Machine Learning (Python)
│   ├── odds-predictor/  # Modelos de predicción de cuotas
│   ├── risk-manager/    # Gestión de riesgos
│   ├── fraud-detection/ # Detección de fraude
│   └── rg-detector/     # Juego responsable
├── frontend/            # Aplicación web (React/TypeScript)
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── pages/       # Páginas principales
│   │   ├── services/    # Clientes API
│   │   └── hooks/       # React hooks
│   └── public/
├── shared/              # Código compartido (tipos, utilidades)
└── infrastructure/      # Docker, scripts de deployment
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Python 3.10+ (opcional, para ML services)
- PostgreSQL 14+ (o usar Supabase)
- Redis 7+ (opcional, usa cache en memoria si no está disponible)
- Supabase CLI (para Edge Functions)

### Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd BETPREDIT

# 2. Configurar Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones (ver backend/.env.example)

# 3. Configurar Base de Datos
npx prisma generate
npx prisma migrate deploy

# 4. Configurar Frontend
cd ../frontend
npm install
cp .env.example .env
# Editar .env con tus configuraciones (ver frontend/.env.example)

# 5. Iniciar Backend
cd ../backend
npm run dev  # http://localhost:3000

# 6. Iniciar Frontend (en otra terminal)
cd frontend
npm run dev  # http://localhost:5173
```

### Configuración con Supabase (Recomendado)

El proyecto usa **Supabase** para base de datos y Edge Functions:

1. **Crear proyecto en Supabase**: https://supabase.com
2. **Configurar variables de entorno** (ver `.env.example`)
3. **Desplegar Edge Functions**:
   ```bash
   supabase login
   supabase link --project-ref tu-project-ref
   supabase functions deploy
   ```

Ver [GUIA_COMPLETA_PRISMA_SUPABASE.md](./GUIA_COMPLETA_PRISMA_SUPABASE.md) para más detalles.

### Documentación API

Una vez iniciado el backend, la documentación Swagger está disponible en:
- **Local:** http://localhost:3000/api-docs
- **Producción:** https://tu-backend-url.com/api-docs

## 📊 Stack Tecnológico

### Backend
- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js / Fastify (para baja latencia)
- **Base de Datos**: PostgreSQL (datos estructurados)
- **Cache**: Redis (baja latencia)
- **WebSockets**: Socket.io / ws
- **ORM**: Prisma / TypeORM

### Machine Learning
- **Lenguaje**: Python 3.10+
- **Framework ML**: TensorFlow / PyTorch
- **Análisis**: scikit-learn, pandas, numpy
- **API**: FastAPI (para servicios ML)

### Frontend
- **Framework**: React 18+ con TypeScript
- **Estado**: Redux Toolkit / Zustand
- **UI**: Material-UI / Tailwind CSS
- **Real-time**: Socket.io-client

### Infraestructura
- **Base de Datos**: Supabase (PostgreSQL)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Frontend Hosting**: Netlify
- **CI/CD**: GitHub Actions (✅ Configurado)
- **Monitoreo**: Sentry, Winston, Prometheus (parcial)
- **Cache**: Redis (opcional, fallback a memoria)

## 🔐 Seguridad y Cumplimiento

- Autenticación JWT con refresh tokens
- Encriptación de datos sensibles
- Rate limiting y protección DDoS
- Auditoría completa de transacciones
- Cumplimiento GDPR, KYC, AML

## ✅ Estado del Proyecto

### Completado (95%+)
- [x] Arquitectura completa (Backend, Frontend, ML Services)
- [x] Sistema de autenticación (JWT, OAuth, 2FA)
- [x] Gestión de apuestas (internas y externas)
- [x] Sistema de predicciones ML
- [x] Detección de value bets
- [x] Sistema de referidos
- [x] Integración con proveedores de datos deportivos
- [x] Integración con servicios de estadísticas
- [x] Sistema de estadísticas y ROI tracking
- [x] CI/CD pipeline completo
- [x] Documentación Swagger
- [x] Edge Functions en Supabase

### En Desarrollo
- [ ] Aumentar cobertura de tests (40% → 60%+)
- [ ] Monitoreo avanzado (Prometheus/Grafana completo)
- [ ] Integración con más proveedores de datos

### Roadmap Futuro
- [ ] Dashboard administrativo completo
- [ ] Integración completa con proveedores B2B
- [ ] Aplicación móvil (iOS/Android)
- [ ] PWA completo con Service Worker

## 🔌 Integraciones

### Proveedores de Datos
- Integración con múltiples proveedores de datos deportivos en tiempo real
- Datos granulares a nivel de jugador para análisis avanzado
- Sistemas de integridad y detección de anomalías

### Algoritmos Predictivos
- Modelos propietarios de análisis estadístico
- Plataformas de algoritmos avanzados
- Análisis de valor y detección de oportunidades

### Proveedores B2B
- Integraciones con plataformas de terceros
- Soluciones de software especializadas
- Infraestructura escalable y segura

## 📚 Documentación

- **[ANALISIS_COMPLETO_ESTADO_SISTEMA.md](./ANALISIS_COMPLETO_ESTADO_SISTEMA.md)** - Análisis completo del estado actual
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura del sistema
- **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** - Guía de inicio rápido detallada
- **[GUIA_COMPLETA_PRISMA_SUPABASE.md](./GUIA_COMPLETA_PRISMA_SUPABASE.md)** - Guía de Prisma y Supabase
- **[.github/workflows/README.md](./.github/workflows/README.md)** - Documentación de CI/CD
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía de contribución

### API Documentation
- **Swagger UI**: http://localhost:3000/api-docs (cuando el backend esté corriendo)
- **Endpoints documentados**: Auth, Events, Bets, Predictions, Value Bets, Referrals, y más

## 🔧 Configuración

### Variables de Entorno

Ver archivos `.env.example` en `backend/` y `frontend/` para la lista completa de variables requeridas.

**Variables Críticas:**
- `DATABASE_URL` - URL de PostgreSQL (Supabase)
- `JWT_SECRET` - Secret para JWT (mínimo 32 caracteres)
- `SUPABASE_URL` - URL de tu proyecto Supabase
- `SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `VITE_SUPABASE_URL` - URL de Supabase (frontend)
- `VITE_SUPABASE_ANON_KEY` - Clave anónima (frontend)

## 🧪 Testing

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage
```

**Cobertura Actual:** ~40% (objetivo: 60%+)

## 🚀 Deployment

### Staging
- Push a `develop` → Deploy automático a Supabase y Netlify

### Producción
- Push a `main` → Deploy con confirmación manual

Ver [.github/workflows/README.md](./.github/workflows/README.md) para más detalles.

## 📊 Métricas y Monitoreo

- **Sentry**: Error tracking (configurado)
- **Winston**: Logging estructurado
- **Prometheus**: Métricas (endpoint `/metrics`)
- **Health Check**: Endpoint `/health`

## 🔐 Seguridad

- ✅ JWT con refresh tokens
- ✅ OAuth (Google)
- ✅ 2FA (Two-Factor Authentication)
- ✅ Rate limiting granular
- ✅ Validación Zod en endpoints
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Sanitización de logs

## 📝 Licencia

Proprietary - Todos los derechos reservados

## 👥 Equipo

Desarrollado para el mercado predictivo y apuestas deportivas.

---

**¿Necesitas ayuda?** Revisa la [documentación completa](./ANALISIS_COMPLETO_ESTADO_SISTEMA.md) o crea un issue.

