# 🧪 PRUEBA EN RUNTIME - BETAPREDIT

**Fecha:** Diciembre 2024  
**Estado:** ✅ Servidores Iniciados

---

## 🚀 **SERVIDORES INICIADOS**

### **Backend:**
- ✅ **URL:** http://localhost:3000
- ✅ **API:** http://localhost:3000/api
- ✅ **Estado:** Corriendo en segundo plano

### **Frontend:**
- ✅ **URL:** http://localhost:5173
- ✅ **Estado:** Corriendo en segundo plano

---

## 🧪 **TESTS A REALIZAR**

### **Test 1: Verificar Backend**
1. Abrir navegador en http://localhost:3000
2. Debería mostrar respuesta del servidor o error 404 (normal si no hay ruta raíz)
3. Probar health check si existe: http://localhost:3000/api/health

### **Test 2: Verificar Frontend**
1. Abrir navegador en http://localhost:5173
2. Debería cargar la landing page
3. Verificar que no hay errores en la consola del navegador

### **Test 3: Probar Autenticación**
1. Ir a http://localhost:5173/login
2. Iniciar sesión con credenciales válidas
3. Verificar que redirige al dashboard

### **Test 4: Probar ROI Dashboard**
1. Después de iniciar sesión, ir a `/statistics`
2. Verificar que aparece el componente `ROITrackingDashboard`
3. Si no hay datos, debería mostrar "No hay datos de ROI disponibles todavía"
4. Verificar que no hay errores en la consola

### **Test 5: Probar MyBets**
1. Ir a `/my-bets`
2. Verificar que carga la página
3. Si no hay apuestas, debería mostrar mensaje "No tienes apuestas registradas aún"
4. Verificar que los botones de resolver apuestas funcionan (si hay apuestas pendientes)

### **Test 6: Probar Registrar Apuesta**
1. En `/my-bets`, buscar botón para registrar apuesta
2. Llenar formulario con datos de prueba
3. Enviar y verificar que se crea correctamente
4. Verificar que aparece en la lista

### **Test 7: Probar Resolver Apuesta**
1. En `/my-bets`, encontrar una apuesta con status PENDING
2. Click en "Marcar como Ganada"
3. Verificar que aparece spinner de carga
4. Verificar que la apuesta se actualiza a WON
5. Verificar que el ROI se actualiza automáticamente

### **Test 8: Verificar ROI Actualizado**
1. Después de resolver una apuesta, ir a `/statistics`
2. Verificar que el ROI Dashboard muestra datos actualizados
3. Verificar que los números coinciden con las apuestas resueltas

---

## 🔍 **VERIFICACIONES DE CONSOLA**

### **Backend (Terminal):**
- ✅ No debería haber errores de compilación
- ✅ Debería mostrar "Server running on port 3000"
- ✅ No debería haber errores de conexión a base de datos

### **Frontend (Navegador Console):**
- ✅ No debería haber errores de React
- ✅ No debería haber errores de red (404, 500)
- ✅ Las queries de React Query deberían ejecutarse correctamente

---

## 📊 **RESULTADOS ESPERADOS**

### **Si Todo Funciona Correctamente:**
- ✅ Backend responde en http://localhost:3000
- ✅ Frontend carga en http://localhost:5173
- ✅ Login funciona correctamente
- ✅ Dashboard de ROI se muestra en `/statistics`
- ✅ MyBets se muestra en `/my-bets`
- ✅ Registrar apuesta funciona
- ✅ Resolver apuesta funciona
- ✅ ROI se actualiza automáticamente
- ✅ No hay errores en consola

### **Si Hay Problemas:**
- ⚠️ Verificar que el backend esté corriendo
- ⚠️ Verificar que el frontend esté corriendo
- ⚠️ Verificar que la base de datos esté conectada
- ⚠️ Verificar que las variables de entorno estén configuradas
- ⚠️ Revisar errores en la consola del navegador
- ⚠️ Revisar logs del backend

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Problema: Backend no inicia**
**Solución:**
```bash
cd backend
npm install
npm run dev
```

### **Problema: Frontend no inicia**
**Solución:**
```bash
cd frontend
npm install
npm run dev
```

### **Problema: Error de conexión a base de datos**
**Solución:**
- Verificar que `DATABASE_URL` esté en `backend/.env`
- Verificar que Supabase esté accesible

### **Problema: Error 401 en endpoints**
**Solución:**
- Verificar que el usuario esté autenticado
- Verificar que el token JWT sea válido
- Verificar que `JWT_SECRET` esté en `backend/.env`

### **Problema: Dashboard no muestra datos**
**Solución:**
- Verificar que haya apuestas registradas
- Verificar que las apuestas estén resueltas (WON/LOST/VOID)
- Verificar que el endpoint `/api/roi-tracking` responda correctamente

---

## ✅ **CHECKLIST DE PRUEBA**

- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] Login funciona
- [ ] Dashboard de ROI se muestra
- [ ] MyBets se muestra
- [ ] Registrar apuesta funciona
- [ ] Resolver apuesta funciona
- [ ] ROI se actualiza automáticamente
- [ ] No hay errores en consola
- [ ] Animaciones funcionan
- [ ] Estados de carga funcionan

---

## 🎯 **PRÓXIMOS PASOS**

Después de verificar que todo funciona:

1. **Probar con datos reales:**
   - Registrar varias apuestas
   - Resolver algunas como ganadas y otras como perdidas
   - Verificar que el ROI se calcula correctamente

2. **Probar Value Bets:**
   - Vincular una apuesta con un value bet alert
   - Resolver la apuesta
   - Verificar que aparece en las métricas de value bets

3. **Probar diferentes períodos:**
   - Cambiar período en el dashboard (week, month, year, all_time)
   - Verificar que los datos se actualizan correctamente

---

## 📝 **NOTAS**

- Los servidores están corriendo en segundo plano
- Para detenerlos, usa Ctrl+C o cierra la terminal
- Los cambios en el código se reflejarán automáticamente (hot reload)
- Si hay errores, revisar los logs en la terminal

---

**¡TODO LISTO PARA PROBAR! 🚀**

