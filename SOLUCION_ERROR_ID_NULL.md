# ✅ Solución: Errores "null value in column" (ID, updatedAt)

## ❌ **PROBLEMAS IDENTIFICADOS**

### **Error 1: null value in column "id"**
```
Error creating sport icehockey_nhl: {
  code: "23502",
  message: 'null value in column "id" of relation "Sport" violates not-null constraint'
}
```

### **Error 2: null value in column "updatedAt"**
```
Error creating sport icehockey_nhl: {
  code: "23502",
  message: 'null value in column "updatedAt" of relation "Sport" violates not-null constraint'
}
```

**Causa:** Supabase no genera automáticamente:
- El ID cuando se usa `.insert()` directamente (aunque el schema tenga `@default(cuid())`)
- Los campos `createdAt` y `updatedAt` (aunque el schema tenga `@default(now())` y `@updatedAt`)

Estos defaults solo funcionan cuando se usa Prisma Client, no cuando se inserta directamente en Supabase.

---

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **1. Generar ID y Timestamps Manualmente para Sport**

**Antes:**
```typescript
.insert({
  name: oddsEvent.sport_title,
  slug: oddsEvent.sport_key,
  isActive: true,
})
```

**Ahora:**
```typescript
const sportId = crypto.randomUUID();
const now = new Date().toISOString();
.insert({
  id: sportId, // ⚠️ CRÍTICO: Especificar ID manualmente
  name: oddsEvent.sport_title,
  slug: oddsEvent.sport_key,
  isActive: true,
  createdAt: now, // ⚠️ CRÍTICO: Supabase no genera automáticamente
  updatedAt: now, // ⚠️ CRÍTICO: Supabase no genera automáticamente
})
```

### **2. Generar ID y Timestamps Manualmente para Event**

**Antes:**
```typescript
.insert({
  externalId: oddsEvent.id,
  sportId: sportData.id,
  // ... otros campos
})
```

**Ahora:**
```typescript
const eventId = crypto.randomUUID();
const now = new Date().toISOString();
.insert({
  id: eventId, // ⚠️ CRÍTICO: Especificar ID manualmente
  externalId: oddsEvent.id,
  sportId: sportData.id,
  // ... otros campos
  createdAt: now, // ⚠️ CRÍTICO: Supabase no genera automáticamente
  updatedAt: now, // ⚠️ CRÍTICO: Supabase no genera automáticamente
})
```

### **3. Manejo de Error de ID Duplicado**

Si el Sport ya existe (ID duplicado), ahora:
- Detecta el error `23505` (unique violation)
- Busca el Sport existente por `slug`
- Continúa con el Sport existente en lugar de fallar

---

## 🎯 **RESULTADO ESPERADO**

Después de esta corrección:

1. **Los Sports se crearán correctamente:**
   - Con ID generado manualmente (UUID)
   - Con `createdAt` y `updatedAt` establecidos
   - Sin errores de "null value in column"

2. **Los Events se crearán correctamente:**
   - Con ID generado manualmente (UUID)
   - Con `createdAt` y `updatedAt` establecidos
   - Con `status = 'SCHEDULED'`
   - Con `isActive = true`

3. **Los eventos aparecerán en el frontend:**
   - `get-events` encontrará los eventos
   - El frontend los mostrará correctamente

---

## 🔍 **VERIFICACIÓN**

### **1. Sincronizar Eventos**

1. Haz clic en "Sincronizar desde API"
2. Espera a que termine

### **2. Revisar Logs de sync-events**

Busca en los logs:
- ✅ `Created event:` (debería aparecer para cada evento)
- ✅ `Synced X events for sport Y`
- ✅ `After sync: Total SCHEDULED events in DB: X` (debería ser > 0)
- ❌ NO deberías ver errores de "null value in column id" o "null value in column updatedAt"

### **3. Verificar en Table Editor**

1. Ve a: Supabase Dashboard → Table Editor → Event
2. Deberías ver eventos con:
   - `status = 'SCHEDULED'`
   - `isActive = true`
   - `startTime` en el futuro

---

## 📊 **LOGS ESPERADOS**

### **En sync-events:**
```
Created event: { id: "...", name: "...", status: "SCHEDULED", startTime: "...", isActive: true }
Synced 15 events for sport soccer_epl
After sync: Total SCHEDULED events in DB: 45
After sync: Upcoming SCHEDULED events: 42
```

### **En get-events:**
```
Found 42 events with status=SCHEDULED, sportId=all
```

### **En frontend:**
```
get-events response: { success: true, dataLength: 42 }
```

---

## ✅ **ESTADO**

- ✅ ID generado manualmente para Sport (UUID)
- ✅ ID generado manualmente para Event (UUID)
- ✅ `createdAt` y `updatedAt` establecidos manualmente para Sport
- ✅ `createdAt` y `updatedAt` establecidos manualmente para Event
- ✅ Manejo de errores de ID duplicado
- ✅ Edge Function desplegada

**Prueba sincronizar eventos nuevamente. Deberían crearse correctamente y aparecer en el frontend.**

