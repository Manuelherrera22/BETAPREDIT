# 🔧 Solución Error 404 - User Profile Edge Function

**Fecha:** 12 de Diciembre, 2025  
**Error:** `GET https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile 404 (Not Found)`

---

## 🔍 Diagnóstico

El error 404 indica que la Edge Function `user-profile` no se encuentra o no está accesible.

### Posibles Causas

1. **Falta header `apikey`** - Las Edge Functions de Supabase requieren el header `apikey` además de `Authorization`
2. **Función no desplegada correctamente** - La función puede no estar activa
3. **Ruta incorrecta** - La URL puede estar mal formada

---

## ✅ Solución Aplicada

### 1. Agregar Header `apikey`

Se agregó el header `apikey` requerido por Supabase Edge Functions en `userProfileService.ts`:

```typescript
const response = await fetch(`${supabaseUrl}/user-profile`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '', // ✅ AGREGADO
    'Content-Type': 'application/json',
  },
});
```

### 2. Verificar Despliegue

La función está desplegada y ACTIVE:
- **Estado:** ✅ ACTIVE (v1)
- **Última actualización:** 2025-12-12 12:43:23
- **URL:** `https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile`

### 3. Redesplegar Función

Se redesplegó la función para asegurar que esté activa:
```bash
supabase functions deploy user-profile
```

---

## 📋 Verificación

### Estado de la Función
- ✅ Función desplegada: `user-profile` ACTIVE
- ✅ Header `apikey` agregado en frontend
- ✅ Header `Authorization` presente
- ✅ Ruta correcta: `/functions/v1/user-profile`

### Prueba Manual
```bash
# Sin auth (debe retornar 401)
curl https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile \
  -H "apikey: YOUR_ANON_KEY"

# Con auth (debe retornar 200 o 401 si token inválido)
curl https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/user-profile \
  -H "Authorization: Bearer TOKEN" \
  -H "apikey: YOUR_ANON_KEY"
```

---

## 🔄 Cambios Realizados

### `frontend/src/services/userProfileService.ts`

**Antes:**
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

**Después:**
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '', // ✅ AGREGADO
  'Content-Type': 'application/json',
}
```

---

## ✅ Resultado Esperado

Después de estos cambios:
- ✅ La función debería responder correctamente
- ✅ No más errores 404
- ✅ El perfil de usuario se puede obtener y actualizar

---

## 📝 Notas

1. **Header `apikey` es requerido** por Supabase Edge Functions para autenticación
2. **El header `Authorization`** contiene el token JWT del usuario
3. **Ambos headers son necesarios** para que la función funcione correctamente

---

## 🚀 Próximos Pasos

1. ✅ Verificar que el build pase correctamente
2. ✅ Probar en producción que la función responda
3. ✅ Verificar que otros servicios también incluyan `apikey` si es necesario

---

**Última actualización:** 12 de Diciembre, 2025 13:30 UTC
