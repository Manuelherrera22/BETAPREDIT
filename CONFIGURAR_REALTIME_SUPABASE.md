# 🔧 Configurar Supabase Realtime

## 📋 Pasos para Habilitar Realtime en Supabase

### 1. Habilitar Realtime en Tablas

Ve al Dashboard de Supabase: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb

1. **Database** → **Replication**
2. Habilita Realtime para las siguientes tablas:
   - ✅ `Event` (para eventos en vivo)
   - ✅ `Notification` (para notificaciones)
   - ✅ `ValueBetAlert` (para alertas de value bets)
   - ✅ `Odds` (para actualizaciones de cuotas)
   - ✅ `Prediction` (para actualizaciones de predicciones)
   - ✅ `ExternalBet` (opcional, para actualizaciones de apuestas)

### 2. Configurar Políticas RLS (Row Level Security)

Para que Realtime funcione correctamente, las tablas deben tener RLS habilitado:

1. **Database** → **Tables** → Selecciona cada tabla
2. **Settings** → **Enable Row Level Security**
3. Configura políticas según necesidad:
   - `Event`: Público (todos pueden ver eventos)
   - `Notification`: Solo el usuario puede ver sus notificaciones
   - `ValueBetAlert`: Usuario específico o público
   - `Odds`: Público
   - `Prediction`: Público

### 3. Verificar Configuración

```sql
-- Verificar que Realtime está habilitado
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Verificar políticas RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## 🔄 Cómo Funciona

### Frontend (useRealtime.ts)
- Se suscribe a cambios en tablas usando `postgres_changes`
- Recibe actualizaciones automáticamente cuando hay cambios en la base de datos
- No requiere backend para funcionar

### Backend (websocket.service.ts)
- Sigue usando Socket.IO para desarrollo
- Cuando actualiza la base de datos, Supabase Realtime automáticamente emite los cambios
- No necesita emitir manualmente a Realtime

---

## ✅ Ventajas de Supabase Realtime

1. **No requiere backend:** Funciona directamente desde la base de datos
2. **Automático:** Cualquier cambio en la DB se emite automáticamente
3. **Escalable:** Supabase maneja la infraestructura
4. **Seguro:** Usa RLS para controlar acceso
5. **Eficiente:** Solo emite cambios reales en la base de datos

---

## 🧪 Probar Realtime

1. Abre la aplicación en producción
2. Ve a la página de Eventos (modo LIVE)
3. Actualiza un evento en la base de datos
4. Deberías ver la actualización automáticamente sin recargar

---

## 📝 Notas

- Realtime funciona mejor cuando las tablas tienen índices apropiados
- Las políticas RLS deben permitir que los usuarios vean los datos que necesitan
- Los canales de Realtime se limpian automáticamente cuando el componente se desmonta
