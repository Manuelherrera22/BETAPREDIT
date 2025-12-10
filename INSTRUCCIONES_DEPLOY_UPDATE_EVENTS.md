# 🚀 INSTRUCCIONES: Desplegar update-finished-events

## **OPCIÓN 1: Usando Supabase Dashboard (Recomendado)**

### **Paso 1: Crear Edge Function**

1. Ir a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Menú lateral → **Edge Functions**
3. Click en **Create a new function**
4. Nombre: `update-finished-events`
5. Click **Create function**

### **Paso 2: Copiar Código**

1. Abrir el archivo: `supabase/functions/update-finished-events/index.ts`
2. **Copiar TODO el contenido**
3. Pegar en el editor de Supabase Dashboard
4. Click **Deploy**

### **Paso 3: Configurar Variables de Entorno**

En Supabase Dashboard → Edge Functions → Settings:

- `SUPABASE_URL`: `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys`
- `THE_ODDS_API_KEY`: `06052d2a715f5ff4d5547225853bd5b8`

### **Paso 4: Ejecutar Manualmente**

**Desde el Dashboard:**
1. Edge Functions → `update-finished-events`
2. Click en **Invoke**
3. Ver logs para verificar

**O desde Postman/curl:**
```bash
POST https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events
Headers:
  Authorization: Bearer sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys
  Content-Type: application/json
Body: {}
```

---

## **OPCIÓN 2: Usando Supabase CLI**

```bash
# Si tienes Supabase CLI instalado
cd C:\Users\Corvus\Desktop\BETPREDIT
supabase functions deploy update-finished-events
```

---

## **VERIFICACIÓN**

Después de ejecutar, verificar:

```sql
-- Ver eventos actualizados
SELECT COUNT(*) FROM "Event" WHERE status = 'FINISHED';

-- Ver predicciones actualizadas
SELECT COUNT(*) FROM "Prediction" WHERE "wasCorrect" IS NOT NULL;
```

---

## **CONFIGURAR CRON JOB (Opcional - Automático)**

Para ejecución automática cada hora:

1. Supabase Dashboard → Database → Cron Jobs
2. Create new cron job
3. **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events`
4. **Schedule:** `0 * * * *` (cada hora)
5. **Headers:**
   ```json
   {
     "Authorization": "Bearer sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys",
     "Content-Type": "application/json"
   }
   ```

---

## ✅ **RESULTADO ESPERADO**

- ✅ 12 eventos → `status = FINISHED`
- ✅ Predicciones actualizadas con resultados
- ✅ Función `get_predictions_for_training` retorna datos reales

