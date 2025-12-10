# ⚙️ CONFIGURAR CRON JOB: update-finished-events

## 🚀 **OPCIÓN 1: Usando SQL (Recomendado)**

### **Paso 1: Configurar Service Role Key**

En Supabase Dashboard → SQL Editor, ejecutar:

```sql
ALTER DATABASE postgres SET app.settings.service_role_key = 'sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys';
```

### **Paso 2: Aplicar Migración**

1. Ir a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/sql/new
2. Abrir: `supabase/migrations/create_update_finished_events_cron.sql`
3. Copiar TODO el contenido
4. Pegar en SQL Editor
5. Ejecutar

---

## 🚀 **OPCIÓN 2: Usando Dashboard (Más Simple)**

### **Paso 1: Ir a Cron Jobs**

1. Supabase Dashboard → Database → Cron Jobs
2. Click **"Create a new cron job"**

### **Paso 2: Configurar**

- **Name:** `update-finished-events-hourly`
- **Schedule:** `0 * * * *` (cada hora)
- **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events`
- **Method:** `POST`
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys"
  }
  ```
- **Body:** `{}`

### **Paso 3: Guardar**

Click **"Create cron job"**

---

## ✅ **VERIFICAR**

### **Ver cron jobs activos:**

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'update-finished-events-hourly';
```

### **Ver logs de ejecución:**

En Supabase Dashboard → Edge Functions → `update-finished-events` → Logs

---

## 🎯 **RESULTADO**

- ✅ La función se ejecutará automáticamente cada hora
- ✅ Eventos finalizados se actualizarán automáticamente
- ✅ Predicciones se actualizarán con resultados reales
- ✅ AutoML tendrá datos frescos constantemente

