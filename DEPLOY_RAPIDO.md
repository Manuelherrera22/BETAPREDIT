# ⚡ DESPLIEGUE RÁPIDO: update-finished-events

## 🚀 **PASOS (5 minutos)**

### **1. Ir a Supabase Dashboard**
👉 https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/functions

### **2. Crear Edge Function**
- Click en **"Create a new function"**
- Nombre: `update-finished-events`
- Click **Create**

### **3. Copiar Código**
- Abrir: `supabase/functions/update-finished-events/index.ts`
- **Seleccionar TODO** (Ctrl+A)
- **Copiar** (Ctrl+C)
- Pegar en el editor de Supabase
- Click **Deploy**

### **4. Configurar Variables (Opcional)**
Si no están configuradas globalmente:
- Settings → Secrets
- Agregar:
  - `SUPABASE_URL`: `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys`
  - `THE_ODDS_API_KEY`: `06052d2a715f5ff4d5547225853bd5b8`

### **5. Ejecutar**
**Opción A: Desde Dashboard**
- Click en **"Invoke"** en la función
- Ver logs

**Opción B: Desde Python**
```bash
python scripts/ejecutar_update_events.py
```

---

## ✅ **VERIFICAR RESULTADO**

```sql
-- En Supabase SQL Editor
SELECT COUNT(*) FROM "Event" WHERE status = 'FINISHED';
SELECT COUNT(*) FROM "Prediction" WHERE "wasCorrect" IS NOT NULL;
```

---

## 🎯 **RESULTADO ESPERADO**

- ✅ 12 eventos → `status = FINISHED`
- ✅ Predicciones actualizadas con resultados
- ✅ AutoML puede entrenar con datos reales

