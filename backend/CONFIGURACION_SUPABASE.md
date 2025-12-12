# 🗄️ Configuración de Supabase

## 📋 Información del Proyecto

**Project ID:** `mdjzqxhjbisnlfpbjfgb`

---

## 🔑 Configuración de DATABASE_URL

En tu archivo `backend/.env`, agrega la URL de conexión de Supabase:

```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### Cómo obtener la contraseña:

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb
2. Ve a **Settings** → **Database**
3. Busca la sección **Connection string**
4. Copia la contraseña o genera una nueva si es necesario
5. Reemplaza `[YOUR-PASSWORD]` en la URL con tu contraseña real

### Formato de la URL:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
```

Para tu proyecto:
```
postgresql://postgres:[PASSWORD]@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres
```

---

## 🚀 Pasos para Configurar

### 1. Verificar que DATABASE_URL esté en .env

```env
DATABASE_URL="postgresql://postgres:tu_password@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"
```

### 2. Generar Prisma Client

```bash
cd backend
npx prisma generate
```

### 3. Ejecutar Migraciones

```bash
# Crear migración inicial
npx prisma migrate dev --name init

# O si ya tienes migraciones:
npx prisma migrate deploy
```

### 4. Verificar Conexión

```bash
# Probar conexión
npx prisma db pull

# Ver datos
npx prisma studio
```

---

## 🔍 Verificar que Funciona

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Revisa los logs:**
   - Deberías ver: `✅ Connected to Supabase database successfully`
   - Si ves: `⚠️ Database connection failed`, verifica la URL y contraseña

3. **Prueba un endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```
   Debería mostrar: `"database": "connected"`

---

## 🛠️ Troubleshooting

### Error: "Can't reach database server"

- Verifica que la URL esté correcta
- Verifica que la contraseña sea correcta
- Verifica que el proyecto de Supabase esté activo

### Error: "relation does not exist"

- Ejecuta las migraciones: `npx prisma migrate dev`
- O sincroniza el schema: `npx prisma db push`

### Error: "Connection pool timeout"

- Agrega `?pgbouncer=true&connection_limit=1` a la URL
- O usa la connection pooler de Supabase

---

## 📊 Supabase Dashboard

Accede a tu dashboard:
https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb

Desde ahí puedes:
- Ver las tablas creadas
- Ejecutar queries SQL
- Ver logs de conexión
- Gestionar usuarios y permisos

---

## 🔐 Seguridad

- **Nunca commitees** el `.env` con la contraseña
- Usa variables de entorno en producción
- Considera usar connection pooling para mejor performance
- Habilita Row Level Security (RLS) en Supabase si es necesario

---

## 📝 Notas Importantes

1. **Connection Pooling:** Supabase recomienda usar su connection pooler para mejor performance
2. **SSL:** La conexión a Supabase requiere SSL (automático en Prisma)
3. **Límites:** El plan gratuito tiene límites de conexiones y storage
4. **Backups:** Supabase hace backups automáticos, pero puedes crear backups manuales desde el dashboard

---

## ✅ Checklist

- [ ] DATABASE_URL configurado en `.env`
- [ ] Contraseña correcta en la URL
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma migrate dev` ejecutado
- [ ] Backend inicia sin errores
- [ ] Health check muestra "database": "connected"
- [ ] Puedes crear usuarios y hacer login

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica los logs del backend
2. Revisa el dashboard de Supabase
3. Verifica que las migraciones se ejecutaron correctamente
4. Prueba la conexión con `npx prisma studio`





