# 🔍 Debug: Eventos No Aparecen

## 📋 **PASOS PARA DEBUG**

### **1. Verificar en Consola del Navegador**

Abre la consola del navegador (F12) y busca:

1. **Logs de `get-events`:**
   - Deberías ver: `get-events response: { success: true, dataLength: X }`
   - Si `dataLength: 0`, los eventos no se están retornando

2. **Errores:**
   - Busca errores relacionados con `get-events` o `sync-events`
   - Verifica si hay errores de autenticación

### **2. Verificar en Supabase Dashboard**

1. **Edge Functions → get-events → Logs:**
   - Busca el log: `Found X events with status=SCHEDULED`
   - Si dice `Found 0 events`, verifica:
     - ¿Hay eventos en la BD?
     - ¿Los eventos tienen `status = 'SCHEDULED'`?
     - ¿Los eventos tienen `startTime >= now`?

2. **Table Editor → Event:**
   - Verifica que haya eventos
   - Verifica que tengan `status = 'SCHEDULED'`
   - Verifica que `startTime` sea en el futuro
   - Verifica si tienen `isActive` (puede que no exista)

### **3. Verificar Query Directa**

Ejecuta en Supabase SQL Editor:

```sql
-- Ver todos los eventos
SELECT id, name, status, "startTime", "isActive", "sportId"
FROM "Event"
ORDER BY "startTime" ASC
LIMIT 10;

-- Ver eventos SCHEDULED
SELECT id, name, status, "startTime", "isActive"
FROM "Event"
WHERE status = 'SCHEDULED'
  AND "startTime" >= NOW()
ORDER BY "startTime" ASC
LIMIT 10;

-- Verificar si isActive existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Event'
  AND column_name = 'isActive';
```

### **4. Probar Edge Function Directamente**

Usa curl o Postman:

```bash
curl -X GET "https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/get-events?status=SCHEDULED" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "apikey: TU_ANON_KEY"
```

### **5. Verificar Sincronización**

1. **Edge Functions → sync-events → Logs:**
   - Busca: `Synced X total events`
   - Verifica si hubo errores al crear eventos

2. **Verificar que eventos se crearon:**
   ```sql
   SELECT COUNT(*) as total, 
          COUNT(*) FILTER (WHERE status = 'SCHEDULED') as scheduled,
          COUNT(*) FILTER (WHERE "startTime" >= NOW()) as upcoming
   FROM "Event";
   ```

---

## 🔧 **POSIBLES PROBLEMAS Y SOLUCIONES**

### **Problema 1: isActive no existe en BD**

**Síntoma:** Logs muestran error sobre `isActive`

**Solución:**
1. Ejecutar migración:
   ```bash
   cd backend
   npx prisma db push
   ```

2. O remover filtro `isActive` temporalmente de `get-events`

### **Problema 2: Eventos con startTime en el pasado**

**Síntoma:** Eventos existen pero no aparecen

**Solución:**
- El filtro `startTime >= now` está excluyendo eventos pasados
- Esto es correcto para "próximos eventos"
- Verifica que los eventos tengan `startTime` en el futuro

### **Problema 3: Eventos sin Sport relacionado**

**Síntoma:** Query falla por relación Sport

**Solución:**
- Verifica que todos los eventos tengan `sportId` válido
- Verifica que existan los deportes en la tabla `Sport`

### **Problema 4: Filtro de isActive está excluyendo eventos**

**Síntoma:** Eventos existen pero `isActive = false` o `null`

**Solución:**
1. Actualizar eventos existentes:
   ```sql
   UPDATE "Event" SET "isActive" = true WHERE "isActive" IS NULL OR "isActive" = false;
   ```

2. O remover filtro temporalmente

---

## 📊 **LOGS ESPERADOS**

### **En Consola del Navegador:**
```
get-events response: { success: true, dataLength: 10 }
```

### **En Supabase Logs (get-events):**
```
Found 10 events with status=SCHEDULED, sportId=all
Sample event: { id: "...", name: "...", ... }
```

### **Si no hay eventos:**
```
Found 0 events with status=SCHEDULED, sportId=all
Total events in DB: 0
Scheduled events in DB: 0
```

---

## ✅ **PRÓXIMOS PASOS**

1. Revisar logs en consola del navegador
2. Revisar logs en Supabase Dashboard
3. Ejecutar queries SQL para verificar datos
4. Compartir logs para análisis más profundo

