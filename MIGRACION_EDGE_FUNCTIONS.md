# 🚀 Migración a Supabase Edge Functions

## ✅ Estado de la Migración

Hemos migrado exitosamente los siguientes endpoints a Supabase Edge Functions:

1. **External Bets** (`/external-bets`)
   - ✅ POST - Registrar apuesta
   - ✅ GET - Obtener apuestas del usuario
   - ✅ PUT - Actualizar resultado de apuesta
   - ✅ DELETE - Eliminar apuesta
   - ✅ GET /stats - Estadísticas de apuestas

2. **User Statistics** (`/user-statistics`)
   - ✅ GET - Obtener estadísticas del usuario
   - ✅ Cálculo en tiempo real (sin caché)

3. **User Profile** (`/user-profile`) - Ya existía
   - ✅ GET - Obtener perfil
   - ✅ PUT - Actualizar perfil

## 📋 Archivos Creados

### Edge Functions
- `supabase/functions/external-bets/index.ts`
- `supabase/functions/user-statistics/index.ts`
- `supabase/functions/user-profile/index.ts` (ya existía)

### Frontend Actualizado
- `frontend/src/services/externalBetsService.ts` - Usa Edge Functions en producción
- `frontend/src/services/userStatisticsService.ts` - Usa Edge Functions en producción

## 🚀 Desplegar Edge Functions

### 1. Verificar Supabase CLI

```bash
supabase --version
```

Si no está instalado:
```bash
npm install -g supabase
```

### 2. Login en Supabase

```bash
supabase login
```

### 3. Link tu Proyecto

```bash
cd supabase
supabase link --project-ref mdjzqxhjbisnlfpbjfgb
```

### 4. Desplegar Functions

```bash
# Desplegar external-bets
supabase functions deploy external-bets

# Desplegar user-statistics
supabase functions deploy user-statistics

# Desplegar user-profile (si no está desplegada)
supabase functions deploy user-profile
```

### 5. Verificar Deployment

Las funciones estarán disponibles en:
- `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/external-bets`
- `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-statistics`
- `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile`

## 🔧 Configuración

### Variables de Entorno

Las Edge Functions usan automáticamente las variables de entorno de Supabase:
- `SUPABASE_URL` - Inyectada automáticamente
- `SUPABASE_SERVICE_ROLE_KEY` - Inyectada automáticamente

No necesitas configurar nada adicional.

## 🧪 Probar las Edge Functions

### 1. Probar External Bets

```bash
# Obtener token de autenticación (desde el frontend o Supabase Auth)
TOKEN="tu_token_aqui"

# Registrar una apuesta
curl -X POST https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/external-bets \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "Bet365",
    "marketType": "1X2",
    "selection": "Home Win",
    "odds": 2.5,
    "stake": 100,
    "betPlacedAt": "2024-01-15T10:00:00Z"
  }'

# Obtener apuestas
curl -X GET "https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/external-bets?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY"
```

### 2. Probar User Statistics

```bash
# Obtener estadísticas
curl -X GET "https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-statistics?period=all_time" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY"
```

## 📊 Comportamiento

### Desarrollo vs Producción

- **Desarrollo** (`npm run dev`): Usa el backend local (`http://localhost:3000/api`)
- **Producción**: Usa Supabase Edge Functions automáticamente

El frontend detecta automáticamente el entorno y usa la fuente correcta.

### Fallback

Si las Edge Functions no están disponibles o hay un error:
- El frontend intentará usar el backend tradicional
- Los errores se manejan gracefully

## 🔄 Backend Actual

El backend Node.js sigue funcionando para:
- ✅ WebSocket (alertas en tiempo real)
- ✅ Scheduled tasks (tareas programadas)
- ✅ Endpoints que aún no se han migrado

## 📝 Próximos Pasos (Opcional)

1. **Migrar más endpoints**:
   - Events search
   - Value bet alerts
   - Odds comparison

2. **Optimizar**:
   - Agregar caché en Edge Functions
   - Implementar rate limiting
   - Agregar logging mejorado

## ⚠️ Notas Importantes

1. **Autenticación**: Las Edge Functions usan el token JWT de Supabase Auth
2. **CORS**: Ya está configurado en las Edge Functions
3. **Errores**: Todos los errores se devuelven en formato JSON consistente
4. **Base de Datos**: Las Edge Functions usan el cliente de Supabase directamente (más eficiente que Prisma en Deno)

## 🐛 Troubleshooting

### Error: "Supabase configuration missing"
- Verifica que las variables de entorno estén configuradas en Supabase
- Las variables se inyectan automáticamente, no necesitas configurarlas manualmente

### Error: "Invalid token"
- Verifica que el token JWT sea válido
- El token debe ser del usuario autenticado en Supabase Auth

### Error: "Method not allowed"
- Verifica que estés usando el método HTTP correcto (GET, POST, PUT, DELETE)
- Verifica que la ruta sea correcta

### Las funciones no se despliegan
- Verifica que estés logueado: `supabase login`
- Verifica que el proyecto esté linkeado: `supabase link --project-ref mdjzqxhjbisnlfpbjfgb`
- Verifica los logs: `supabase functions logs external-bets`

## ✅ Checklist de Deployment

- [ ] Supabase CLI instalado y logueado
- [ ] Proyecto linkeado correctamente
- [ ] Edge Functions desplegadas
- [ ] Frontend actualizado (ya está hecho)
- [ ] Probar en producción
- [ ] Verificar que el frontend use Edge Functions en producción
- [ ] Monitorear logs de Supabase

---

**¡Migración completada!** 🎉

Las Edge Functions están listas para usar en producción. El frontend automáticamente usará las Edge Functions cuando esté en producción y el backend local en desarrollo.

