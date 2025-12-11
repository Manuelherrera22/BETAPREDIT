# 🔧 Guía de Troubleshooting - BETAPREDIT

## 🐛 Problemas Comunes y Soluciones

### Backend

#### 1. Error: "Cannot connect to database"
**Síntomas:**
- `PrismaClientInitializationError`
- `Can't reach database server`

**Soluciones:**
```bash
# 1. Verificar DATABASE_URL
echo $DATABASE_URL

# 2. Verificar conexión
npm run verify-db

# 3. Verificar que Supabase esté activo
# Ve a Supabase Dashboard → Settings → Database

# 4. Verificar firewall/red
# Asegúrate de que el servidor pueda acceder a Supabase
```

---

#### 2. Error: "JWT_SECRET not configured"
**Síntomas:**
- `JWT_SECRET not configured`
- Errores de autenticación

**Soluciones:**
```bash
# 1. Verificar variable de entorno
echo $JWT_SECRET

# 2. Generar nuevo secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Agregar a .env
JWT_SECRET=tu_secret_generado
```

---

#### 3. Error: "API-Football service not initialized"
**Síntomas:**
- `API-Football service not initialized`
- Predicciones sin datos reales

**Soluciones:**
```bash
# 1. Verificar API_FOOTBALL_KEY
echo $API_FOOTBALL_KEY

# 2. Verificar que la key sea válida
# Ve a https://www.api-football.com/documentation-v3

# 3. El servicio funcionará con datos por defecto si no hay key
# Pero las predicciones serán menos precisas
```

---

#### 4. Error: "Redis connection failed"
**Síntomas:**
- `Redis connection failed`
- Sistema funciona pero sin cache

**Soluciones:**
```bash
# 1. Redis es opcional - el sistema usa RedisMock si no está disponible
# Para deshabilitar completamente:
REDIS_DISABLED=true

# 2. Si quieres usar Redis:
# Configurar REDIS_URL o instalar Redis localmente
```

---

#### 5. Error: "Rate limit exceeded"
**Síntomas:**
- `Too many requests`
- Error 429

**Soluciones:**
```bash
# 1. Esperar unos minutos
# 2. Verificar límites en rate-limiter-granular.ts
# 3. Si es desarrollo, puedes aumentar límites temporalmente
```

---

### Frontend

#### 1. Error: "Network error"
**Síntomas:**
- `Network error. Please check your connection.`
- No se pueden hacer requests

**Soluciones:**
```bash
# 1. Verificar VITE_API_URL
echo $VITE_API_URL

# 2. Verificar que backend esté corriendo
curl http://localhost:3000/health

# 3. Verificar CORS en backend
# Asegúrate de que FRONTEND_URL esté en allowedOrigins

# 4. Verificar firewall/antivirus
```

---

#### 2. Error: "Unauthorized" en todas las requests
**Síntomas:**
- `401 Unauthorized`
- No se puede acceder a datos

**Soluciones:**
```bash
# 1. Verificar que el usuario esté logueado
# 2. Verificar que el token se esté enviando
# 3. Verificar que el token no haya expirado
# 4. Hacer logout y login nuevamente
```

---

#### 3. Error: "Cannot find module"
**Síntomas:**
- `Cannot find module './components/X'`
- Build falla

**Soluciones:**
```bash
# 1. Verificar que el archivo exista
ls frontend/src/components/X.tsx

# 2. Verificar imports
# Asegúrate de que la ruta sea correcta

# 3. Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install

# 4. Verificar TypeScript
npm run build
```

---

#### 4. Error: "Predicciones muestran N/A"
**Síntomas:**
- Datos muestran "N/A"
- `dataQuality.canDisplay: false`

**Soluciones:**
```bash
# 1. Verificar que las predicciones se estén generando
# Backend logs deberían mostrar "Auto predictions: X generated"

# 2. Verificar que API-Football tenga datos
# El sistema regenerará automáticamente cada 30 minutos

# 3. Verificar que eventos estén sincronizados
# El sistema sincroniza eventos cada 4 horas

# 4. Regenerar manualmente (si es necesario)
POST /api/predictions/generate
```

---

### Base de Datos

#### 1. Error: "Migration failed"
**Síntomas:**
- `Migration failed`
- Schema out of sync

**Soluciones:**
```bash
# 1. Verificar estado de migraciones
npm run db:status

# 2. Verificar que DATABASE_URL sea correcta
npm run verify-prisma

# 3. Si hay conflictos, revisar migraciones
# O resetear en desarrollo (⚠️ borra datos)
npx prisma migrate reset

# 4. Aplicar migraciones manualmente
npm run db:migrate
```

---

#### 2. Error: "Schema out of sync"
**Síntomas:**
- `Schema is out of sync`
- Prisma Client no coincide con DB

**Soluciones:**
```bash
# 1. Sincronizar desde DB
npx prisma db pull

# 2. Revisar cambios y crear migración
npm run db:migrate:dev -- --name sync_changes

# 3. Regenerar Prisma Client
npm run generate
```

---

### APIs Externas

#### 1. Error: "The Odds API quota exceeded"
**Síntomas:**
- `Quota exceeded`
- No se pueden obtener cuotas

**Soluciones:**
```bash
# 1. Verificar uso en The Odds API dashboard
# https://the-odds-api.com/liveapi/guides/v4/

# 2. El sistema tiene caching agresivo
# Verifica que el cache esté funcionando

# 3. Reducir frecuencia de requests
# Ajustar intervalos en scheduled-tasks.service.ts

# 4. Considerar upgrade de plan en The Odds API
```

---

#### 2. Error: "API-Football rate limit"
**Síntomas:**
- `Rate limit exceeded`
- Datos de fútbol no disponibles

**Soluciones:**
```bash
# 1. Verificar límites en API-Football dashboard
# https://www.api-football.com/documentation-v3

# 2. El sistema usa datos por defecto si no hay API
# Las predicciones funcionarán pero con menos precisión

# 3. Considerar upgrade de plan en API-Football
```

---

## 🔍 Comandos de Diagnóstico

### Backend
```bash
# Verificar conexión a DB
npm run verify-db

# Verificar Prisma
npm run verify-prisma

# Ver estado de migraciones
npm run db:status

# Ver logs en tiempo real
npm run dev  # En desarrollo
# O en producción: railway logs / heroku logs --tail

# Verificar health
curl http://localhost:3000/health
```

### Frontend
```bash
# Verificar build
npm run build

# Verificar TypeScript
npm run build  # TypeScript check incluido

# Verificar linter
npm run lint

# Ver logs en consola del navegador
# F12 → Console
```

### Base de Datos
```bash
# Abrir Prisma Studio (GUI)
npm run db:studio

# Verificar conexión
npx prisma db execute --stdin <<< "SELECT 1"

# Ver tablas
npx prisma db execute --stdin <<< "\dt"
```

---

## 📞 Soporte

Si el problema persiste:

1. **Revisar logs:**
   - Backend: `railway logs` o `heroku logs --tail`
   - Frontend: Consola del navegador (F12)

2. **Verificar documentación:**
   - `DEPLOYMENT_GUIDE.md`
   - `README.md`
   - Swagger docs: `/api-docs`

3. **Contactar soporte:**
   - Email: support@betapredit.com
   - Incluir: logs, pasos para reproducir, screenshots

---

## ✅ Checklist de Diagnóstico Rápido

- [ ] Backend corriendo y accesible (`/health`)
- [ ] Frontend build exitoso
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Migraciones aplicadas
- [ ] APIs externas configuradas (opcional)
- [ ] CORS configurado correctamente
- [ ] No hay errores en logs
- [ ] Swagger docs accesible (`/api-docs`)

---

**Última actualización:** Enero 2025

