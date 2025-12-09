# 🧪 Cómo Probar la Función auto-sync

## Método 1: Usando el Botón "Test" (Recomendado)

1. **En el dashboard de Supabase**, en la página de `auto-sync`:
   - Busca el botón **"Test"** en la parte superior derecha (junto a "Docs" y "Download")
   - Haz clic en **"Test"**

2. **En el modal que aparece**:
   - Puedes dejar el body vacío `{}` o simplemente hacer clic en **"Run"** o **"Invoke"**
   - La función se ejecutará y verás el resultado

3. **Revisa los resultados**:
   - Verás la respuesta de la función
   - Revisa la pestaña **"Logs"** para ver los mensajes detallados

## Método 2: Usando la Pestaña "Invocations"

1. Haz clic en la pestaña **"Invocations"** (al lado de "Overview")
2. Verás el historial de invocaciones
3. Puedes hacer clic en una invocación para ver los detalles

## Método 3: Usando curl (Desde Terminal)

```bash
curl -X POST https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Nota:** Necesitas reemplazar `YOUR_SERVICE_ROLE_KEY` con tu Service Role Key de Supabase.

## Método 4: Desde el Frontend (Temporal)

Puedes crear un botón temporal en el frontend para probar:

```typescript
const testAutoSync = async () => {
  const response = await fetch(
    'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({})
    }
  );
  const data = await response.json();
  console.log('Result:', data);
};
```

## 📊 Qué Esperar

### Respuesta Exitosa:
```json
{
  "success": true,
  "message": "Synced X events and generated Y predictions",
  "data": {
    "eventsSynced": 10,
    "predictionsGenerated": 25,
    "predictionsUpdated": 5
  }
}
```

### Si Ya Hay Suficientes Eventos:
```json
{
  "success": true,
  "message": "Skipped sync (20 events available). Generated predictions.",
  "data": {
    "skipped": true,
    "predictions": {
      "generated": 15,
      "updated": 3
    }
  }
}
```

## 🔍 Revisar Logs

Después de ejecutar "Test":

1. Haz clic en la pestaña **"Logs"**
2. Busca mensajes como:
   - `🔄 Starting automatic sync...`
   - `✅ Already have X upcoming events. Skipping sync.`
   - `✅ Generated X predictions, updated Y`
   - `✅ Auto-sync completed: X events synced, Y predictions generated`

## ✅ Verificar Resultados

### Eventos:
1. Ve a **Database** → **Table Editor** → **Event**
2. Filtra por:
   - `isActive: true`
   - `status: SCHEDULED`
   - Ordena por `updatedAt` DESC
3. Deberías ver eventos nuevos o actualizados

### Predicciones:
1. Ve a **Database** → **Table Editor** → **Prediction**
2. Filtra por:
   - `modelVersion: v2.0-auto`
   - Ordena por `createdAt` DESC
3. Deberías ver predicciones generadas

## 🐛 Troubleshooting

### El botón "Test" no aparece
- Asegúrate de estar en la página correcta: **Edge Functions** → **auto-sync**
- Verifica que la función esté desplegada

### Error al ejecutar
- Revisa la pestaña **"Logs"** para ver el error específico
- Verifica que `THE_ODDS_API_KEY` esté configurada en Secrets
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada

### No se sincronizan eventos
- Revisa los logs para ver si hay errores
- Verifica que The Odds API tenga créditos disponibles
- El sistema puede saltar la sincronización si ya hay ≥20 eventos

### No se generan predicciones
- Verifica que los eventos tengan odds en la BD
- Revisa los logs para ver si hay errores al generar predicciones

