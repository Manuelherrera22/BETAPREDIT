# 🚀 Inicio Rápido - BETAPREDIT

## Servicios Iniciados

Los servicios se están iniciando. Espera unos segundos y luego accede a:

### 🌐 Frontend
**URL**: http://localhost:5173

### 🔧 Backend API
**URL**: http://localhost:3000
**Health Check**: http://localhost:3000/health

### 🤖 ML Services (Opcional)
**URL**: http://localhost:8000

## Notas Importantes

### ⚠️ Modo de Desarrollo Sin Docker

Si no tienes Docker instalado, la plataforma funciona en modo de desarrollo con:
- **Base de datos**: Mock en memoria (no persistente)
- **Redis**: Mock en memoria (no persistente)
- **Datos**: Se perderán al reiniciar

### ✅ Para Producción Completa

1. **Instala Docker Desktop**: https://www.docker.com/products/docker-desktop
2. **Inicia servicios de infraestructura**:
   ```powershell
   docker compose up -d postgres redis
   ```
3. **Configura base de datos**:
   ```powershell
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

## Uso de la Plataforma

### 1. Registro/Login
- Ve a http://localhost:5173
- Crea una cuenta nueva o inicia sesión

### 2. Explorar Eventos
- Navega a la sección de eventos
- Ver eventos en vivo y próximos

### 3. Realizar Apuestas
- Selecciona un evento
- Elige una apuesta y colócala

### 4. Juego Responsable
- Configura límites de depósito, pérdidas y sesión
- Revisa alertas de comportamiento

## Comandos Útiles

### Detener Servicios
```powershell
# Detener backend (Ctrl+C en la terminal)
# Detener frontend (Ctrl+C en la terminal)
```

### Reiniciar Servicios
```powershell
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Ver Logs
Los logs del backend se guardan en `backend/logs/`

## Solución de Problemas

### Puerto ya en uso
Si el puerto 3000 o 5173 está ocupado:
- Cambia el puerto en `backend/.env` (PORT=3001)
- Cambia el puerto en `frontend/vite.config.ts`

### Error de conexión
- Verifica que los servicios estén corriendo
- Revisa los logs en las terminales
- Verifica que no haya errores en la consola del navegador

## Próximos Pasos

1. **Configurar APIs externas**: Agrega tus API keys en `backend/.env`
2. **Configurar base de datos real**: Instala Docker y configura PostgreSQL
3. **Personalizar**: Modifica estilos, agregar funcionalidades
4. **Desplegar**: Prepara para producción

¡Disfruta explorando BETAPREDIT! 🎉

