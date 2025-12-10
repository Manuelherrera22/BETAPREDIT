# 📋 Instrucciones para Aplicar Migración en Supabase

**Migración:** `20251210071040_create_get_predictions_for_training.sql`

---

## 🔧 **OPCIÓN 1: Supabase Dashboard (Recomendado)**

### **Pasos:**

1. **Ir a Supabase Dashboard:**
   - Abre: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ir a SQL Editor:**
   - Menú lateral → **SQL Editor**
   - Click en **New Query**

3. **Copiar y Pegar SQL:**
   - Abre: `supabase/migrations/20251210071040_create_get_predictions_for_training.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor

4. **Ejecutar:**
   - Click en **Run** (o presiona Ctrl+Enter)
   - Deberías ver: "Success. No rows returned"

5. **Verificar:**
   ```sql
   SELECT * FROM get_predictions_for_training(5, 0.0, NULL, NULL);
   ```
   - Debería retornar datos (o lista vacía si no hay datos)

---

## 🔧 **OPCIÓN 2: Supabase CLI (Si está configurado)**

```bash
# Si tienes supabase link configurado
supabase db push

# O aplicar migración específica
supabase migration up
```

---

## 🔧 **OPCIÓN 3: psql Directo (Avanzado)**

```bash
# Conectar a Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Ejecutar migración
\i supabase/migrations/20251210071040_create_get_predictions_for_training.sql
```

---

## ✅ **VERIFICACIÓN**

### **1. Verificar que la función existe:**

```sql
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_predictions_for_training';
```

**Debería retornar:** 1 fila con la función

### **2. Probar la función:**

```sql
SELECT * FROM get_predictions_for_training(10, 0.0, NULL, NULL);
```

**Resultados posibles:**
- ✅ **Datos retornados:** Función funciona, hay datos reales
- ✅ **Lista vacía []:** Función funciona, pero no hay datos aún
- ❌ **Error:** Función no existe o hay problema

### **3. Verificar datos en tabla:**

```sql
SELECT COUNT(*) 
FROM "Prediction" 
WHERE "wasCorrect" IS NOT NULL 
  AND "actualResult" IS NOT NULL;
```

**Si retorna 0:**
- ⚠️ No hay predicciones con resultados reales aún
- ⚠️ Necesitas eventos finalizados con predicciones
- ⚠️ El sistema actualiza automáticamente cuando eventos terminan

---

## 🚀 **DESPUÉS DE APLICAR**

Una vez aplicada la migración:

1. **Ejecutar script de prueba:**
   ```bash
   python ml-services/scripts/test_supabase_connection.py
   ```

2. **Si hay datos, entrenar:**
   ```bash
   python ml-services/scripts/train_with_automl.py --samples 1000 --time-limit 3600
   ```

3. **El script usará datos reales automáticamente** ✅

---

## 📝 **NOTAS**

- La migración es **idempotente** (usa `CREATE OR REPLACE`)
- Puedes ejecutarla múltiples veces sin problemas
- No afecta datos existentes
- Solo crea la función SQL

