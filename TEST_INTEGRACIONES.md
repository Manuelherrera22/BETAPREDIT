# 🧪 Test de Integraciones - Guía Completa

## ✅ Implementación Completada

### Backend
1. ✅ **API-Football Service** - `backend/src/services/integrations/api-football.service.ts`
2. ✅ **WebSocket Service** - `backend/src/services/websocket.service.ts`
3. ✅ **Email Service** - `backend/src/services/email.service.ts`
4. ✅ **Controllers y Routes** - Todos creados e integrados

### Frontend
1. ✅ **useWebSocket Hook** - `frontend/src/hooks/useWebSocket.ts`
2. ✅ **OddsComparison** - Actualizado con WebSockets
3. ✅ **Alerts** - Actualizado con WebSockets
4. ✅ **socket.io-client** - Instalado

---

## 🧪 Cómo Ejecutar el Test

### Opción 1: Test Automático (Recomendado)
```bash
# Asegúrate de que el backend esté corriendo
cd backend
npm run dev

# En otra terminal
node backend/scripts/test-complete-integrations.js
```

### Opción 2: Test Manual

#### 1. Verificar Backend Health
```bash
curl http://localhost:3000/api/health
```

#### 2. Verificar The Odds API
```bash
curl http://localhost:3000/api/the-odds-api/sports
```

#### 3. Verificar API-Football (requiere autenticación)
```bash
# Primero login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@betapredit.com","password":"demo123"}'

# Luego usar el token
curl http://localhost:3000/api/api-football/fixtures?league=39&season=2024 \
  -H "Authorization: Bearer TU_TOKEN"
```

#### 4. Verificar WebSockets
Abre la consola del navegador en el frontend y verifica:
- Conexión establecida
- Mensajes recibidos

---

## 📋 Checklist de Verificación

### Backend
- [ ] Backend inicia sin errores
- [ ] API-Football service se inicializa (o muestra warning si no hay key)
- [ ] WebSocket service se inicializa
- [ ] Email service se inicializa (o muestra warning si no hay key)
- [ ] Endpoint `/api/health` responde
- [ ] Endpoint `/api/the-odds-api/sports` responde
- [ ] Endpoint `/api/api-football/*` está disponible

### Frontend
- [ ] Frontend compila sin errores
- [ ] WebSocket se conecta automáticamente
- [ ] Indicador de conexión muestra "Conectado en tiempo real"
- [ ] Alertas se actualizan en tiempo real
- [ ] Cuotas se actualizan en tiempo real

---

## 🔧 Solución de Problemas

### Backend no inicia
1. Verifica errores en la consola
2. Verifica que todas las dependencias estén instaladas
3. Verifica que el puerto 3000 no esté ocupado
4. Revisa los logs del backend

### WebSocket no conecta
1. Verifica que el backend esté corriendo
2. Verifica CORS en `backend/src/index.ts`
3. Verifica que `FRONTEND_URL` esté configurado
4. Revisa la consola del navegador

### API-Football no funciona
1. Verifica que `API_FOOTBALL_KEY` esté en `.env`
2. Verifica que la key sea válida
3. Verifica que tengas requests disponibles (100/día gratis)

### Email no funciona
1. Verifica que `EMAIL_PROVIDER` esté configurado
2. Verifica que `EMAIL_API_KEY` esté configurado
3. Instala dependencias: `npm install @sendgrid/mail` o `npm install resend`

---

## 📊 Resultados Esperados del Test

```
✅ Backend Health: PASÓ
✅ The Odds API: PASÓ
✅ API-Football: PASÓ (si está configurado)
✅ WebSockets: PASÓ
✅ Email Service: PASÓ (si está configurado)
```

---

## 💡 Próximos Pasos

1. **Configurar API Keys** en `.env`
2. **Instalar dependencias de email** si usas SendGrid/Resend
3. **Reiniciar backend** para cargar variables
4. **Abrir frontend** y verificar conexión WebSocket
5. **Probar funcionalidades** en tiempo real



