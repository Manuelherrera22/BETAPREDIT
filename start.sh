#!/bin/bash
# Script de inicio para BETAPREDIT (Linux/Mac)

echo "🚀 Iniciando BETAPREDIT..."

# Verificar Docker
echo ""
echo "📦 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no encontrado. Por favor instala Docker"
    exit 1
fi
echo "✅ Docker encontrado"

# Iniciar servicios de infraestructura
echo ""
echo "🐳 Iniciando PostgreSQL y Redis..."
docker-compose up -d postgres redis

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 5

# Verificar dependencias del backend
echo ""
echo "📦 Verificando dependencias del backend..."
if [ ! -d "backend/node_modules" ]; then
    echo "Instalando dependencias del backend..."
    cd backend
    npm install
    cd ..
fi

# Verificar dependencias del frontend
echo ""
echo "📦 Verificando dependencias del frontend..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    cd frontend
    npm install
    cd ..
fi

# Verificar Prisma
echo ""
echo "🔧 Configurando base de datos..."
cd backend
if [ ! -d "node_modules/.prisma" ]; then
    echo "Generando Prisma Client..."
    npx prisma generate
fi

# Ejecutar migraciones
echo "Ejecutando migraciones..."
export DATABASE_URL="postgresql://betapredit:changeme@localhost:5432/betapredit"
npx prisma migrate dev --name init 2>/dev/null
cd ..

# Verificar dependencias de ML
echo ""
echo "🐍 Verificando dependencias de ML..."
if [ ! -d "ml-services/venv" ]; then
    echo "Creando entorno virtual de Python..."
    cd ml-services
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

echo ""
echo "✅ Todo está listo!"
echo ""
echo "Para iniciar los servicios, ejecuta:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd ml-services && source venv/bin/activate && python main.py"
echo "  Terminal 3: cd frontend && npm run dev"
echo ""
echo "O usa: npm run dev (desde la raíz)"

