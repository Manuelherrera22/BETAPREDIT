# 🔧 Configurar Edge Function como Pública en Supabase

## 📍 **Ubicación de la Configuración**

En el dashboard de Supabase, la configuración de autenticación puede estar en diferentes lugares dependiendo de la versión:

### **Opción 1: En la Pestaña "Details"**

1. En el dashboard de `the-odds-api`
2. Ve a la pestaña **"Details"** (junto a "Overview", "Invocations", "Logs", "Code")
3. Busca una sección de **"Authentication"** o **"Security"**
4. Debería haber una opción para **"Public function"** o **"Require JWT verification"**

### **Opción 2: En la Pestaña "Code"**

1. Ve a la pestaña **"Code"**
2. Busca un archivo de configuración o settings
3. Puede haber opciones de configuración allí

### **Opción 3: Usar Supabase CLI (Alternativa)**

Si no encuentras la opción en el dashboard, puedes configurarla usando CLI:

```bash
# Verificar configuración actual
supabase functions list

# La función ya fue desplegada con --no-verify-jwt
# Esto debería hacerla pública automáticamente
```

### **Opción 4: Verificar en "Invocations"**

1. Ve a la pestaña **"Invocations"**
2. Revisa los logs de las invocaciones
3. Si ves errores 401, confirma que la función necesita ser pública

---

## 🔍 **Verificación Actual**

Según el dashboard que muestras:
- ✅ La función está desplegada (`the-odds-api`)
- ✅ Tiene invocaciones (4 requests)
- ✅ Tiene logs (8 worker logs)
- ⚠️ Algunas respuestas son 3xx (redirecciones) además de 2xx

---

## ✅ **Solución Rápida: Verificar que Funciona**

Si la función ya fue desplegada con `--no-verify-jwt`, debería funcionar. El error 401 puede ser por:

1. **Cache del navegador**: Limpia el cache y recarga
2. **Headers incorrectos**: Verifica que el frontend esté enviando los headers correctos
3. **Variables de entorno**: Verifica que `VITE_SUPABASE_ANON_KEY` esté configurado en Netlify

---

## 🧪 **Probar la Función Directamente**

Puedes probar la función directamente desde el dashboard:

1. En el dashboard de `the-odds-api`
2. Busca el botón **"Test"** (en la barra superior)
3. O ve a la pestaña **"Invocations"** → **"Invoke function"**
4. Prueba con:
   ```json
   {
     "method": "GET",
     "headers": {
       "Authorization": "Bearer tu_anon_key"
     }
   }
   ```

---

## 📝 **Si No Encuentras "Settings"**

Puede que en tu versión de Supabase la configuración esté en otro lugar:

1. **Busca en "Details"**: Es el lugar más común
2. **Busca un ícono de engranaje** ⚙️ o **"..."** (menú)
3. **Revisa la documentación**: https://supabase.com/docs/guides/functions

---

## 🔄 **Alternativa: Modificar el Código de la Función**

Si no puedes configurarla como pública desde el dashboard, podemos modificar el código de la función para que no requiera autenticación estricta (ya lo hicimos, pero podemos mejorarlo).

---

**¿Dónde estás viendo el dashboard?** ¿Puedes ver las pestañas "Details", "Code", "Invocations", "Logs"?




