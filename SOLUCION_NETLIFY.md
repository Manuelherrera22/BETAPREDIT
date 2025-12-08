# 🔧 Solución al Problema de Netlify - "No results found"

## Problema
Netlify muestra "No results found" al intentar seleccionar la rama "master" para desplegar.

## Posibles Causas

1. **Netlify no ha cargado las ramas del repositorio**
   - Espera unos segundos y recarga la página
   - O desconecta y vuelve a conectar el repositorio

2. **La rama se llama diferente**
   - Algunos repositorios usan "main" en lugar de "master"
   - Verifica el nombre exacto de tu rama

3. **El repositorio no está completamente conectado**
   - Verifica que Netlify tenga acceso completo al repositorio

## Soluciones Paso a Paso

### Solución 1: Recargar y Esperar
1. Cierra el dropdown de "Branch to deploy"
2. Espera 10-15 segundos
3. Recarga la página (F5)
4. Vuelve a abrir el dropdown
5. Deberías ver "master" en la lista

### Solución 2: Desconectar y Reconectar
1. En Netlify, ve a "Site settings"
2. Ve a "Build & deploy" → "Continuous Deployment"
3. Click en "Disconnect repository"
4. Luego "Connect repository" de nuevo
5. Selecciona tu repositorio
6. Ahora debería cargar las ramas correctamente

### Solución 3: Configuración Manual
Si el dropdown no funciona:
1. Click en "Show advanced" o "Override settings"
2. Escribe manualmente en el campo: `master`
3. O deja el campo vacío (Netlify usará la rama por defecto)

### Solución 4: Verificar Nombre de Rama
Ejecuta en tu terminal:
```bash
git branch
```

Si la rama se llama "main" en lugar de "master":
- Usa "main" en Netlify
- O renombra la rama a "master"

### Solución 5: Usar netlify.toml
El archivo `netlify.toml` ya está configurado. Netlify debería detectarlo automáticamente después de conectar el repositorio.

## Configuración Recomendada

Si Netlify te permite configurar manualmente:

- **Branch to deploy:** `master` (o `main` si es tu rama principal)
- **Base directory:** (dejar vacío)
- **Build command:** `cd frontend && npm install && npm run build`
- **Publish directory:** `frontend/dist`

## Si Nada Funciona

1. **Crea un nuevo sitio en Netlify:**
   - Ve a "Add new site"
   - Selecciona "Deploy manually"
   - Arrastra la carpeta `frontend/dist` (después de hacer build local)
   - Esto te dará una URL temporal

2. **O usa Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

## Verificación

Después de configurar, verifica que:
- ✅ El repositorio esté conectado
- ✅ La rama esté seleccionada
- ✅ El build command sea correcto
- ✅ El publish directory sea `frontend/dist`

