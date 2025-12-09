# 🧪 Test Rápido de Verificación - BETAPREDIT

## ⚡ Verificación Rápida (5 minutos)

### **1. Verificar Backend (2 min)**

```bash
# En el directorio backend
cd backend

# Verificar que las rutas estén registradas
grep -r "external-bets" src/api/routes/
# Debe mostrar: external-bets.routes.ts

# Verificar que el servicio existe
ls src/services/external-bets.service.ts
# Debe existir el archivo

# Verificar que el controlador existe
ls src/api/controllers/external-bets.controller.ts
# Debe existir el archivo
```

**✅ Resultado Esperado:** Todos los archivos existen

---

### **2. Verificar Frontend (2 min)**

```bash
# En el directorio frontend
cd frontend

# Verificar componente
ls src/components/RegisterBetForm.tsx
# Debe existir

# Verificar servicio
ls src/services/externalBetsService.ts
# Debe existir

# Verificar que MyBets usa el componente
grep -r "RegisterBetForm" src/pages/MyBets.tsx
# Debe encontrar la importación
```

**✅ Resultado Esperado:** Todos los archivos existen y están conectados

---

### **3. Verificar Integración (1 min)**

```bash
# Verificar que QuickAddBet navega correctamente
grep -r "my-bets?action=add" frontend/src/components/QuickAddBet.tsx
# Debe encontrar la navegación

# Verificar que MyBets detecta el query param
grep -r "useSearchParams" frontend/src/pages/MyBets.tsx
# Debe encontrar el hook
```

**✅ Resultado Esperado:** Integración correcta

---

## 🔍 Verificación Manual (10 minutos)

### **Test 1: Abrir Formulario**

1. Iniciar aplicación (frontend y backend)
2. Iniciar sesión
3. Ir a "Mis Apuestas"
4. Hacer clic en "Registrar Apuesta"

**✅ Esperado:** Modal se abre correctamente

---

### **Test 2: Validación**

1. En el formulario, intentar enviar sin completar campos
2. Verificar mensajes de error

**✅ Esperado:** Muestra errores apropiados

---

### **Test 3: Cálculo**

1. Ingresar cuota: 2.50
2. Ingresar stake: 10.00
3. Verificar cálculo

**✅ Esperado:** Muestra "Ganancia Potencial: €15.00"

---

### **Test 4: Registro**

1. Completar todos los campos obligatorios
2. Hacer clic en "Registrar Apuesta"

**✅ Esperado:** 
- Modal se cierra
- Toast de éxito
- Apuesta aparece en lista

---

### **Test 5: QuickAddBet**

1. Hacer clic en botón flotante (esquina inferior derecha)
2. Seleccionar "Agregar Apuesta"

**✅ Esperado:** 
- Navega a MyBets
- Formulario se abre automáticamente

---

## 🐛 Problemas Comunes y Soluciones

### **Problema 1: "Cannot find module"**
**Solución:** 
```bash
cd frontend && npm install
cd ../backend && npm install
```

### **Problema 2: "401 Unauthorized"**
**Solución:** 
- Verificar que estás logueado
- Verificar token en localStorage
- Verificar que backend está corriendo

### **Problema 3: "404 Not Found"**
**Solución:**
- Verificar que backend está en puerto 3000
- Verificar que ruta `/api/external-bets` existe
- Verificar variables de entorno

### **Problema 4: "Modal no se abre"**
**Solución:**
- Verificar que `isRegisterFormOpen` se actualiza
- Verificar z-index del modal
- Verificar que no hay errores en consola

---

## ✅ Checklist Rápido

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173 (o configurado)
- [ ] Usuario logueado
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del backend
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas

---

## 📊 Resultado Esperado

Si todos los tests pasan:
- ✅ **Sistema funcionando correctamente**
- ✅ **Listo para uso**

Si algún test falla:
- ⚠️ **Revisar sección "Problemas Comunes"**
- ⚠️ **Verificar logs de error**

---

**Tiempo Total:** ~15 minutos

