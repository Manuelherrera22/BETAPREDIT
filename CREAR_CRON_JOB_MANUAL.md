# 🚀 Crear Cron Job Manualmente en Supabase

## Método 1: Usando Supabase Dashboard (Recomendado)

### Paso 1: Acceder al Dashboard
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **mdjzqxhjbisnlfpbjfgb**
3. Ve a **Database** → **Cron Jobs**

### Paso 2: Crear Nuevo Cron Job
1. Haz clic en **"New Cron Job"** o **"Create Cron Job"**
2. Completa el formulario:

```
Name: auto-sync-hourly
Description: Sincroniza eventos y genera predicciones automáticamente cada hora
Schedule: 0 * * * *
Function: auto-sync
Enabled: ✅ (marcar)
```

### Paso 3: Guardar
1. Haz clic en **"Save"** o **"Create"**
2. Verifica que aparezca en la lista con estado **"Active"**

---

## Método 2: Usando SQL (pg_cron)

Si prefieres usar SQL directamente:

### Paso 1: Acceder a SQL Editor
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Crea una nueva query

### Paso 2: Ejecutar SQL

```sql
-- Habilitar extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear el cron job
SELECT cron.schedule(
  'auto-sync-hourly',                    -- Nombre del job
  '0 * * * *',                          -- Schedule: cada hora
  $$
  SELECT
    net.http_post(
      url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verificar que se creó
SELECT * FROM cron.job WHERE jobname = 'auto-sync-hourly';
```

### Paso 3: Verificar
1. Ve a **Database** → **Cron Jobs**
2. Deberías ver `auto-sync-hourly` en la lista

---

## Método 3: Usando Supabase CLI (Avanzado)

```bash
# Conectar a la base de datos
supabase db connect --project-ref mdjzqxhjbisnlfpbjfgb

# Ejecutar el SQL
psql -f supabase/migrations/create_auto_sync_cron.sql
```

---

## ✅ Verificar que Funciona

### 1. Revisar Logs
1. Ve a **Edge Functions** → **auto-sync** → **Logs**
2. Espera la próxima hora (ej: si son las 2:30, espera hasta las 3:00)
3. Deberías ver logs como:
   - `🔄 Starting automatic sync...`
   - `✅ Generated X predictions`

### 2. Verificar en Database
1. Ve a **Database** → **Table Editor** → **Event**
2. Verifica que haya eventos nuevos o actualizados
3. Ve a **Prediction**
4. Verifica que haya predicciones generadas

### 3. Probar Manualmente
Puedes invocar la función manualmente desde:
- **Edge Functions** → **auto-sync** → **Invoke**

---

## 🔧 Configuración del Schedule

### Frecuencias Comunes:

| Frecuencia | Schedule | Descripción |
|------------|----------|-------------|
| Cada hora | `0 * * * *` | A las :00 de cada hora |
| Cada 2 horas | `0 */2 * * *` | Cada 2 horas |
| Cada 30 minutos | `*/30 * * * *` | Cada 30 minutos |
| Cada 15 minutos | `*/15 * * * *` | Cada 15 minutos |
| Diario 3 AM | `0 3 * * *` | Todos los días a las 3 AM |
| Cada 6 horas | `0 */6 * * *` | Cada 6 horas |

### Formato Cron:
```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (Domingo a Sábado)
│ │ │ │ │
* * * * *
```

---

## 🐛 Troubleshooting

### El cron job no aparece
- Verifica que la extensión `pg_cron` esté habilitada
- Verifica que tengas permisos de administrador
- Intenta crear el cron job desde el Dashboard

### El cron job no se ejecuta
- Verifica que esté **habilitado** (toggle ON)
- Verifica el schedule (debe ser válido)
- Revisa los logs de Edge Functions
- Verifica que la función `auto-sync` esté desplegada

### Error: "Function not found"
- Asegúrate de que `auto-sync` esté desplegada:
  ```bash
  supabase functions list --project-ref mdjzqxhjbisnlfpbjfgb
  ```
- Si no está, despliégala:
  ```bash
  supabase functions deploy auto-sync --project-ref mdjzqxhjbisnlfpbjfgb
  ```

### Error: "Unauthorized"
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
- Verifica que la función tenga acceso a las variables de entorno

---

## 📊 Monitoreo

### Ver Historial de Ejecuciones
1. Ve a **Database** → **Cron Jobs**
2. Haz clic en `auto-sync-hourly`
3. Verás el historial de ejecuciones

### Ver Logs en Tiempo Real
1. Ve a **Edge Functions** → **auto-sync** → **Logs**
2. Filtra por fecha/hora
3. Busca mensajes de éxito o error

---

## 🎯 Resultado Esperado

Después de configurar el cron job:
- ✅ La función `auto-sync` se ejecuta automáticamente cada hora
- ✅ Los eventos se sincronizan automáticamente
- ✅ Las predicciones se generan automáticamente
- ✅ No necesitas hacer nada manualmente
- ✅ El sistema funciona completamente solo

---

## 📝 Notas Importantes

1. **Primera ejecución**: Puede tardar unos minutos en aparecer en los logs
2. **Timezone**: Los cron jobs usan UTC por defecto
3. **Rate limiting**: El sistema tiene protección contra sincronizaciones excesivas
4. **Créditos de API**: El sistema está optimizado para usar créditos eficientemente

---

## ✅ Checklist

- [ ] Edge Function `auto-sync` desplegada
- [ ] Cron job creado en Supabase Dashboard
- [ ] Schedule configurado (`0 * * * *`)
- [ ] Cron job habilitado
- [ ] Variables de entorno configuradas
- [ ] Primera ejecución verificada en logs
- [ ] Eventos sincronizados verificados
- [ ] Predicciones generadas verificadas

