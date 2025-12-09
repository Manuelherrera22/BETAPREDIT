# 🗄️ Guía Completa: Prisma + Supabase + Migraciones

**IMPORTANTE:** El backend SIEMPRE usa Supabase como base de datos PostgreSQL.

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Obtener DATABASE_URL de Supabase](#obtener-database_url-de-supabase)
3. [Migraciones de Prisma](#migraciones-de-prisma)
4. [Comandos Esenciales](#comandos-esenciales)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Configuración Inicial

### **1. Variables de Entorno Requeridas**

En `backend/.env`:

```env
# ============================================
# SUPABASE DATABASE CONNECTION
# ============================================
# URL de conexión a Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"

# ============================================
# SUPABASE CONFIGURATION
# ============================================
# URL del proyecto Supabase
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co

# Clave anónima (para operaciones del cliente)
SUPABASE_ANON_KEY=tu_anon_key_aqui

# Clave de servicio (para operaciones admin - SECRETO)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**⚠️ IMPORTANTE:** 
- `DATABASE_URL` es para Prisma (conexión directa a PostgreSQL)
- `SUPABASE_URL` y keys son para Supabase Client (Auth, Storage, etc.)

---

## 🔑 Obtener DATABASE_URL de Supabase

### **Paso 1: Ir al Dashboard de Supabase**

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Inicia sesión si es necesario

### **Paso 2: Obtener Connection String**

1. Ve a **Settings** → **Database**
2. Busca la sección **"Connection string"** o **"Connection info"**
3. Selecciona el formato **"URI"**

### **Paso 3: Copiar y Configurar**

Tienes **2 opciones**:

#### **Opción A: Connection Pooling (RECOMENDADO para producción)**

```
postgresql://postgres.mdjzqxhjbisnlfpbjfgb:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Características:**
- ✅ Mejor para producción
- ✅ Maneja múltiples conexiones
- ✅ Puerto: `6543`
- ✅ Usa `pooler.supabase.com`

#### **Opción B: Direct Connection (Para desarrollo)**

```
postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
```

**Características:**
- ✅ Más simple
- ✅ Puerto: `5432`
- ✅ Usa `db.[PROJECT_ID].supabase.co`

### **Paso 4: Reemplazar [PASSWORD]**

1. Si no conoces la contraseña:
   - Ve a **Settings** → **Database**
   - Busca **"Database password"**
   - Si no la recuerdas, puedes resetearla (⚠️ esto desconectará todas las conexiones activas)

2. Reemplaza `[PASSWORD]` en la URL con tu contraseña real

3. Si la contraseña tiene caracteres especiales, usa URL encoding:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - etc.

### **Ejemplo Final:**

```env
# Para desarrollo (direct connection)
DATABASE_URL="postgresql://postgres:mi_password_segura@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"

# Para producción (connection pooling)
DATABASE_URL="postgresql://postgres.mdjzqxhjbisnlfpbjfgb:mi_password_segura@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## 🚀 Migraciones de Prisma

### **¿Qué son las Migraciones?**

Las migraciones de Prisma son archivos SQL que:
- Crean/modifican tablas en la base de datos
- Sincronizan el schema de Prisma con Supabase
- Mantienen el historial de cambios

### **Estructura de Migraciones**

```
backend/prisma/
├── schema.prisma          # Schema principal
└── migrations/
    ├── 20251208180955_init/
    │   └── migration.sql
    ├── 20251208183607_add_google_oauth/
    │   └── migration.sql
    └── migration_lock.toml
```

---

## 📝 Comandos Esenciales

### **1. Generar Prisma Client**

```bash
cd backend
npx prisma generate
```

**Cuándo usarlo:**
- Después de cambiar `schema.prisma`
- Después de ejecutar migraciones
- Al instalar dependencias

---

### **2. Crear Nueva Migración**

```bash
cd backend
npx prisma migrate dev --name nombre_descriptivo
```

**Ejemplo:**
```bash
npx prisma migrate dev --name add_external_bets_table
```

**Qué hace:**
1. Detecta cambios en `schema.prisma`
2. Crea archivo SQL de migración
3. Aplica la migración a la base de datos
4. Genera Prisma Client actualizado

**⚠️ IMPORTANTE:** Este comando modifica la base de datos directamente.

---

### **3. Aplicar Migraciones Existentes**

```bash
cd backend
npx prisma migrate deploy
```

**Cuándo usarlo:**
- En producción
- Cuando ya existen migraciones y solo quieres aplicarlas
- No crea nuevas migraciones, solo aplica las existentes

---

### **4. Ver Estado de Migraciones**

```bash
cd backend
npx prisma migrate status
```

**Qué muestra:**
- ✅ Migraciones aplicadas
- ⚠️ Migraciones pendientes
- ❌ Errores

---

### **5. Resetear Base de Datos (⚠️ PELIGROSO)**

```bash
cd backend
npx prisma migrate reset
```

**⚠️ ADVERTENCIA:** 
- **BORRA TODOS LOS DATOS**
- Solo usar en desarrollo
- Nunca usar en producción

---

### **6. Ver Base de Datos (Prisma Studio)**

```bash
cd backend
npx prisma studio
```

**Qué hace:**
- Abre interfaz visual en http://localhost:5555
- Permite ver y editar datos
- Útil para debugging

---

### **7. Sincronizar Schema desde Base de Datos**

```bash
cd backend
npx prisma db pull
```

**Cuándo usarlo:**
- Si la base de datos fue modificada manualmente
- Para sincronizar `schema.prisma` con la DB real
- Genera `schema.prisma` basado en la DB

---

### **8. Validar Schema**

```bash
cd backend
npx prisma validate
```

**Qué hace:**
- Verifica que `schema.prisma` es válido
- No modifica nada
- Útil antes de crear migraciones

---

## 🔄 Flujo de Trabajo

### **Escenario 1: Agregar Nueva Tabla/Campo**

1. **Editar `schema.prisma`:**
   ```prisma
   model ExternalBet {
     id     String @id @default(cuid())
     // ... campos
   }
   ```

2. **Crear migración:**
   ```bash
   npx prisma migrate dev --name add_external_bets
   ```

3. **Verificar:**
   ```bash
   npx prisma migrate status
   ```

4. **Probar:**
   ```bash
   npx prisma studio
   ```

---

### **Escenario 2: Desplegar a Producción**

1. **Verificar migraciones pendientes:**
   ```bash
   npx prisma migrate status
   ```

2. **Aplicar migraciones:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Verificar conexión:**
   ```bash
   npx prisma db pull
   ```

---

### **Escenario 3: Sincronizar Cambios Manuales**

Si alguien modificó la DB manualmente:

1. **Pull desde DB:**
   ```bash
   npx prisma db pull
   ```

2. **Revisar cambios en `schema.prisma`**

3. **Crear migración si es necesario:**
   ```bash
   npx prisma migrate dev --name sync_manual_changes
   ```

---

## 🔍 Verificación de Configuración

### **Test 1: Verificar Variables de Entorno**

```bash
cd backend

# Verificar que DATABASE_URL está configurada
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL configurada' : '❌ DATABASE_URL faltante')"
```

---

### **Test 2: Verificar Conexión**

```bash
cd backend
npx prisma db pull
```

**✅ Si funciona:** Verás el schema sincronizado  
**❌ Si falla:** Revisa DATABASE_URL y contraseña

---

### **Test 3: Verificar Migraciones**

```bash
cd backend
npx prisma migrate status
```

**✅ Esperado:** Todas las migraciones aplicadas

---

### **Test 4: Verificar Prisma Client**

```bash
cd backend
npx prisma generate
```

**✅ Si funciona:** Client generado correctamente

---

## 🐛 Solución de Problemas

### **Problema 1: "Can't reach database server"**

**Causas:**
- DATABASE_URL incorrecta
- Contraseña incorrecta
- Proyecto Supabase pausado
- Firewall bloqueando conexión

**Soluciones:**

1. **Verificar URL:**
   ```bash
   # Debe tener formato:
   postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
   ```

2. **Verificar contraseña:**
   - Ve a Supabase Dashboard → Settings → Database
   - Verifica o resetea la contraseña

3. **Verificar proyecto:**
   - Ve a https://supabase.com/dashboard
   - Asegúrate que el proyecto esté activo

4. **Probar con Connection Pooling:**
   - Usa el formato con `pooler.supabase.com:6543`

---

### **Problema 2: "Migration failed"**

**Causas:**
- Conflicto con migraciones existentes
- Schema desincronizado
- Permisos insuficientes

**Soluciones:**

1. **Ver estado:**
   ```bash
   npx prisma migrate status
   ```

2. **Resolver conflictos:**
   ```bash
   # Si hay migraciones pendientes
   npx prisma migrate deploy
   ```

3. **Resetear si es desarrollo:**
   ```bash
   npx prisma migrate reset
   ```

---

### **Problema 3: "Schema is out of sync"**

**Causa:** La base de datos tiene cambios que no están en `schema.prisma`

**Solución:**

```bash
# Sincronizar desde DB
npx prisma db pull

# Revisar cambios
# Crear migración si es necesario
npx prisma migrate dev --name sync_changes
```

---

### **Problema 4: "Prisma Client not generated"**

**Solución:**

```bash
npx prisma generate
```

**Verificar:**
```bash
ls node_modules/.prisma/client
```

---

## 📊 Checklist de Configuración

### **Backend (.env):**
- [ ] `DATABASE_URL` configurada con contraseña correcta
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (opcional para admin)

### **Prisma:**
- [ ] `schema.prisma` actualizado
- [ ] Migraciones ejecutadas: `npx prisma migrate deploy`
- [ ] Prisma Client generado: `npx prisma generate`
- [ ] Conexión verificada: `npx prisma db pull`

### **Verificación:**
- [ ] Backend se conecta a Supabase
- [ ] Logs muestran: `✅ Connected to Supabase database successfully`
- [ ] Prisma Studio funciona: `npx prisma studio`

---

## 🎯 Resumen Rápido

### **Configuración Inicial:**
```bash
# 1. Configurar .env con DATABASE_URL
# 2. Generar Prisma Client
npx prisma generate

# 3. Aplicar migraciones
npx prisma migrate deploy

# 4. Verificar
npx prisma migrate status
```

### **Agregar Cambios:**
```bash
# 1. Editar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name descripcion

# 3. Verificar
npx prisma migrate status
```

### **Desplegar:**
```bash
# 1. Aplicar migraciones
npx prisma migrate deploy

# 2. Verificar
npx prisma db pull
```

---

## 📚 Recursos Adicionales

- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Docs:** https://supabase.com/docs
- **Supabase Dashboard:** https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb

---

## ⚠️ Recordatorios Importantes

1. **SIEMPRE usar Supabase** - No configurar otras bases de datos
2. **Nunca hacer `migrate reset` en producción**
3. **Backup antes de migraciones importantes**
4. **Verificar `migrate status` antes de desplegar**
5. **Usar Connection Pooling en producción**

---

**Última actualización:** Diciembre 2024

