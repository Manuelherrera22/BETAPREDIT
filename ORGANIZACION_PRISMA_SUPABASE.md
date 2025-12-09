# 🗂️ Organización: Prisma + Supabase - BETAPREDIT

## 📚 Documentos Creados

### **1. GUIA_COMPLETA_PRISMA_SUPABASE.md** ⭐ PRINCIPAL
- Guía completa paso a paso
- Cómo obtener DATABASE_URL
- Todos los comandos de Prisma
- Solución de problemas detallada
- Flujos de trabajo

### **2. RESUMEN_PRISMA_SUPABASE.md** ⚡ RÁPIDO
- Resumen ejecutivo
- Comandos más usados
- Checklist rápido
- Referencia rápida

### **3. Scripts de Verificación**
- `backend/scripts/verify-prisma-supabase.js`
- Ejecutar: `npm run verify-prisma`

---

## 🎯 Configuración Actual

### **✅ Estado del Proyecto:**

1. **Base de Datos:** Supabase PostgreSQL
2. **ORM:** Prisma
3. **Schema:** `backend/prisma/schema.prisma`
4. **Migraciones:** `backend/prisma/migrations/`
5. **Modelo ExternalBet:** ✅ Ya existe en schema y migraciones

### **📦 Migraciones Existentes:**

```
backend/prisma/migrations/
├── 20251208180955_init/              ✅ Inicial (incluye ExternalBet)
├── 20251208183607_add_google_oauth/  ✅ OAuth
├── 20251208191610_add_referrals_and_templates/ ✅ Referrals
└── 20251209070418_add_preferred_mode/ ✅ Preferred Mode
```

**✅ El modelo ExternalBet ya está en la migración inicial**

---

## 🔧 Configuración Requerida

### **Backend (.env):**

```env
# ============================================
# SUPABASE DATABASE (Para Prisma)
# ============================================
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"

# ============================================
# SUPABASE CLIENT (Para Auth, Storage, etc.)
# ============================================
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

---

## ⚡ Comandos NPM Agregados

En `backend/package.json`:

```json
{
  "scripts": {
    "verify-prisma": "node scripts/verify-prisma-supabase.js",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:status": "prisma migrate status",
    "db:studio": "prisma studio",
    "generate": "prisma generate"
  }
}
```

**Uso:**
```bash
cd backend
npm run verify-prisma    # Verificar configuración
npm run db:migrate       # Aplicar migraciones (producción)
npm run db:migrate:dev   # Crear y aplicar migración (desarrollo)
npm run db:status        # Ver estado de migraciones
npm run db:studio        # Abrir Prisma Studio
npm run generate         # Generar Prisma Client
```

---

## ✅ Verificación Rápida

### **1. Verificar Configuración:**
```bash
cd backend
npm run verify-prisma
```

### **2. Verificar Migraciones:**
```bash
cd backend
npm run db:status
```

**Esperado:**
```
✅ Database connection successful!
✅ All migrations have been applied
```

### **3. Verificar Conexión:**
```bash
cd backend
npm run db:studio
```

Si se abre Prisma Studio → ✅ Conexión OK

---

## 🚀 Flujo de Trabajo Típico

### **Primera Vez (Setup):**

```bash
# 1. Configurar .env con DATABASE_URL
# 2. Verificar configuración
cd backend
npm run verify-prisma

# 3. Generar Prisma Client
npm run generate

# 4. Aplicar migraciones existentes
npm run db:migrate

# 5. Verificar
npm run db:status
```

### **Agregar Cambios al Schema:**

```bash
# 1. Editar backend/prisma/schema.prisma
# 2. Crear migración
cd backend
npm run db:migrate:dev -- --name descripcion_cambio

# 3. Verificar
npm run db:status
```

### **Desplegar a Producción:**

```bash
# 1. Aplicar migraciones
cd backend
npm run db:migrate

# 2. Verificar estado
npm run db:status
```

---

## 📊 Estado Actual del Schema

### **Modelos Principales:**

- ✅ `User` - Usuarios
- ✅ `ExternalBet` - Apuestas externas (nuevo)
- ✅ `ValueBetAlert` - Alertas de value bets
- ✅ `Event` - Eventos deportivos
- ✅ `OddsComparison` - Comparación de cuotas
- ✅ `UserStatistics` - Estadísticas de usuario
- ✅ Y más...

### **Modelo ExternalBet:**

```prisma
model ExternalBet {
  id              String  @id @default(cuid())
  userId          String
  platform        String
  marketType      String
  selection       String
  odds            Float
  stake           Float
  status          ExternalBetStatus @default(PENDING)
  // ... más campos
}
```

**✅ Ya existe en schema y migraciones**

---

## 🔍 Verificación de Integridad

### **Checklist:**

- [x] Schema.prisma tiene modelo ExternalBet
- [x] Migración inicial incluye ExternalBet
- [x] Scripts NPM agregados
- [x] Documentación creada
- [ ] DATABASE_URL configurada (verificar manualmente)
- [ ] Migraciones aplicadas (ejecutar `npm run db:migrate`)

---

## 🐛 Solución de Problemas Rápida

### **Problema: "Can't reach database server"**
```bash
# Verificar DATABASE_URL
npm run verify-prisma

# Verificar contraseña en Supabase Dashboard
# Settings → Database → Connection string
```

### **Problema: "Migration failed"**
```bash
# Ver estado
npm run db:status

# Si hay conflictos, revisar migraciones
# O resetear en desarrollo (⚠️ borra datos)
npx prisma migrate reset
```

### **Problema: "Schema out of sync"**
```bash
# Sincronizar desde DB
npx prisma db pull

# Revisar cambios y crear migración si es necesario
npm run db:migrate:dev -- --name sync_changes
```

---

## 📝 Notas Importantes

1. **SIEMPRE usar Supabase** - No configurar otras DBs
2. **DATABASE_URL** debe apuntar a Supabase PostgreSQL
3. **Migraciones** se aplican a Supabase automáticamente
4. **Nunca hacer `migrate reset` en producción**
5. **Verificar `migrate status` antes de desplegar**

---

## 🎯 Próximos Pasos

1. **Verificar configuración:**
   ```bash
   cd backend
   npm run verify-prisma
   ```

2. **Aplicar migraciones (si no están aplicadas):**
   ```bash
   npm run db:migrate
   ```

3. **Verificar estado:**
   ```bash
   npm run db:status
   ```

4. **Probar conexión:**
   ```bash
   npm run db:studio
   ```

---

## 📚 Referencias

- **Guía Completa:** `GUIA_COMPLETA_PRISMA_SUPABASE.md`
- **Resumen Rápido:** `RESUMEN_PRISMA_SUPABASE.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
- **Prisma Docs:** https://www.prisma.io/docs

---

**Estado:** ✅ **ORGANIZADO Y DOCUMENTADO**

**Última actualización:** Diciembre 2024

