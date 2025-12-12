# 🔄 Redesplegar Sitio en Netlify

## ✅ **Variables Configuradas**

Ya tienes las variables de entorno configuradas:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

## 📋 **Pasos para Redesplegar**

### **Opción 1: Desde Netlify Dashboard (Recomendado)**

1. Ve a tu sitio en Netlify Dashboard
2. Ve a la pestaña **"Deploys"**
3. Click en el botón **"Trigger deploy"** (arriba a la derecha)
4. Selecciona **"Clear cache and deploy site"**
5. Espera a que termine el deploy (puede tomar 2-5 minutos)

### **Opción 2: Desde Git (Automático)**

Si tienes cambios pendientes en Git:

```bash
git push
```

Netlify debería detectar el push y desplegar automáticamente.

---

## 🧪 **Después del Deploy**

1. Espera a que el deploy termine (verás "Published" en verde)
2. Abre https://betapredit.com
3. **Limpia el cache del navegador**: Ctrl+Shift+R (o Ctrl+F5)
4. Abre la consola (F12)
5. Deberías ver: `✅ Supabase configured:`
6. Ve a la página de **Arbitraje**
7. **NO deberías ver errores 401**

---

## 🔍 **Si el Error Persiste**

Si después del redeploy aún ves el error 401:

1. **Verifica que las variables tengan los valores correctos**:
   - Click en cada variable en Netlify
   - Verifica que los valores sean exactamente:
     - `VITE_SUPABASE_URL`: `https://mdjzqxhjbisnlfpbjfgb.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (el valor completo)

2. **Verifica en la consola del navegador**:
   - Abre F12 → Console
   - Busca mensajes que digan `VITE_SUPABASE_ANON_KEY no está definida`
   - Si ves ese mensaje, las variables no se están cargando

3. **Revisa los logs del deploy en Netlify**:
   - Ve a Deploys → Click en el último deploy
   - Revisa si hay errores durante el build

---

## 📝 **Nota Importante**

Las variables de entorno se aplican **durante el build**, no en runtime. Por eso es necesario redesplegar después de agregar o modificar variables.

---

**¿Ya redesplegaste el sitio?** Si no, hazlo ahora y luego prueba de nuevo.




