# 🔍 Instrucciones para Debug de Eventos

## 📊 **SITUACIÓN ACTUAL**

La consola muestra: `get-events response: {success: true, dataLength: 0}`

Esto significa que la Edge Function funciona pero **no retorna eventos**.

---

## 🔍 **PASO 1: Revisar Logs de Supabase**

### **1.1. Acceder a Logs**

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Click en **Edge Functions** (menú lateral)
3. Click en **get-events**
4. Click en la pestaña **Logs**

### **1.2. Buscar el Diagnóstico**

Después de recargar la página de eventos, busca en los logs:

```
=== DIAGNÓSTICO: No se encontraron eventos ===
1. Total events in DB: X
2. Scheduled events in DB: Y
3. Upcoming scheduled events (startTime >= now): Z
4. Sample events (first 5 SCHEDULED): [...]
5. Events without isActive filter: W
```

### **1.3. Interpretar Resultados**

**Escenario A: `Total events in DB: 0`**
- ❌ **Problema**: Los eventos NO se están creando
- ✅ **Solución**: Revisar logs de `sync-events` para ver errores

**Escenario B: `Scheduled events in DB: 0` pero `Total events: X > 0`**
- ❌ **Problema**: Eventos se crean con otro `status`
- ✅ **Solución**: Verificar que `sync-events` establezca `status: 'SCHEDULED'`

**Escenario C: `Upcoming scheduled events: 0` pero `Scheduled events: X > 0`**
- ❌ **Problema**: Eventos tienen `startTime` en el pasado
- ✅ **Solución**: Verificar que `startTime` sea futuro en `sync-events`

**Escenario D: `Sample events` muestra `isActive: null` o `isActive: false`**
- ❌ **Problema**: Filtro `isActive: true` está excluyendo eventos
- ✅ **Solución**: Ver más abajo

---

## 🔍 **PASO 2: Verificar en Table Editor**

### **2.1. Acceder a Table Editor**

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Click en **Table Editor** (menú lateral)
3. Click en la tabla **Event**

### **2.2. Verificar Datos**

Busca:
- ¿Hay filas en la tabla?
- ¿Qué `status` tienen los eventos?
- ¿Qué `startTime` tienen? (¿están en el futuro?)
- ¿Tienen `isActive`? (¿es `true`, `false`, o `null`?)

---

## 🔍 **PASO 3: Ejecutar Query SQL**

### **3.1. Acceder a SQL Editor**

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Click en **SQL Editor** (menú lateral)
3. Click en **New query**

### **3.2. Ejecutar Queries de Diagnóstico**

```sql
-- 1. Ver todos los eventos
SELECT id, name, status, "startTime", "isActive", "sportId", "createdAt"
FROM "Event"
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2. Ver distribución de status
SELECT status, COUNT(*) as count
FROM "Event"
GROUP BY status;

-- 3. Verificar si isActive existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Event'
  AND column_name = 'isActive';

-- 4. Ver eventos SCHEDULED próximos
SELECT id, name, status, "startTime", "isActive", NOW() as "now"
FROM "Event"
WHERE status = 'SCHEDULED'
  AND "startTime" >= NOW()
ORDER BY "startTime" ASC
LIMIT 10;
```

---

## 🔧 **SOLUCIONES RÁPIDAS**

### **Solución 1: Actualizar isActive en Eventos Existentes**

Si los eventos tienen `isActive: null` o `isActive: false`:

```sql
UPDATE "Event"
SET "isActive" = true
WHERE "isActive" IS NULL OR "isActive" = false;
```

### **Solución 2: Agregar Campo isActive si No Existe**

Si el campo `isActive` no existe:

```sql
ALTER TABLE "Event"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Actualizar eventos existentes
UPDATE "Event"
SET "isActive" = true
WHERE "isActive" IS NULL;
```

### **Solución 3: Verificar Eventos con startTime en el Pasado**

Si los eventos tienen `startTime` en el pasado:

```sql
-- Ver eventos con startTime en el pasado
SELECT id, name, status, "startTime", NOW() as "now"
FROM "Event"
WHERE status = 'SCHEDULED'
  AND "startTime" < NOW()
LIMIT 10;

-- Estos eventos no aparecerán porque el filtro es startTime >= now
```

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [ ] Revisar logs de `get-events` en Supabase Dashboard
- [ ] Verificar diagnóstico completo en logs
- [ ] Revisar Table Editor → Event para ver datos
- [ ] Ejecutar queries SQL de diagnóstico
- [ ] Verificar que `isActive` existe y es `true`
- [ ] Verificar que `status = 'SCHEDULED'`
- [ ] Verificar que `startTime` es futuro
- [ ] Compartir resultados para análisis

---

## 🎯 **PRÓXIMOS PASOS**

1. **Revisa los logs de Supabase** (Edge Function `get-events`)
2. **Comparte el diagnóstico completo** que aparece en los logs
3. **Ejecuta las queries SQL** y comparte los resultados
4. Con esa información podremos identificar y solucionar el problema exacto

---

## 💡 **NOTA IMPORTANTE**

El diagnóstico automático ahora se ejecuta cada vez que `get-events` no encuentra eventos. Esto nos dará información precisa sobre:
- Cuántos eventos hay en total
- Cuántos tienen el status correcto
- Cuántos tienen startTime futuro
- Si el problema es `isActive` o algo más

**Recarga la página de eventos y revisa los logs de Supabase inmediatamente después.**

