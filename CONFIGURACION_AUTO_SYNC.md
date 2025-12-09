# Configuración de Sincronización Automática

## 🎯 Objetivo

Sistema automático que sincroniza eventos y genera predicciones sin intervención manual del usuario.

## ✅ Características Implementadas

### 1. **Sincronización Inteligente**
- ✅ Solo sincroniza si hay menos de 20 eventos en las próximas 2 horas
- ✅ Prioriza deportes más populares (EPL, NBA, La Liga, etc.)
- ✅ Actualiza eventos solo si la fecha cambió significativamente (>1 hora)

### 2. **Generación Automática de Predicciones**
- ✅ Se generan automáticamente después de sincronizar eventos
- ✅ Solo genera para eventos con odds disponibles
- ✅ Actualiza predicciones existentes si las odds cambian >5%

### 3. **Segmentación por Deporte**
- ✅ Prioriza: EPL → NBA → La Liga → NFL → Serie A → NHL
- ✅ Cada deporte se procesa independientemente
- ✅ Fácil agregar más deportes a la lista priorizada

## 📋 Configuración en Supabase

### Paso 1: Desplegar la Edge Function

```bash
# Desde el directorio raíz del proyecto
supabase functions deploy auto-sync --project-ref mdjzqxhjbisnlfpbjfgb
```

### Paso 2: Configurar Cron Job

1. Ve a **Supabase Dashboard** → **Database** → **Cron Jobs**
2. Haz clic en **"New Cron Job"**
3. Configura:
   - **Name**: `auto-sync-hourly`
   - **Schedule**: `0 * * * *` (cada hora)
   - **Function**: `auto-sync`
   - **Enabled**: ✅

### Paso 3: Verificar Variables de Entorno

Asegúrate de que estas variables estén configuradas en Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `THE_ODDS_API_KEY`

## 🔄 Cómo Funciona

1. **Cada hora**, Supabase ejecuta automáticamente `auto-sync`
2. **Verifica** si hay suficientes eventos (≥20 en próximas 2 horas)
3. **Si no hay suficientes**, sincroniza desde The Odds API
4. **Prioriza** deportes más populares
5. **Guarda** eventos, markets y odds
6. **Genera predicciones** automáticamente para eventos con odds
7. **Actualiza** predicciones existentes si las odds cambian

## 🎨 Segmentación de Eventos

Los eventos se segmentan automáticamente por:
- **Deporte** (soccer, basketball, etc.)
- **Liga** (EPL, NBA, La Liga, etc.)
- **Fecha** (próximas 48 horas)

## 📊 Monitoreo

### Logs en Supabase Dashboard
- **Edge Functions** → **auto-sync** → **Logs**
- Verás mensajes como:
  - `🔄 Starting automatic sync...`
  - `✅ Already have X upcoming events. Skipping sync.`
  - `✅ Generated X predictions, updated Y`

### Métricas
- Eventos sincronizados por hora
- Predicciones generadas
- Predicciones actualizadas

## 🚀 Ventajas

1. **Sin intervención manual**: Todo funciona automáticamente
2. **Eficiente**: Solo sincroniza cuando es necesario
3. **Inteligente**: No actualiza eventos con fechas fijas
4. **Priorizado**: Enfoca recursos en deportes más populares
5. **Actualizado**: Las predicciones se mantienen al día automáticamente

## 🔧 Personalización

### Agregar más deportes

Edita `supabase/functions/auto-sync/index.ts`:

```typescript
const prioritizedSports = [
  'soccer_epl',
  'basketball_nba',
  'soccer_spain_la_liga',
  'americanfootball_nfl',
  'soccer_italy_serie_a',
  'icehockey_nhl',
  'soccer_germany_bundesliga', // ← Agregar aquí
];
```

### Cambiar frecuencia de sincronización

En Supabase Dashboard → Cron Jobs, cambia el schedule:
- Cada hora: `0 * * * *`
- Cada 2 horas: `0 */2 * * *`
- Cada 30 minutos: `*/30 * * * *`

### Ajustar umbral de eventos

En `auto-sync/index.ts`, cambia:
```typescript
if (recentEventsCount && recentEventsCount >= 20) { // ← Cambiar 20
```

## ⚠️ Notas Importantes

1. **Créditos de API**: El sistema está optimizado para usar créditos eficientemente
2. **Rate Limiting**: Respeta los límites de The Odds API
3. **Actualizaciones**: Solo actualiza si es realmente necesario
4. **Fechas fijas**: No actualiza eventos con fechas ya establecidas (ej: 25 de diciembre)

## 🐛 Troubleshooting

### Las predicciones no se generan
1. Verifica que los eventos tengan odds en la BD
2. Revisa los logs de `auto-sync` en Supabase Dashboard
3. Verifica que `THE_ODDS_API_KEY` esté configurada

### No se sincronizan eventos
1. Verifica que el cron job esté habilitado
2. Revisa los logs para ver errores
3. Verifica que `THE_ODDS_API_KEY` tenga créditos disponibles

### Actualizaciones innecesarias
1. El sistema solo actualiza si la fecha cambia >1 hora
2. Si necesitas cambiar este umbral, edita `auto-sync/index.ts`

