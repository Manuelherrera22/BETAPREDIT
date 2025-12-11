# 🔑 Cómo Obtener DATABASE_URL de Supabase

## 📍 Ubicación en el Dashboard

La **Connection String** no está en Settings → Database. Está en otra sección:

### Opción 1: Desde "Project Settings" (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. En el menú izquierdo, busca **"Project Settings"** (icono de engranaje ⚙️)
3. Click en **"Database"** en el submenú
4. Busca la sección **"Connection string"** o **"Connection pooling"**
5. Selecciona **"URI"** o **"Connection string"**
6. Copia la URL completa

### Opción 2: Construirla Manualmente

Si no encuentras la connection string, puedes construirla con la información que tienes:

#### Paso 1: Obtener la Contraseña

1. En **Settings → Database** (donde estás ahora)
2. Busca **"Database password"**
3. Si no la ves, click en **"Reset database password"**
4. Copia la contraseña (guárdala en un lugar seguro)

#### Paso 2: Construir la URL

Con tu Project ID: `mdjzqxhjbisnlfpbjfgb`

**Formato básico:**
```
postgresql://postgres:[TU_PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
```

**Ejemplo:**
```
postgresql://postgres:MiPassword123@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
```

### Opción 3: Connection Pooling (Mejor para producción)

Si ves la opción de "Connection pooling", usa esta URL en su lugar:

**Formato:**
```
postgresql://postgres.mdjzqxhjbisnlfpbjfgb:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Para encontrar el REGION:**
- Ve a **Project Settings → General**
- Busca "Region" o "Data center location"
- Ejemplo: `us-east-1`, `eu-west-1`, etc.

---

## 🔍 Dónde Buscar en el Dashboard

### Si estás en "Database" → "Settings":
- ✅ **Database password** - Aquí puedes resetear/ver la contraseña
- ❌ Connection string - NO está aquí

### Ve a "Project Settings" → "Database":
- ✅ **Connection string** - Aquí está la URL completa
- ✅ **Connection pooling** - URL optimizada para producción

---

## 📝 Pasos Detallados

### Método Más Fácil:

1. **Ve a Project Settings:**
   - Click en el icono de engranaje ⚙️ en el menú izquierdo
   - O ve directamente a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/settings/database

2. **Busca "Connection string":**
   - Scroll hacia abajo
   - Verás una sección con diferentes formatos:
     - **URI** (esta es la que necesitas)
     - **JDBC**
     - **Node.js**
     - **Python**
     - etc.

3. **Copia la URI:**
   - Selecciona el formato **"URI"**
   - Click en el icono de copiar 📋
   - Pégala en tu `.env` como `DATABASE_URL`

---

## 🎯 Si Aún No La Encuentras

### Construcción Manual Paso a Paso:

1. **Obtén la contraseña:**
   - Ve a Settings → Database
   - Click "Reset database password"
   - Copia la nueva contraseña

2. **Construye la URL:**
   ```
   postgresql://postgres:[PASSWORD_AQUI]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
   ```

3. **Reemplaza [PASSWORD_AQUI] con tu contraseña real**

4. **Agrega a `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:TuPassword123@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"
   ```

---

## ✅ Verificación

Una vez que agregues el `DATABASE_URL` a `backend/.env`, verifica:

```bash
cd backend
npm run verify-db
```

Si funciona, verás:
```
✅ Conexión exitosa a Supabase!
```

---

## 🆘 Si Tienes Problemas

### Error: "password authentication failed"
- Verifica que la contraseña sea correcta
- Si la cambiaste, actualiza el `.env`

### Error: "could not connect to server"
- Verifica que el Project ID sea correcto: `mdjzqxhjbisnlfpbjfgb`
- Verifica que el proyecto esté activo en Supabase

### Error: "Environment variable not found"
- Asegúrate de que el archivo se llame exactamente `.env` (no `.env.example`)
- Asegúrate de que esté en la carpeta `backend/`
- Reinicia el servidor después de agregar la variable

---

## 📞 Alternativa: Usar Supabase CLI

Si prefieres, puedes usar la CLI de Supabase:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link tu proyecto
supabase link --project-ref mdjzqxhjbisnlfpbjfgb

# Ver connection string
supabase status
```

---

## 💡 Tip

**La connection string típicamente se ve así:**
```
postgresql://postgres.mdjzqxhjbisnlfpbjfgb:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

O más simple:
```
postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
```

**Ambas funcionan, pero la primera (pooler) es mejor para producción.**



