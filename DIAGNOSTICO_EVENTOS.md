# 🔍 Diagnóstico: Por qué no aparecen eventos

**Fecha:** Diciembre 2024  
**Problema:** Los eventos no aparecen en la aplicación

---

## 🔴 **PROBLEMAS IDENTIFICADOS**

### 1. **Mapeo de Deportes Muy Limitado** ❌ CRÍTICO

**Problema Actual:**
```typescript
// En events.service.ts línea 145-159
const sportMapping: Record<string, string> = {
  'soccer': 'soccer_epl',
  'basketball': 'basketball_nba',
  'americanfootball': 'americanfootball_nfl',
  'baseball': 'baseball_mlb',
};
```

**Problemas:**
- Solo mapea 4 deportes
- No busca el deporte en la base de datos por ID
- Si el `sportId` no coincide exactamente, usa `soccer_epl` por defecto
- No funciona con IDs de Supabase (cuid(), no son "soccer", "basketball")

**Solución Necesaria:**
- Buscar el deporte en la BD por ID
- Usar el `slug` del deporte como clave de The Odds API
- Si no tiene slug, crear uno basado en el nombre

### 2. **The Odds API Puede No Estar Configurada** ⚠️

**Problema:**
- Si `THE_ODDS_API_KEY` no está en variables de entorno, `getTheOddsAPIService()` retorna `null`
- El código hace fallback a BD, pero si BD está vacía, no hay eventos

**Verificación Necesaria:**
- Verificar que `THE_ODDS_API_KEY` esté configurada
- Verificar que la API key sea válida
- Verificar límites de requests (The Odds API tiene límites)

### 3. **Base de Datos Puede Estar Vacía** ⚠️

**Problema:**
- Si The Odds API falla, hace fallback a BD
- Si BD no tiene eventos sincronizados, retorna array vacío
- No hay tarea automática que sincronice eventos periódicamente

**Solución:**
- Agregar tarea programada para sincronizar eventos cada hora
- Mejorar el mapeo de deportes para que funcione correctamente

### 4. **Falta Manejo de Errores Mejor** ⚠️

**Problema:**
- Si The Odds API falla, solo hace `logger.warn` y continúa
- No hay feedback claro al usuario sobre qué está pasando
- No hay retry logic

---

## ✅ **SOLUCIONES A IMPLEMENTAR**

### **Solución 1: Mejorar Mapeo de Deportes (CRÍTICO)**

```typescript
// En events.service.ts
private async mapSportIdToTheOddsAPIKey(sportId?: string): Promise<string> {
  if (!sportId) {
    return 'soccer_epl'; // Default
  }

  // Buscar deporte en BD por ID
  const sport = await prisma.sport.findUnique({
    where: { id: sportId },
  });

  if (sport && sport.slug) {
    // Usar slug directamente si existe
    return sport.slug;
  }

  // Si no tiene slug, intentar mapear por nombre
  if (sport) {
    const nameMapping: Record<string, string> = {
      'Soccer': 'soccer_epl',
      'Football': 'soccer_epl',
      'Basketball': 'basketball_nba',
      'American Football': 'americanfootball_nfl',
      'Baseball': 'baseball_mlb',
      'Tennis': 'tennis',
      'Ice Hockey': 'icehockey_nhl',
      'Rugby': 'rugby_league_nrl',
    };

    for (const [name, key] of Object.entries(nameMapping)) {
      if (sport.name.toLowerCase().includes(name.toLowerCase())) {
        return key;
      }
    }
  }

  // Default
  return 'soccer_epl';
}
```

### **Solución 2: Agregar Tarea de Sincronización Automática**

```typescript
// En scheduled-tasks.service.ts
private startEventSync(intervalMs: number) {
  const taskName = 'event-sync';
  
  // Ejecutar inmediatamente
  this.runEventSync();
  
  // Luego cada hora
  const interval = setInterval(() => {
    this.runEventSync();
  }, intervalMs);
  
  this.intervals.set(taskName, interval);
}

private async runEventSync() {
  try {
    logger.info('Running event sync...');
    const theOddsAPI = getTheOddsAPIService();
    if (!theOddsAPI) {
      logger.warn('The Odds API not configured, skipping event sync');
      return;
    }

    // Sincronizar eventos de deportes principales
    const mainSports = ['soccer_epl', 'basketball_nba', 'americanfootball_nfl'];
    for (const sportKey of mainSports) {
      try {
        await eventSyncService.syncSportEvents(sportKey);
      } catch (error) {
        logger.warn(`Error syncing ${sportKey}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error running event sync:', error);
  }
}
```

### **Solución 3: Mejorar Manejo de Errores y Feedback**

```typescript
// En events.service.ts getUpcomingEvents
if (useTheOddsAPI) {
  try {
    const theOddsAPI = getTheOddsAPIService();
    if (!theOddsAPI) {
      logger.warn('The Odds API service not configured');
      // Intentar BD de todas formas
    } else {
      const sportKey = await this.mapSportIdToTheOddsAPIKey(sportId);
      const oddsEvents = await theOddsAPI.getOdds(sportKey, {...});
      
      if (oddsEvents && oddsEvents.length > 0) {
        await eventSyncService.syncEventsFromOddsData(oddsEvents);
        return await this.getUpcomingEventsFromDB({ sportId, date, limit });
      } else {
        logger.info(`No events from The Odds API for ${sportKey}, trying DB`);
      }
    }
  } catch (error: any) {
    logger.error('Error fetching from The Odds API:', error.message);
    // Continuar con BD
  }
}
```

---

## 🎯 **PRIORIDADES**

### **ALTA PRIORIDAD (Implementar Ahora):**
1. ✅ Mejorar mapeo de deportes (buscar en BD por ID)
2. ✅ Agregar tarea de sincronización automática
3. ✅ Mejorar logging y manejo de errores

### **MEDIA PRIORIDAD:**
4. Agregar retry logic para The Odds API
5. Cachear eventos en Redis para reducir requests
6. Agregar endpoint para sincronización manual

---

## 📊 **VERIFICACIÓN**

Para diagnosticar el problema actual:

1. **Verificar The Odds API:**
   - ¿Está `THE_ODDS_API_KEY` configurada?
   - ¿La API key es válida?
   - ¿Hay requests disponibles?

2. **Verificar Base de Datos:**
   - ¿Hay eventos en la tabla `Event`?
   - ¿Hay deportes en la tabla `Sport`?
   - ¿Los deportes tienen `slug` correcto?

3. **Verificar Logs:**
   - Buscar "The Odds API service not configured"
   - Buscar "No events found for sport"
   - Buscar errores de sincronización

---

## 🔧 **ARCHIVOS A MODIFICAR**

1. `backend/src/services/events.service.ts` - Mejorar mapeo de deportes
2. `backend/src/services/scheduled-tasks.service.ts` - Agregar sincronización automática
3. `backend/src/services/event-sync.service.ts` - Mejorar manejo de errores

---

## 💡 **ALTERNATIVAS SI THE ODDS API NO FUNCIONA**

Si The Odds API tiene problemas o límites:

1. **API-Football** (ya integrada parcialmente)
   - Más eventos de fútbol
   - Datos más detallados
   - Límites diferentes

2. **Sportradar** (si tienen acceso)
   - Datos profesionales
   - Múltiples deportes
   - API robusta

3. **Combinar múltiples APIs**
   - The Odds API para cuotas
   - API-Football para eventos de fútbol
   - Otras APIs para otros deportes

---

## ✅ **CONCLUSIÓN**

**El problema principal es:**
1. Mapeo de deportes muy limitado (no busca en BD)
2. No hay sincronización automática de eventos
3. Falta mejor manejo de errores

**Con las soluciones propuestas, el sistema funcionará correctamente.**

