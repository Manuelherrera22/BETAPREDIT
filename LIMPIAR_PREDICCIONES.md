# Limpiar Predicciones Antiguas

## Problema

Hay demasiadas predicciones en la base de datos que no se están mostrando en el sistema porque:
- Son de eventos que ya pasaron
- Son de eventos que no están activos
- Son de eventos con estado FINISHED o CANCELLED

## Solución

Se ha creado una nueva Edge Function `cleanup-predictions` que:
1. Identifica eventos que ya no son relevantes (inactivos, finalizados, o con más de 2 días de antigüedad)
2. Elimina todas las predicciones asociadas a esos eventos
3. Mantiene solo las predicciones de eventos activos y próximos

## Cómo Usar

### Opción 1: Desde Supabase Dashboard

1. Ve a Supabase Dashboard → Functions → `cleanup-predictions`
2. Haz clic en "Invoke" o "Test"
3. Revisa los logs para ver cuántas predicciones se eliminaron

### Opción 2: Desde el Frontend (próximamente)

Se puede agregar un botón en la página de administración para ejecutar la limpieza.

### Opción 3: Automático (Cron Job)

Se puede configurar para que se ejecute automáticamente cada día.

## Mejoras Implementadas

1. ✅ **Filtrado en `get-predictions`**: Ahora solo retorna predicciones para eventos activos y próximos
2. ✅ **Filtrado por mercado activo**: Solo muestra predicciones de mercados activos
3. ✅ **Función de limpieza**: `cleanup-predictions` elimina predicciones antiguas

## Verificación

Después de ejecutar la limpieza:

1. Ve a Supabase Dashboard → Table Editor → `Prediction`
2. Verifica que solo haya predicciones para eventos:
   - `isActive: true`
   - `status: SCHEDULED`
   - `startTime` en el futuro

## Nota

La función de limpieza es segura y solo elimina predicciones de eventos que ya no son relevantes. Las predicciones de eventos activos y próximos se mantienen intactas.

