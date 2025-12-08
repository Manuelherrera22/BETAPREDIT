# Arquitectura del Sistema - BETAPREDIT

## Visión General

BETAPREDIT es una plataforma de apuestas deportivas construida con una arquitectura de microservicios moderna, enfocada en baja latencia, inteligencia artificial y cumplimiento regulatorio.

## Componentes Principales

### 1. Backend API (Node.js/TypeScript)

**Tecnologías:**
- Express.js para APIs REST
- Socket.io para WebSockets (actualizaciones en tiempo real)
- Prisma ORM para base de datos
- Redis para caché y pub/sub
- JWT para autenticación

**Responsabilidades:**
- Gestión de usuarios y autenticación
- APIs de eventos deportivos
- Gestión de apuestas
- Integración con servicios ML
- WebSockets para odds en tiempo real
- Validación y autorización

**Endpoints Principales:**
- `/api/auth/*` - Autenticación
- `/api/events/*` - Eventos deportivos
- `/api/odds/*` - Cuotas y odds
- `/api/bets/*` - Gestión de apuestas
- `/api/risk/*` - Gestión de riesgos
- `/api/rg/*` - Juego responsable

### 2. ML Services (Python/FastAPI)

**Tecnologías:**
- FastAPI para APIs
- TensorFlow/PyTorch para modelos ML
- scikit-learn para análisis
- Redis para comunicación

**Servicios:**
- **Odds Predictor**: Predicción de cuotas usando ML
- **Risk Manager**: Gestión de exposición y riesgos
- **Fraud Detection**: Detección de fraude y match-fixing
- **RG Detector**: Detección de juego problemático

**Endpoints:**
- `/api/odds/predict` - Predecir cuotas
- `/api/risk/assess` - Evaluar riesgos
- `/api/fraud/detect` - Detectar fraude
- `/api/rg/detect` - Detectar juego problemático

### 3. Frontend (React/TypeScript)

**Tecnologías:**
- React 18 con TypeScript
- Vite para build
- React Query para data fetching
- Zustand para estado global
- Socket.io-client para tiempo real
- Tailwind CSS para estilos

**Características:**
- Actualizaciones de odds en tiempo real
- Interfaz responsive
- Gestión de apuestas
- Panel de juego responsable
- Dashboard de eventos

### 4. Base de Datos (PostgreSQL)

**Esquema Principal:**
- `User` - Usuarios y autenticación
- `Event` - Eventos deportivos
- `Market` - Mercados de apuestas
- `Odds` - Cuotas
- `Bet` - Apuestas
- `RiskExposure` - Exposición de riesgos
- `FraudAlert` - Alertas de fraude
- `ResponsibleGaming` - Configuración RG

### 5. Cache y Mensajería (Redis)

**Uso:**
- Caché de odds (TTL corto)
- Pub/Sub para actualizaciones en tiempo real
- Rate limiting
- Sesiones

## Flujos de Datos

### Flujo de Apuesta

1. Usuario selecciona odds en frontend
2. Frontend envía request a `/api/bets`
3. Backend valida:
   - Autenticación
   - Límites RG
   - Disponibilidad de odds
   - Balance del usuario
4. Backend crea apuesta
5. Backend actualiza exposición de riesgo
6. Backend notifica a ML service para análisis de fraude
7. Backend responde con confirmación
8. Frontend actualiza UI

### Flujo de Actualización de Odds

1. ML Service calcula nuevas odds
2. ML Service envía a Backend
3. Backend actualiza base de datos
4. Backend invalida caché Redis
5. Backend publica actualización vía Redis pub/sub
6. WebSocket server notifica a clientes conectados
7. Frontend recibe y actualiza UI

### Flujo de Detección de Fraude

1. Backend detecta patrón sospechoso
2. Backend envía datos a ML Fraud Detection
3. ML Service analiza con modelos
4. ML Service retorna alerta si detecta fraude
5. Backend crea `FraudAlert` en BD
6. Backend notifica a administradores
7. Backend puede suspender mercado/usuario

### Flujo de Juego Responsable

1. Usuario realiza acción (apuesta, depósito)
2. Backend registra en BD
3. Backend envía datos a ML RG Detector
4. ML Service analiza patrones:
   - Loss chasing
   - Late night gambling
   - Rapid betting
   - Excessive deposits
5. ML Service retorna alertas
6. Backend actualiza `ResponsibleGaming` en BD
7. Backend puede:
   - Enviar alerta al usuario
   - Aplicar límites automáticos
   - Suspender cuenta si es crítico

## Seguridad

### Autenticación
- JWT tokens con refresh tokens
- Tokens almacenados en localStorage (frontend)
- Validación en cada request

### Autorización
- Roles: USER, TRADER, ADMIN
- Middleware de autorización por ruta
- Validación de permisos

### Rate Limiting
- Por IP en Redis
- 100 requests/minuto por defecto
- Configurable por endpoint

### Validación
- Zod schemas en backend
- TypeScript en frontend
- Validación de entrada en todos los endpoints

## Escalabilidad

### Horizontal Scaling
- Backend: Múltiples instancias detrás de load balancer
- ML Services: Escalado independiente según carga
- Redis: Cluster mode para alta disponibilidad
- PostgreSQL: Read replicas para consultas

### Optimizaciones
- Caché Redis para odds frecuentes
- WebSockets para actualizaciones en tiempo real
- Connection pooling en base de datos
- Compresión de respuestas HTTP

## Monitoreo y Logging

### Logging
- Winston en backend
- Logs estructurados (JSON)
- Niveles: error, warn, info, debug
- Rotación de archivos

### Métricas (Futuro)
- Prometheus para métricas
- Grafana para visualización
- Alertas automáticas

## Integraciones Externas

### APIs de Datos Deportivos
- Sportradar (ejemplo)
- Integración vía HTTP/WebSocket
- Actualización de eventos en tiempo real
- Sincronización de resultados

### Proveedores de Pago
- Integración futura
- Stripe, PayPal, etc.
- Webhooks para confirmación

## Deployment

### Desarrollo
- Docker Compose para servicios locales
- Hot reload en todos los servicios
- Base de datos local

### Producción
- Kubernetes (recomendado)
- Docker containers
- CI/CD pipeline
- Blue-green deployment
- Auto-scaling

## Mejoras Futuras

1. **Microservicios adicionales:**
   - Servicio de notificaciones
   - Servicio de pagos
   - Servicio de reportes

2. **Optimizaciones:**
   - CDN para assets estáticos
   - GraphQL API
   - Server-side rendering (SSR)

3. **ML Avanzado:**
   - Modelos más sofisticados
   - Aprendizaje continuo
   - Personalización por usuario

4. **Mobile:**
   - Apps nativas iOS/Android
   - React Native o Flutter

