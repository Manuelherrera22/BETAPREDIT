# 🔑 Actualizar API Key de The Odds API

## ✅ **API Key Actualizada**

**Nueva API Key:** `06052d2a715f5ff4d5547225853bd5b8`

## 📝 **Dónde se Actualizó**

### **1. Backend (.env)**
- Archivo: `backend/.env`
- Variable: `THE_ODDS_API_KEY=06052d2a715f5ff4d5547225853bd5b8`

### **2. Supabase Secrets (Edge Function)**
- Secret: `THE_ODDS_API_KEY`
- Valor: `06052d2a715f5ff4d5547225853bd5b8`
- La Edge Function usará esta key automáticamente

---

## 🔄 **Próximos Pasos**

### **1. Reiniciar Backend (si está corriendo)**
```bash
# Detener el backend actual
# Luego reiniciarlo para cargar la nueva API key
cd backend
npm run dev
```

### **2. Verificar Edge Function**
La Edge Function de Supabase ya está usando la nueva key (se actualizó automáticamente).

### **3. Probar la Plataforma**
1. Abre la página de Arbitraje
2. Abre la página de Comparación de Cuotas
3. Verifica que no aparezcan errores de cuota agotada

---

## 🧪 **Verificar que Funciona**

### **Opción 1: Desde la Consola del Navegador**
```javascript
// Verificar uso de API
import apiUsageMonitor from './utils/apiUsageMonitor';
console.log(apiUsageMonitor.getUsage());
```

### **Opción 2: Probar Endpoint Directamente**
```bash
curl "https://api.the-odds-api.com/v4/sports?apiKey=06052d2a715f5ff4d5547225853bd5b8"
```

Si funciona, deberías ver una lista de deportes en JSON.

---

## 📊 **Monitoreo**

Con las optimizaciones implementadas:
- **Uso esperado**: ~50-100 llamadas/día
- **Límite**: 500 créditos/mes
- **Duración estimada**: Todo el mes con uso normal

---

**Fecha de actualización:** 2025-12-09




