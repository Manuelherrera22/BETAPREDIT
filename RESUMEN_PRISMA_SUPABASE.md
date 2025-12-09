# 📋 Resumen Ejecutivo: Prisma + Supabase

## 🎯 Puntos Clave

1. **Backend SIEMPRE usa Supabase** como base de datos PostgreSQL
2. **Prisma** es el ORM que gestiona el schema y las migraciones
3. **DATABASE_URL** debe apuntar a Supabase PostgreSQL
4. **Migraciones** sincronizan el schema con la base de datos

---

## ⚡ Comandos Rápidos

### **Verificación:**
```bash
cd backend
npm run verify-prisma
```

### **Configuración Inicial:**
```bash
cd backend
npx prisma generate          # Generar Prisma Client
npx prisma migrate deploy    # Aplicar migraciones
npx prisma migrate status    # Verificar estado
```

### **Agregar Cambios:**
```bash
cd backend
# 1. Editar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name descripcion_cambio
```

### **Ver Base de Datos:**
```bash
cd backend
npx prisma studio
```

---

## 🔑 Variables de Entorno Requeridas

En `backend/.env`:

```env
# Conexión a Supabase PostgreSQL (para Prisma)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"

# Supabase Client (para Auth, Storage, etc.)
SUPABASE_URL=https://mdjzqxhjbisnlfpbjfgb.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

---

## 📍 Obtener DATABASE_URL

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Settings → Database
3. Copia "Connection string" (formato URI)
4. Reemplaza `[PASSWORD]` con tu contraseña real

**Formato:**
```
postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
```

---

## ✅ Checklist de Configuración

- [ ] `DATABASE_URL` configurada en `backend/.env`
- [ ] Contraseña reemplazada (no `[PASSWORD]`)
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma migrate deploy` ejecutado
- [ ] `npx prisma migrate status` muestra todo OK
- [ ] Backend se conecta correctamente

---

## 🐛 Problemas Comunes

### **"Can't reach database server"**
→ Verifica DATABASE_URL y contraseña

### **"Migration failed"**
→ Ejecuta `npx prisma migrate status` para ver estado

### **"Schema is out of sync"**
→ Ejecuta `npx prisma db pull` para sincronizar

---

## 📚 Documentación Completa

Ver `GUIA_COMPLETA_PRISMA_SUPABASE.md` para:
- Guía detallada paso a paso
- Solución de problemas avanzada
- Flujos de trabajo completos
- Mejores prácticas

---

## 🚀 Flujo Típico

```bash
# 1. Configurar .env
# 2. Generar client
npx prisma generate

# 3. Aplicar migraciones
npx prisma migrate deploy

# 4. Verificar
npx prisma migrate status

# 5. Probar
npx prisma studio
```

---

**Última actualización:** Diciembre 2024

