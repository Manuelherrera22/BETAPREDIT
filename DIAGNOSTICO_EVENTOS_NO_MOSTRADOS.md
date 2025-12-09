# 🔍 Diagnóstico: Eventos Sincronizados Pero No Mostrados

## ❌ **PROBLEMA IDENTIFICADO**

Los eventos se sincronizan correctamente desde The Odds API a Supabase, pero **NO se muestran** en el frontend.

---

## 🔍 **CAUSAS ENCONTRADAS**

### **1. Campo `isActive` No Existe en Schema de Prisma**

**Problema:**
- El modelo `Event` en `backend/prisma/schema.prisma` **NO tiene** el campo `isActive`
- Pero `sync-events` intenta establecer `isActive: true` al crear eventos
- Y `get-events` filtra por `isActive: true`

**Resultado:**
- Los eventos se crean sin `isActive` (o con error si el campo no existe en BD)
- `get-events` no encuentra eventos porque filtra por `isActive: true`

---

## ✅ **SOLUCIONES IMPLEMENTADAS**

### **1. Agregar `isActive: true` en sync-events**

**Archivo:** `supabase/functions/sync-events/index.ts`

**Cambios:**
- ✅ Agregado `isActive: true` al crear nuevos eventos
- ✅ Agregado `isActive: true` al actualizar eventos existentes

### **2. Manejo de Error en get-events**

**Archivo:** `supabase/functions/get-events/index.ts`

**Cambios:**
- ✅ Si el filtro `isActive` falla (campo no existe), reintenta sin ese filtro
- ✅ Logging agregado para debug
- ✅ Fallback automático si `isActive` no está disponible

### **3. Corregir uso de `createdAt` vs `created_at`**

**Archivo:** `supabase/functions/sync-events/index.ts`

**Cambios:**
- ✅ Manejo de ambos formatos (`createdAt` y `created_at`)
- ✅ Compatible con Supabase (snake_case) y Prisma (camelCase)

---

## 🎯 **PRÓXIMOS PASOS**

### **Opción 1: Agregar `isActive` al Schema (Recomendado)**

Si queremos usar `isActive` para filtrar eventos:

1. Agregar al schema de Prisma:
```prisma
model Event {
  // ... campos existentes
  isActive Boolean @default(true)
}
```

2. Ejecutar migración:
```bash
npx prisma migrate dev --name add_isActive_to_event
```

3. Aplicar migración a Supabase:
```bash
npx prisma db push
```

### **Opción 2: Remover Filtro `isActive` (Temporal)**

Si no queremos usar `isActive`:

1. Remover `isActive: true` de `sync-events`
2. Remover filtro `.eq('isActive', true)` de `get-events`
3. Mostrar todos los eventos independientemente de su estado

---

## 📊 **ESTADO ACTUAL**

- ✅ `sync-events` establece `isActive: true` (si el campo existe)
- ✅ `get-events` tiene fallback si `isActive` no existe
- ⚠️ **PENDIENTE**: Verificar si `isActive` existe en la BD real
- ⚠️ **PENDIENTE**: Agregar migración si es necesario

---

## 🧪 **VERIFICACIÓN**

Para verificar si funciona:

1. **Sincronizar eventos:**
   - Hacer clic en "Sincronizar desde API"
   - Verificar en logs de Supabase que se crearon eventos

2. **Verificar en BD:**
   ```sql
   SELECT id, name, "isActive", status, "startTime" 
   FROM "Event" 
   WHERE status = 'SCHEDULED' 
   ORDER BY "startTime" ASC 
   LIMIT 10;
   ```

3. **Verificar get-events:**
   - Revisar logs de la Edge Function `get-events`
   - Ver si retorna eventos o error por `isActive`

---

## 🔧 **SI SIGUE SIN FUNCIONAR**

1. **Verificar logs de Supabase:**
   - Edge Functions → `get-events` → Logs
   - Buscar errores relacionados con `isActive`

2. **Verificar datos en BD:**
   - Supabase Dashboard → Table Editor → `Event`
   - Ver si hay eventos con `status = 'SCHEDULED'`
   - Ver si tienen `isActive` o no

3. **Probar sin filtro isActive:**
   - Temporalmente remover `.eq('isActive', true)` de `get-events`
   - Ver si aparecen eventos

---

## ✅ **RESULTADO ESPERADO**

Después de estas correcciones:
- ✅ Eventos se crean con `isActive: true` (si el campo existe)
- ✅ `get-events` funciona con o sin `isActive`
- ✅ Frontend muestra eventos correctamente
- ✅ Otras funcionalidades que dependen de eventos funcionan

