# 🚀 Aplicar Migración en Supabase - PASOS RÁPIDOS

**Migración:** `20251210071040_create_get_predictions_for_training.sql`

---

## 📋 **PASOS (2 minutos)**

### **1. Ir a Supabase Dashboard**
- Abre: https://supabase.com/dashboard
- Selecciona proyecto: `mdjzqxhjbisnlfpbjfgb`

### **2. Abrir SQL Editor**
- Menú lateral → **SQL Editor**
- Click en **New Query**

### **3. Copiar y Pegar SQL**
- Abre el archivo: `supabase/migrations/20251210071040_create_get_predictions_for_training.sql`
- **Copia TODO el contenido** (115 líneas)
- Pégalo en el SQL Editor

### **4. Ejecutar**
- Click en **Run** (o Ctrl+Enter)
- Deberías ver: **"Success. No rows returned"**

### **5. Verificar (Opcional)**
```sql
SELECT * FROM get_predictions_for_training(5, 0.0, NULL, NULL);
```
- Si funciona: ✅ Migración aplicada
- Si hay error: ⚠️ Revisar mensaje de error

---

## ✅ **LISTO**

Una vez aplicada, el script de entrenamiento usará datos reales automáticamente.

