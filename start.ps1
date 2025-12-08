# Script de inicio para BETAPREDIT (PowerShell)
Write-Host "🚀 Iniciando BETAPREDIT..." -ForegroundColor Green

# Verificar Docker
Write-Host "`n📦 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no encontrado. Por favor instala Docker Desktop" -ForegroundColor Red
    exit 1
}

# Iniciar servicios de infraestructura
Write-Host "`n🐳 Iniciando PostgreSQL y Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar que los servicios estén corriendo
$postgresRunning = docker ps --filter "name=betapredit-postgres" --format "{{.Names}}"
$redisRunning = docker ps --filter "name=betapredit-redis" --format "{{.Names}}"

if ($postgresRunning -and $redisRunning) {
    Write-Host "✅ PostgreSQL y Redis están corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

# Verificar dependencias del backend
Write-Host "`n📦 Verificando dependencias del backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Verificar dependencias del frontend
Write-Host "`n📦 Verificando dependencias del frontend..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Verificar Prisma
Write-Host "`n🔧 Configurando base de datos..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "node_modules/.prisma")) {
    Write-Host "Generando Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
}

# Ejecutar migraciones
Write-Host "Ejecutando migraciones..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://betapredit:changeme@localhost:5432/betapredit"
npx prisma migrate dev --name init 2>&1 | Out-Null
Set-Location ..

# Verificar dependencias de ML
Write-Host "`n🐍 Verificando dependencias de ML..." -ForegroundColor Yellow
if (-not (Test-Path "ml-services/venv")) {
    Write-Host "Creando entorno virtual de Python..." -ForegroundColor Yellow
    Set-Location ml-services
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Set-Location ..
}

Write-Host "`n✅ Todo está listo!" -ForegroundColor Green
Write-Host "`nPara iniciar los servicios, ejecuta:" -ForegroundColor Cyan
Write-Host "  Terminal 1: cd backend && npm run dev" -ForegroundColor White
Write-Host "  Terminal 2: cd ml-services && .\venv\Scripts\Activate.ps1 && python main.py" -ForegroundColor White
Write-Host "  Terminal 3: cd frontend && npm run dev" -ForegroundColor White
Write-Host "`nO usa: npm run dev (desde la raíz)" -ForegroundColor Cyan

