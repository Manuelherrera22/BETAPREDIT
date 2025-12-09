# 🔍 Diagnóstico: Error 400 al Generar Predicciones

## ❌ **PROBLEMA**

Al hacer clic en "Generar Predicciones", se recibe un error `400 (Bad Request)`.

## 🔍 **POSIBLES CAUSAS**

### **1. Error en el Servicio de Auto-Predictions**
El error puede venir de `autoPredictionsService.generatePredictionsForUpcomingEvents()`.

**Verificar:**
- ¿Hay eventos en la BD?
- ¿Hay deportes activos en la BD?
- ¿El servicio puede acceder a la BD?

### **2. Error de Validación**
Algún middleware de validación puede estar rechazando la petición.

**Verificar:**
- ¿La ruta requiere validación?
- ¿El body está vacío (debería estar vacío para POST /generate)?

### **3. Error en el Error Handler**
El error handler puede estar convirtiendo un error 500 en 400.

**Verificar:**
- Revisar logs del backend para ver el error real
- El error handler usa `err.statusCode || err.status || 500`

---

## ✅ **SOLUCIONES IMPLEMENTADAS**

### **1. Mejor Manejo de Errores**
- El controlador ahora captura errores y devuelve mensajes más descriptivos
- Logging detallado para debugging

### **2. Verificación de Rutas**
- La ruta `/generate` está antes de `/:predictionId/feedback` (correcto)
- No hay conflictos de rutas

---

## 🔧 **PASOS PARA DIAGNOSTICAR**

### **Paso 1: Verificar Logs del Backend**

Revisa los logs del backend cuando haces clic en "Generar Predicciones". Busca:
```
Manual prediction generation triggered by user
Error in generatePredictions controller: ...
```

### **Paso 2: Verificar que hay Eventos**

```sql
-- En Supabase SQL Editor
SELECT COUNT(*) as total_events
FROM "Event"
WHERE status = 'SCHEDULED'
  AND "isActive" = true
  AND "startTime" >= NOW();
```

**Si es 0:** Sincroniza eventos primero.

### **Paso 3: Verificar que hay Deportes**

```sql
-- En Supabase SQL Editor
SELECT COUNT(*) as total_sports
FROM "Sport"
WHERE "isActive" = true;
```

**Si es 0:** Los deportes no se están creando correctamente.

### **Paso 4: Probar el Endpoint Directamente**

```bash
# Con tu token de autenticación
curl -X POST https://betapredit.com/api/predictions/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Revisa la respuesta completa** para ver el mensaje de error real.

---

## 🐛 **ERRORES COMUNES**

### **Error 1: "No hay eventos en la BD"**
**Solución:**
1. Ve a la página de Events
2. Haz clic en "Sincronizar desde API"
3. Espera a que termine
4. Intenta generar predicciones nuevamente

### **Error 2: "No hay deportes activos"**
**Causa:** Los deportes no se están creando cuando se sincronizan eventos.

**Solución:**
- Verificar que `sync-events` Edge Function está creando deportes correctamente
- Verificar que el campo `isActive` se está estableciendo en `true`

### **Error 3: "Error al acceder a la BD"**
**Causa:** Problema de conexión con Supabase.

**Solución:**
- Verificar variables de entorno `DATABASE_URL`
- Verificar que Prisma puede conectarse a Supabase

---

## 📝 **PRÓXIMOS PASOS**

1. **Revisar logs del backend** para ver el error real
2. **Verificar que hay eventos** en la BD
3. **Probar el endpoint directamente** con curl
4. **Compartir el mensaje de error completo** para diagnóstico más preciso

---

## 💡 **NOTA IMPORTANTE**

El error 400 puede ser engañoso. El error real puede ser un 500 que el error handler está convirtiendo en 400, o puede ser un error de validación. **Revisa los logs del backend** para ver el error real.

