# 🔍 Debug Error 404 - User Profile

**Error:** `GET https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile 404 (Not Found)`

---

## ✅ Verificaciones Realizadas

### 1. Función Desplegada
- ✅ **Estado:** ACTIVE (v3)
- ✅ **Última actualización:** 2025-12-12 13:34:09
- ✅ **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile`

### 2. Prueba Directa
```bash
# Sin auth → Retorna 401 (correcto)
curl https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile \
  -H "apikey: YOUR_ANON_KEY"
# Response: {"success":false,"error":{"message":"No authorization header"}}
```

**Conclusión:** La función está desplegada y funcionando correctamente.

---

## 🔍 Posibles Causas del 404

### 1. Caché del Navegador
El navegador puede estar cacheando una respuesta 404 anterior.

**Solución:**
- Limpiar caché del navegador
- Hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
- Probar en modo incógnito

### 2. Detección de Entorno
El código detecta producción usando:
```typescript
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
```

**Verificar:**
- ¿Estás en producción o desarrollo?
- ¿`import.meta.env.PROD` es `true`?
- ¿`window.location.hostname` es `'localhost'`?

### 3. Headers Faltantes
Asegúrate de que se envíen ambos headers:
- ✅ `Authorization: Bearer TOKEN`
- ✅ `apikey: VITE_SUPABASE_ANON_KEY`

### 4. Token Inválido o Expirado
El token de Supabase puede estar expirado o ser inválido.

**Verificar:**
- ¿El usuario está autenticado?
- ¿El token se obtiene correctamente?
- ¿El token es válido?

---

## 🛠️ Soluciones Aplicadas

### 1. Agregado Header `apikey`
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '', // ✅ AGREGADO
  'Content-Type': 'application/json',
}
```

### 2. Mejorado Manejo de Errores
```typescript
if (!response.ok) {
  let errorMessage = 'Failed to fetch profile';
  try {
    const error = await response.json();
    errorMessage = error.error?.message || error.message || errorMessage;
    console.error('[userProfileService] Error response:', error);
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    console.error('[userProfileService] Error status:', response.status);
  }
  throw new Error(errorMessage);
}
```

### 3. Agregado Logging
```typescript
console.log('[userProfileService] Fetching profile from:', url);
```

### 4. Función Redesplegada
- Versión: v3
- Estado: ACTIVE
- Fecha: 2025-12-12 13:34:09

---

## 🔧 Pasos para Debug

### 1. Verificar en Consola del Navegador
Abre la consola del navegador y busca:
- `[userProfileService] Fetching profile from: ...`
- Errores de red
- Status code de la respuesta

### 2. Verificar Headers en Network Tab
En DevTools → Network:
- Verifica que la request tenga:
  - `Authorization: Bearer ...`
  - `apikey: ...`
- Verifica el status code real (puede no ser 404)

### 3. Verificar Variables de Entorno
```javascript
// En consola del navegador
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('PROD:', import.meta.env.PROD);
console.log('hostname:', window.location.hostname);
```

### 4. Probar Directamente
```javascript
// En consola del navegador
const token = 'YOUR_TOKEN';
const url = 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile';
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': 'YOUR_ANON_KEY',
  }
}).then(r => r.json()).then(console.log).catch(console.error);
```

---

## 📋 Checklist de Verificación

- [ ] Función desplegada y ACTIVE
- [ ] Header `apikey` incluido en request
- [ ] Header `Authorization` incluido en request
- [ ] Token válido y no expirado
- [ ] Variables de entorno configuradas
- [ ] Caché del navegador limpiado
- [ ] Logging muestra la URL correcta
- [ ] Network tab muestra los headers correctos

---

## 🚨 Si el Problema Persiste

1. **Verificar en Network Tab:**
   - ¿Qué status code muestra realmente?
   - ¿Los headers se envían correctamente?
   - ¿La URL es correcta?

2. **Verificar Token:**
   - ¿El token es válido?
   - ¿El token no ha expirado?
   - ¿El usuario existe en Supabase?

3. **Verificar Variables de Entorno:**
   - ¿`VITE_SUPABASE_URL` está configurado?
   - ¿`VITE_SUPABASE_ANON_KEY` está configurado?
   - ¿Están disponibles en producción?

4. **Contactar Soporte:**
   - Si todo lo anterior está correcto, puede ser un problema de Supabase
   - Verificar en Dashboard de Supabase si hay errores

---

**Última actualización:** 12 de Diciembre, 2025 13:40 UTC
