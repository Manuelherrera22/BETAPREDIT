# The Odds API Edge Function

Esta función hace proxy a The Odds API para evitar problemas de CORS y mantener la API key segura.

## Configuración

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login en Supabase

```bash
supabase login
```

### 3. Link tu proyecto

```bash
supabase link --project-ref mdjzqxhjbisnlfpbjfgb
```

### 4. Configurar Secret

```bash
supabase secrets set THE_ODDS_API_KEY=tu_api_key_aqui
```

### 5. Deploy la función

```bash
supabase functions deploy the-odds-api
```

## Uso

Una vez desplegada, la función estará disponible en:

```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/the-odds-api/sports
https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/the-odds-api/sports/soccer_epl/odds
```

## Actualizar Frontend

El frontend debe usar esta URL en lugar de `/api/the-odds-api`:

```typescript
const SUPABASE_FUNCTIONS_URL = 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1';
```

