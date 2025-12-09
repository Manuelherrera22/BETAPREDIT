# ⚠️ Solución: The Odds API Quota Exceeded

## ❌ **Problema**

El error indica que la cuota de uso de The Odds API se ha agotado:

```
"Usage quota has been reached"
"OUT_OF_USAGE_CREDITS"
```

## 🔍 **Causa**

The Odds API tiene límites de uso según el plan:
- **Free Plan**: 500 requests/month
- **Paid Plans**: Más requests según el plan

Si has alcanzado el límite, necesitas:
1. **Esperar** hasta que se reinicie la cuota (mensual)
2. **Actualizar** tu plan en The Odds API
3. **Usar datos mock** temporalmente

---

## ✅ **Soluciones**

### **Opción 1: Actualizar Plan en The Odds API (Recomendado)**

1. Ve a: https://the-odds-api.com
2. Login en tu cuenta
3. Ve a **"Pricing"** o **"Upgrade"**
4. Selecciona un plan con más requests
5. Actualiza tu API key si es necesario

### **Opción 2: Verificar Cuota Actual**

1. Ve a: https://the-odds-api.com
2. Login en tu cuenta
3. Ve a **"Dashboard"** o **"Usage"**
4. Revisa cuántas requests has usado y cuándo se reinicia

### **Opción 3: Usar Datos Mock Temporalmente**

Si necesitas que la plataforma funcione mientras resuelves el tema de la cuota, podemos implementar datos mock.

---

## 🔧 **Cambios Aplicados**

He mejorado el manejo de este error:

1. ✅ **Edge Function** ahora detecta y retorna correctamente el error de cuota
2. ✅ **Frontend** muestra un mensaje claro cuando la cuota está agotada
3. ✅ **Logging** mejorado para identificar el problema rápidamente

---

## 📝 **Próximos Pasos**

1. **Verifica tu cuenta de The Odds API**:
   - ¿Cuántas requests has usado?
   - ¿Cuándo se reinicia la cuota?
   - ¿Necesitas actualizar el plan?

2. **Si actualizas el plan**:
   - Verifica que la API key siga siendo la misma
   - Si cambia, actualiza el secret en Supabase:
     ```bash
     supabase secrets set THE_ODDS_API_KEY=nueva_api_key
     ```

3. **Si prefieres usar datos mock**:
   - Podemos implementar datos de ejemplo para desarrollo
   - Esto permitirá que la plataforma funcione sin The Odds API

---

## 🧪 **Verificar Estado**

Después de resolver el tema de la cuota:

1. Recarga la página
2. Ve a la página de Arbitraje
3. Deberías ver datos reales (si la cuota está disponible)
4. O ver un mensaje claro sobre la cuota agotada

---

**¿Quieres que implemente datos mock temporalmente, o prefieres actualizar el plan de The Odds API?**

