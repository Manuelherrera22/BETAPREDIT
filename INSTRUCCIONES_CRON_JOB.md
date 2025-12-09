# 🕐 Configuración del Cron Job para Auto-Sync

## 📋 Pasos para Configurar la Sincronización Automática

### Paso 1: Acceder a Supabase Dashboard

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **mdjzqxhjbisnlfpbjfgb**
3. Ve a **Database** → **Cron Jobs**

### Paso 2: Crear Nuevo Cron Job

1. Haz clic en **"New Cron Job"** o **"Create Cron Job"**
2. Completa el formulario:

#### Configuración Básica:
- **Name**: `auto-sync-hourly`
- **Description**: `Sincroniza eventos y genera predicciones automáticamente cada hora`

#### Schedule (Expresión Cron):
```
0 * * * *
```
Esto significa: **Cada hora, en el minuto 0** (ej: 1:00, 2:00, 3:00, etc.)

**Opciones de frecuencia:**
- Cada hora: `0 * * * *`
- Cada 2 horas: `0 */2 * * *`
- Cada 30 minutos: `*/30 * * * *`
- Cada 15 minutos: `*/15 * * * *`
- Diario a las 3 AM: `0 3 * * *`

#### Function:
- **Function Name**: `auto-sync`
- **Enabled**: ✅ (marcar como activo)

#### Headers (si es necesario):
```json
{
  "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
  "Content-Type": "application/json"
}
```

**Nota**: Normalmente no necesitas headers, Supabase los inyecta automáticamente.

### Paso 3: Guardar y Verificar

1. Haz clic en **"Save"** o **"Create"**
2. Verifica que el cron job aparezca en la lista
3. El estado debe ser **"Active"** o **"Enabled"**

### Paso 4: Probar Manualmente (Opcional)

Puedes probar la función manualmente desde:
- **Edge Functions** → **auto-sync** → **Invoke**

O usando curl:
```bash
curl -X POST https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_ANON_KEY"
```

## 🔍 Verificar que Funciona

### 1. Revisar Logs

1. Ve a **Edge Functions** → **auto-sync** → **Logs**
2. Busca mensajes como:
   - `🔄 Starting automatic sync...`
   - `✅ Already have X upcoming events. Skipping sync.`
   - `✅ Generated X predictions, updated Y`

### 2. Verificar Eventos en la BD

1. Ve a **Database** → **Table Editor** → **Event**
2. Verifica que haya eventos nuevos o actualizados
3. Verifica que tengan `isActive: true`

### 3. Verificar Predicciones

1. Ve a **Database** → **Table Editor** → **Prediction**
2. Verifica que haya predicciones generadas
3. Verifica que tengan `modelVersion: 'v2.0-auto'`

## ⚙️ Configuración Avanzada

### Cambiar Frecuencia

Si quieres cambiar la frecuencia, edita el cron job:
- **Cada 30 minutos**: `*/30 * * * *`
- **Cada 2 horas**: `0 */2 * * *`
- **Cada 6 horas**: `0 */6 * * *`

### Deshabilitar Temporalmente

1. Ve a **Database** → **Cron Jobs**
2. Encuentra `auto-sync-hourly`
3. Haz clic en el toggle para **deshabilitar**
4. Para reactivar, vuelve a hacer clic

### Eliminar Cron Job

1. Ve a **Database** → **Cron Jobs**
2. Encuentra `auto-sync-hourly`
3. Haz clic en **"Delete"** o **"Remove"**

## 🐛 Troubleshooting

### El cron job no se ejecuta

1. **Verifica que esté habilitado**: El toggle debe estar en "ON"
2. **Verifica el schedule**: Asegúrate de que la expresión cron sea correcta
3. **Revisa los logs**: Ve a Edge Functions → auto-sync → Logs
4. **Verifica variables de entorno**: Asegúrate de que `THE_ODDS_API_KEY` esté configurada

### Error: "Function not found"

1. Verifica que la función `auto-sync` esté desplegada:
   ```bash
   supabase functions list --project-ref mdjzqxhjbisnlfpbjfgb
   ```
2. Si no está, despliégala:
   ```bash
   supabase functions deploy auto-sync --project-ref mdjzqxhjbisnlfpbjfgb
   ```

### Error: "Unauthorized"

1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada en Supabase
2. Verifica que la función tenga acceso a las variables de entorno

### No se sincronizan eventos

1. **Verifica créditos de API**: Asegúrate de que `THE_ODDS_API_KEY` tenga créditos disponibles
2. **Revisa los logs**: Busca errores específicos en los logs
3. **Verifica rate limiting**: El sistema puede estar saltando sincronizaciones si hay suficientes eventos

## 📊 Monitoreo

### Métricas a Revisar

1. **Frecuencia de ejecución**: ¿Se ejecuta cada hora?
2. **Eventos sincronizados**: ¿Cuántos eventos se sincronizan por ejecución?
3. **Predicciones generadas**: ¿Cuántas predicciones se generan?
4. **Errores**: ¿Hay errores en los logs?

### Alertas Recomendadas

Puedes configurar alertas en Supabase para:
- Errores en la función
- Ejecuciones fallidas
- Tiempo de ejecución excesivo

## ✅ Checklist de Configuración

- [ ] Edge Function `auto-sync` desplegada
- [ ] Cron job creado en Supabase Dashboard
- [ ] Schedule configurado (`0 * * * *`)
- [ ] Cron job habilitado
- [ ] Variables de entorno configuradas (`THE_ODDS_API_KEY`)
- [ ] Primera ejecución verificada en logs
- [ ] Eventos sincronizados verificados en BD
- [ ] Predicciones generadas verificadas en BD

## 🎯 Resultado Esperado

Después de configurar el cron job:
- ✅ Los eventos se sincronizan automáticamente cada hora
- ✅ Las predicciones se generan automáticamente
- ✅ No necesitas hacer clic en "Sincronizar" manualmente
- ✅ El sistema funciona de forma completamente automática

