# 🔧 Solución de Problemas de Conexión a Supabase

## ❌ Error: "Can't reach database server"

Este error significa que la URL está configurada pero no puede conectarse al servidor.

---

## ✅ Soluciones

### Opción 1: Usar Connection Pooling (Recomendado)

Supabase recomienda usar **Connection Pooling** en lugar de conexión directa.

#### Cómo obtener la URL de Connection Pooling:

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/settings/database
2. Busca la sección **"Connection string"** o **"Connection pooling"**
3. Selecciona el formato **"URI"** o **"Connection pooling"**
4. Copia la URL completa

#### Formato típico de Connection Pooling:

```
postgresql://postgres.mdjzqxhjbisnlfpbjfgb:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Nota:** El puerto es `6543` (no `5432`) y usa `pooler.supabase.com`

---

### Opción 2: Verificar URL Directa

Si usas conexión directa, verifica:

1. **Formato correcto:**
   ```
   postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
   ```

2. **Verifica que:**
   - El Project ID sea correcto: `mdjzqxhjbisnlfpbjfgb`
   - La contraseña sea correcta (sin espacios)
   - El proyecto esté activo en Supabase

3. **Si la contraseña tiene caracteres especiales:**
   - Puede necesitar URL encoding
   - O usa Connection Pooling que maneja esto mejor

---

### Opción 3: Verificar Estado del Proyecto

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Verifica que el proyecto esté **activo** (no pausado)
3. Si está pausado, reactívalo

---

### Opción 4: Probar con Prisma Studio

```bash
cd backend
npx prisma studio
```

Si Prisma Studio se conecta, el problema puede ser con el script de verificación.

---

## 🔍 Verificación Paso a Paso

### 1. Verificar que DATABASE_URL esté en .env

```bash
cd backend
# Verificar contenido
cat .env | grep DATABASE_URL
```

### 2. Verificar formato

La URL debe:
- ✅ Empezar con `postgresql://`
- ✅ Contener `postgres:` (usuario)
- ✅ Contener `@db.mdjzqxhjbisnlfpbjfgb.supabase.co` o `@pooler.supabase.com`
- ✅ Terminar con `:5432/postgres` o `:6543/postgres`
- ✅ Estar entre comillas dobles: `"..."`

### 3. Probar conexión manual

```bash
# Con Prisma
npx prisma db pull

# O con psql (si lo tienes instalado)
psql "postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"
```

---

## 💡 Recomendación Final

**Usa Connection Pooling** - Es más confiable y recomendado por Supabase:

1. Ve a Settings → Database
2. Busca "Connection pooling"
3. Copia la URL completa
4. Reemplaza `DATABASE_URL` en `backend/.env`

---

## 🆘 Si Nada Funciona

1. **Verifica en Supabase Dashboard:**
   - ¿El proyecto está activo?
   - ¿Hay algún error en los logs?

2. **Prueba desde otro lugar:**
   - ¿Funciona desde Prisma Studio?
   - ¿Funciona desde otro cliente SQL?

3. **Contacta soporte de Supabase:**
   - Puede haber un problema con el proyecto
   - O restricciones de red/firewall

---

## ✅ Una Vez que Funcione

Cuando la conexión funcione, ejecuta:

```bash
cd backend
npm run migrate    # Crear tablas
npm run dev        # Iniciar backend
```

Deberías ver en los logs:
```
✅ Connected to Supabase database successfully
```




