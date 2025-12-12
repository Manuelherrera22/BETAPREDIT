# 🔧 Configuración de Integraciones

## 📋 Variables de Entorno Necesarias

Agrega estas variables a tu archivo `backend/.env`:

### 1. API-Football
```env
# API-Football (https://www.api-football.com)
API_FOOTBALL_KEY=tu_api_key_aqui
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_TIMEOUT=10000
```

**Cómo obtener la API key:**
1. Ve a https://www.api-football.com
2. Crea una cuenta
3. Ve a "Dashboard" > "API Key"
4. Copia tu API key
5. Plan gratuito: 100 requests/día

---

### 2. Email Service

#### Opción A: SendGrid (Recomendado)
```env
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@betapredit.com
EMAIL_FROM_NAME=BETAPREDIT
```

**Cómo obtener SendGrid API key:**
1. Ve a https://sendgrid.com
2. Crea cuenta gratuita (100 emails/día)
3. Ve a Settings > API Keys
4. Crea nueva API key con permisos "Mail Send"
5. Copia la API key

#### Opción B: Resend
```env
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@betapredit.com
EMAIL_FROM_NAME=BETAPREDIT
```

**Cómo obtener Resend API key:**
1. Ve a https://resend.com
2. Crea cuenta gratuita (100 emails/día)
3. Ve a API Keys
4. Crea nueva API key
5. Copia la API key

#### Opción C: Nodemailer (SMTP)
```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
EMAIL_FROM=tu_email@gmail.com
EMAIL_FROM_NAME=BETAPREDIT
```

**Para Gmail:**
1. Habilita "2-Step Verification"
2. Ve a "App Passwords"
3. Genera una contraseña de aplicación
4. Usa esa contraseña en `SMTP_PASSWORD`

---

### 3. The Odds API (Ya configurado)
```env
THE_ODDS_API_KEY=tu_api_key_aqui
```

---

### 4. Kalshi (Ya configurado)
```env
KALSHI_API_KEY=tu_api_key
KALSHI_API_SECRET=tu_private_key
```

---

## 📦 Instalación de Dependencias

### Para SendGrid:
```bash
cd backend
npm install @sendgrid/mail
```

### Para Resend:
```bash
cd backend
npm install resend
```

### Para Nodemailer (ya debería estar):
```bash
cd backend
npm install nodemailer
```

---

## 🧪 Probar las Integraciones

### Probar API-Football:
```bash
# Desde el backend
curl http://localhost:3000/api/api-football/fixtures?league=39&season=2024
```

### Probar Email:
Las notificaciones se enviarán automáticamente cuando:
- Se detecte un value bet
- Se cree una notificación importante
- Se envíe un resumen diario

### Probar WebSockets:
Conecta desde el frontend usando Socket.IO client.

---

## 📝 Notas Importantes

1. **API-Football**: 
   - Plan gratuito: 100 requests/día
   - Usa caché Redis para minimizar requests
   - Sports se cachean por 1 hora
   - Fixtures se cachean por 1 hora

2. **Email**:
   - SendGrid/Resend: 100 emails/día (gratis)
   - Los emails se envían automáticamente para value bets
   - Templates HTML incluidos

3. **WebSockets**:
   - Ya está configurado en el backend
   - Solo falta conectar desde el frontend
   - Canales disponibles: odds, value-bets, notifications, events, sport

---

## 🚀 Próximos Pasos

1. Agregar las API keys al `.env`
2. Instalar dependencias de email (si usas SendGrid/Resend)
3. Reiniciar el backend
4. Actualizar frontend para usar WebSockets
5. Probar las integraciones




