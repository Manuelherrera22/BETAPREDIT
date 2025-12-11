# 🔍 Debug: Ver URL Exacta de Redirect URI

## 🎯 Objetivo

Ver exactamente qué URL está enviando Supabase a Google para identificar por qué no coincide.

---

## 📋 Pasos para Ver la URL Exacta

### Paso 1: Abrir DevTools

1. Abre https://betapredit.com
2. Presiona `F12` o `Ctrl+Shift+I` para abrir DevTools
3. Ve a la pestaña **"Network"** (Red)

### Paso 2: Filtrar Peticiones

1. En el campo de búsqueda de Network, escribe: `google`
2. Esto filtrará solo las peticiones a Google

### Paso 3: Intentar Login

1. Haz clic en **"Continuar con Google"**
2. Observa las peticiones en Network

### Paso 4: Encontrar la Petición a Google

1. Busca una petición a `accounts.google.com` o `oauth2.googleapis.com`
2. Haz clic en esa petición
3. Ve a la pestaña **"Headers"** o **"Payload"**

### Paso 5: Ver el Parámetro redirect_uri

1. En **"Query String Parameters"** o **"Request URL"**, busca el parámetro `redirect_uri`
2. Copia esa URL exacta
3. Esa es la URL que Supabase está enviando a Google

---

## 🔍 Qué Buscar

La URL debería ser algo como:
```
https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback
```

Pero puede tener variaciones como:
- `https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback?provider=google`
- `https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/authorize`
- O alguna otra variante

---

## ✅ Solución

Una vez que tengas la URL exacta:

1. **Cópiala exactamente** (con todos los parámetros si los tiene)
2. Ve a Google Cloud Console
3. Agrega esa URL exacta en "Authorized redirect URIs"
4. Guarda los cambios
5. Espera 2-3 minutos
6. Prueba de nuevo

---

## 📸 Ejemplo de Dónde Buscar

En Network tab, deberías ver algo como:

```
Request URL: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=40911110211-kird31hq5j2t435ummv8mu20fge7pn5p.apps.googleusercontent.com
  &redirect_uri=https://mdjzqxhjbisnlfpbjfgb.supabase.co/auth/v1/callback
  &response_type=code
  &scope=...
```

El valor de `redirect_uri` es el que necesitas copiar.

---

## 🆘 Si No Encuentras la Petición

1. Asegúrate de que **"Preserve log"** esté activado en Network
2. Limpia el filtro y busca todas las peticiones
3. Intenta hacer login de nuevo
4. Busca cualquier petición que contenga "oauth" o "google"

---

¡Una vez que tengas la URL exacta, agrégala en Google Cloud Console y debería funcionar!



