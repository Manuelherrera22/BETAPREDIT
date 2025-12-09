# ✅ Verificación: Edge Function sync-events

**Fecha:** Diciembre 2024  
**Estado:** ✅ DESPLEGADA Y LISTA

---

## 📋 **VERIFICACIONES REALIZADAS**

### ✅ 1. Edge Function Creada
- **Archivo:** `supabase/functions/sync-events/index.ts`
- **Estado:** ✅ Creado y desplegado
- **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/sync-events`

### ✅ 2. Frontend Integrado
- **Archivo:** `frontend/src/services/eventsService.ts`
- **Método:** `syncEvents()`
- **Lógica:**
  - ✅ Usa Edge Function en producción (`import.meta.env.PROD`)
  - ✅ Usa backend API en desarrollo
  - ✅ Maneja autenticación con Supabase
  - ✅ Maneja errores correctamente

### ✅ 3. UI Integrada
- **Archivo:** `frontend/src/pages/Events.tsx`
- **Botón:** "🔄 Sincronizar desde API"
- **Funcionalidad:**
  - ✅ Llama a `eventsService.syncEvents()`
  - ✅ Muestra loading state
  - ✅ Muestra mensajes de éxito/error
  - ✅ Refresca eventos después de sincronizar

### ✅ 4. Deployment
- **Estado:** ✅ Desplegado exitosamente
- **Comando usado:** `supabase functions deploy sync-events --project-ref mdjzqxhjbisnlfpbjfgb`
- **Resultado:** ✅ "Deployed Functions on project mdjzqxhjbisnlfpbjfgb: sync-events"

---

## 🔍 **VERIFICACIONES TÉCNICAS**

### ✅ Código de Edge Function
- ✅ Maneja CORS correctamente
- ✅ Verifica autenticación
- ✅ Obtiene eventos de The Odds API
- ✅ Sincroniza a Supabase (Sport y Event)
- ✅ Maneja errores apropiadamente
- ✅ Retorna respuesta estructurada

### ✅ Código de Frontend
- ✅ Detecta si está en producción
- ✅ Usa cliente de Supabase configurado
- ✅ Obtiene token de autenticación
- ✅ Hace request a Edge Function
- ✅ Maneja errores y muestra mensajes

### ✅ Integración
- ✅ Botón visible en página de eventos
- ✅ Funciona en estado vacío (sin eventos)
- ✅ Funciona en header de la página
- ✅ Refresca eventos después de sincronizar

---

## ⚠️ **VERIFICACIÓN MANUAL REQUERIDA**

### 1. Variable de Entorno en Supabase
**Acción:** Verificar que `THE_ODDS_API_KEY` esté configurada

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. **Settings** → **Edge Functions** → **Secrets**
3. Verifica que exista: `THE_ODDS_API_KEY`
4. Si no existe, agrega: `THE_ODDS_API_KEY` = tu API key de The Odds API

### 2. Probar en Producción
**Acción:** Probar el botón de sincronización

1. Ve a: https://betapredit.com/events
2. Haz clic en "🔄 Sincronizar desde API"
3. Deberías ver:
   - ✅ Mensaje de carga: "Sincronizando eventos desde The Odds API..."
   - ✅ Mensaje de éxito: "Eventos sincronizados correctamente"
   - ✅ Eventos apareciendo en la página

### 3. Verificar Logs
**Acción:** Revisar logs de la Edge Function

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. **Edge Functions** → **sync-events** → **Logs**
3. Deberías ver logs de sincronización exitosa

---

## 🧪 **TEST MANUAL**

### Test 1: Sincronización Básica
```javascript
// En consola del navegador (https://betapredit.com)
// 1. Obtener token
const { supabase } = await import('./src/config/supabase');
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// 2. Llamar Edge Function
const response = await fetch('https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/sync-events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': 'tu_anon_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
});

const result = await response.json();
console.log(result);
// Debería retornar: { success: true, message: "Synced X total events", data: {...} }
```

### Test 2: Sincronización de Deporte Específico
```javascript
const response = await fetch('https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/sync-events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': 'tu_anon_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sportKey: 'soccer_epl' }),
});
```

---

## ✅ **CHECKLIST FINAL**

- [x] Edge Function creada y desplegada
- [x] Frontend integrado correctamente
- [x] UI con botón de sincronización
- [x] Manejo de errores implementado
- [x] Autenticación configurada
- [ ] **VERIFICAR:** `THE_ODDS_API_KEY` en Supabase Secrets
- [ ] **PROBAR:** Botón de sincronización en producción
- [ ] **VERIFICAR:** Eventos aparecen después de sincronizar

---

## 🎯 **RESULTADO ESPERADO**

Cuando todo esté configurado correctamente:

1. Usuario hace clic en "🔄 Sincronizar desde API"
2. Frontend llama a Edge Function `sync-events`
3. Edge Function obtiene eventos de The Odds API
4. Edge Function sincroniza eventos a Supabase
5. Frontend muestra mensaje de éxito
6. Frontend refresca y muestra eventos sincronizados

---

## 📝 **NOTAS**

- La Edge Function sincroniza automáticamente estos deportes:
  - `soccer_epl`
  - `soccer_spain_la_liga`
  - `soccer_italy_serie_a`
  - `basketball_nba`
  - `americanfootball_nfl`
  - `icehockey_nhl`

- Si se proporciona `sportKey` en el body, solo sincroniza ese deporte.

- La función crea automáticamente deportes si no existen.

- La función actualiza eventos existentes si ya están en la BD.

---

## 🔗 **ENLACES ÚTILES**

- **Dashboard Supabase:** https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
- **Edge Functions:** https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/functions
- **Logs:** https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/functions/sync-events/logs
- **Producción:** https://betapredit.com/events

