# BETAPREDIT - Plataforma de Mercado Predictivo y Apuestas Deportivas

Plataforma moderna de apuestas deportivas con tecnología de baja latencia, inteligencia artificial y cumplimiento regulatorio avanzado.

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
- **APIs de datos deportivos en tiempo real**: Sportradar para cuotas y eventos
- **Datos granulares a nivel de jugador**: ShotTracker y KINEXON (UWB, tracking por pulgada)
- **Sistemas de integridad**: Universal Fraud Detection System (UFDS) de Sportradar
- **Algoritmos predictivos**: ZCode System, Trademate Sports, OddsJam, BetBurger
- **Proveedores B2B**: Altenar, BtoBet, Evolution Gaming, Microgaming

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
- Python 3.10+
- Docker y Docker Compose
- PostgreSQL 14+
- Redis 7+

### Instalación

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install

# Instalar dependencias de ML
cd ../ml-services
pip install -r requirements.txt

# Iniciar infraestructura (PostgreSQL, Redis)
docker-compose up -d

# Iniciar servicios
npm run dev  # Backend
npm run dev  # Frontend (en otra terminal)
python ml-services/main.py  # ML Services
```

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
- **Contenedores**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoreo**: Prometheus, Grafana
- **Logs**: ELK Stack

## 🔐 Seguridad y Cumplimiento

- Autenticación JWT con refresh tokens
- Encriptación de datos sensibles
- Rate limiting y protección DDoS
- Auditoría completa de transacciones
- Cumplimiento GDPR, KYC, AML

## 📈 Roadmap

- [x] Estructura base del proyecto
- [x] Sistema de autenticación y autorización
- [x] Integración con APIs de datos deportivos (Sportradar)
- [x] Motor de odds setting con IA
- [x] Sistema de apuestas en tiempo real
- [x] Panel de gestión de riesgos
- [x] Sistema de detección de fraude
- [x] Módulo de juego responsable
- [x] Integración con datos granulares (ShotTracker/KINEXON)
- [x] Integración con algoritmos predictivos
- [ ] Dashboard administrativo completo
- [ ] Integración completa con proveedores B2B
- [ ] Aplicación móvil (iOS/Android)

## 🔌 Integraciones

### Proveedores de Datos
- **Sportradar**: Cuotas en tiempo real, UFDS (integridad)
- **ShotTracker/KINEXON**: Datos granulares a nivel de jugador (3+ TB por partido)

### Algoritmos Predictivos
- **ZCode System**: Análisis estadístico avanzado
- **Trademate Sports**: Plataforma de algoritmos
- **OddsJam**: Análisis de valor
- **BetBurger**: Detección de arbitraje

### Proveedores B2B
- **Altenar**: Infraestructura compartida, soporte legal
- **BtoBet**: Soluciones de software iGaming
- **Evolution Gaming**: Casino en vivo
- **Microgaming**: Tragaperras online

Ver [INTEGRATIONS.md](./INTEGRATIONS.md) para detalles completos.

## 📝 Licencia

Proprietary - Todos los derechos reservados

## 👥 Equipo

Desarrollado para el mercado predictivo y apuestas deportivas.

