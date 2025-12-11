# 🚀 Desplegar Edge Function - Pasos Manuales

Como el login de Supabase CLI requiere autenticación interactiva, aquí están los pasos exactos:

## 📋 Pasos

### 1. Login en Supabase CLI

Abre PowerShell o Terminal y ejecuta:

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte. Sigue las instrucciones.

### 2. Link Proyecto

```bash
cd supabase
supabase link --project-ref mdjzqxhjbisnlfpbjfgb
```

Te pedirá el **Database Password**. Es la contraseña de tu base de datos Supabase.

### 3. Configurar Secret (API Key)

Primero, obtén tu API key de The Odds API del archivo `backend/.env`:

```bash
# Ver la API key (si está en .env)
cd backend
node -e "require('dotenv').config(); console.log(process.env.THE_ODDS_API_KEY);"
```

Luego configura el secret:

```bash
cd ..
supabase secrets set THE_ODDS_API_KEY=tu_api_key_aqui
```

### 4. Deploy la Función

```bash
supabase functions deploy the-odds-api
```

### 5. Verificar

```bash
supabase functions list
```

Deberías ver `the-odds-api` en la lista.

---

## 🔄 Alternativa: Usar Supabase Dashboard

Si prefieres usar el dashboard en lugar de CLI:

### 1. Crear Función en Dashboard

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. **Edge Functions** → **Create a new function**
3. Nombre: `the-odds-api`
4. Copia el código de `supabase/functions/the-odds-api/index.ts`
5. **Deploy**

### 2. Configurar Secret

1. **Edge Functions** → **Settings** → **Secrets**
2. Agrega:
   - **Name**: `THE_ODDS_API_KEY`
   - **Value**: Tu API key de The Odds API

### 3. Verificar

La función estará disponible en:
```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/the-odds-api/sports
```

---

## ✅ Después del Deploy

El frontend automáticamente usará la Edge Function en producción. No necesitas hacer nada más.

Solo verifica que:
- [ ] La función esté desplegada
- [ ] El secret esté configurado
- [ ] El frontend esté redeployado en Netlify



