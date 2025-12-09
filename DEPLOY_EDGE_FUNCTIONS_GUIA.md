# 🚀 Guía de Deployment de Edge Functions

## ⚠️ Importante

Si los comandos automáticos no funcionan, sigue estos pasos manualmente en tu terminal.

## 📋 Pasos para Desplegar

### 1. Abrir Terminal (PowerShell o CMD)

Abre una terminal en el directorio raíz del proyecto:
```powershell
cd C:\Users\Corvus\Desktop\BETPREDIT
```

### 2. Verificar Supabase CLI

```powershell
supabase --version
```

Si no está instalado:
```powershell
npm install -g supabase
```

### 3. Login en Supabase (si es necesario)

```powershell
supabase login
```

Esto abrirá tu navegador para autenticarte.

### 4. Linkear Proyecto (opcional pero recomendado)

```powershell
supabase link --project-ref mdjzqxhjbisnlfpbjfgb
```

### 5. Desplegar External Bets

```powershell
supabase functions deploy external-bets --project-ref mdjzqxhjbisnlfpbjfgb
```

### 6. Desplegar User Statistics

```powershell
supabase functions deploy user-statistics --project-ref mdjzqxhjbisnlfpbjfgb
```

## ✅ Verificar Deployment

Después de desplegar, verifica que las funciones estén disponibles:

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Navega a **Edge Functions** en el menú lateral
3. Deberías ver:
   - `external-bets`
   - `user-statistics`

## 🔗 URLs de las Funciones

Una vez desplegadas, las funciones estarán disponibles en:

- **External Bets**: 
  ```
  https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/external-bets
  ```

- **User Statistics**: 
  ```
  https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-statistics
  ```

## 🧪 Probar las Funciones

### Probar External Bets (GET)

```powershell
# Reemplaza $TOKEN con tu token JWT de Supabase Auth
$TOKEN = "tu_token_aqui"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"

Invoke-WebRequest -Uri "https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/external-bets" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $TOKEN"
    "apikey" = $ANON_KEY
  }
```

### Probar User Statistics (GET)

```powershell
Invoke-WebRequest -Uri "https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-statistics?period=all_time" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $TOKEN"
    "apikey" = $ANON_KEY
  }
```

## 🐛 Troubleshooting

### Error: "Project not found"
- Verifica que el `project-ref` sea correcto: `mdjzqxhjbisnlfpbjfgb`
- Verifica que tengas permisos en el proyecto

### Error: "Not authenticated"
- Ejecuta `supabase login` nuevamente
- Verifica que tu sesión no haya expirado

### Error: "Entrypoint path does not exist"
- Verifica que estés en el directorio raíz del proyecto
- Verifica que los archivos existan en `supabase/functions/external-bets/index.ts` y `supabase/functions/user-statistics/index.ts`

### Error: "Docker is not running"
- Este warning es normal si no estás usando Supabase local
- Puedes ignorarlo si estás desplegando a Supabase Cloud

## 📝 Notas

- Las Edge Functions se despliegan automáticamente cuando haces push a producción
- El frontend detectará automáticamente las Edge Functions en producción
- En desarrollo, el frontend seguirá usando el backend local

## ✅ Checklist

- [ ] Supabase CLI instalado
- [ ] Login en Supabase realizado
- [ ] Proyecto linkeado (opcional)
- [ ] `external-bets` desplegada
- [ ] `user-statistics` desplegada
- [ ] Funciones verificadas en el dashboard
- [ ] Frontend probado en producción

---

**Una vez desplegadas, el frontend usará automáticamente las Edge Functions en producción.** 🎉

