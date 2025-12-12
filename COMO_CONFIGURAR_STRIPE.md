# 💳 Cómo Configurar Stripe para Pagos

## 📋 Paso 1: Crear Cuenta en Stripe

1. Ve a: https://stripe.com/
2. Crea una cuenta (gratis)
3. Completa la verificación de identidad
4. Accede a tu Dashboard: https://dashboard.stripe.com/

---

## 📝 Paso 2: Crear Productos y Precios

### En el Dashboard de Stripe:

1. Ve a **Products** → **Add Product**
2. Crea 3 productos (uno por cada plan):

#### Producto 1: Plan Básico (FREE)
- **Name**: BETAPREDIT - Plan Básico
- **Description**: Plan gratuito con funcionalidades básicas
- **Pricing**: No crear precio (es gratis)

#### Producto 2: Plan Pro (€29/mes)
- **Name**: BETAPREDIT - Plan Pro
- **Description**: Para apostadores serios
- **Pricing**: 
  - **Recurring**: Monthly
  - **Price**: €29.00
  - **Currency**: EUR
- **Copy el Price ID** (empieza con `price_...`)

#### Producto 3: Plan Premium (€79/mes)
- **Name**: BETAPREDIT - Plan Premium
- **Description**: Para profesionales
- **Pricing**:
  - **Recurring**: Monthly
  - **Price**: €79.00
  - **Currency**: EUR
- **Copy el Price ID** (empieza con `price_...`)

---

## 🔑 Paso 3: Obtener API Keys

1. En el Dashboard, ve a **Developers** → **API keys**
2. **Test mode** (para desarrollo):
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`
3. **Live mode** (para producción):
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

---

## 🔗 Paso 4: Configurar Webhook

1. En el Dashboard, ve a **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://tu-dominio.com/api/payments/webhook`
   - Para desarrollo local: usa Stripe CLI (ver abajo)
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy el Webhook Signing Secret** (empieza con `whsec_...`)

---

## 📝 Paso 5: Configurar Variables de Entorno

Agrega al archivo `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...tu_secret_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_...tu_webhook_secret_aqui

# Stripe Price IDs (los obtienes del dashboard)
STRIPE_PRICE_ID_BASIC=price_... (opcional, si tienes plan básico de pago)
STRIPE_PRICE_ID_PRO=price_...tu_price_id_pro
STRIPE_PRICE_ID_PREMIUM=price_...tu_price_id_premium
```

Agrega al archivo `frontend/.env`:

```env
# Stripe Configuration (opcional para frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...tu_publishable_key_aqui
VITE_STRIPE_PRICE_ID_PRO=price_...tu_price_id_pro
VITE_STRIPE_PRICE_ID_PREMIUM=price_...tu_price_id_premium
```

---

## 🧪 Paso 6: Testing Local con Stripe CLI

Para probar webhooks localmente:

1. **Instala Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login**:
   ```bash
   stripe login
   ```
3. **Forward webhooks**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
4. **Obtén el webhook secret**:
   ```bash
   stripe listen --print-secret
   ```
5. **Usa ese secret en tu `.env`** para desarrollo local

---

## ✅ Paso 7: Probar el Flujo Completo

1. **Inicia el backend**
2. **Inicia el frontend**
3. **Login o registra un usuario**
4. **Ve a `/pricing`**
5. **Click en "Comenzar Prueba" en el plan Pro**
6. **Deberías ser redirigido a Stripe Checkout**
7. **Usa tarjeta de prueba**: `4242 4242 4242 4242`
8. **Completa el pago**
9. **Verifica que el webhook actualiza la suscripción**

---

## 🧪 Tarjetas de Prueba

Stripe proporciona tarjetas de prueba:

- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Rechazada**: `4000 0000 0000 0002`

**Fecha**: Cualquier fecha futura  
**CVC**: Cualquier 3 dígitos  
**ZIP**: Cualquier código postal

---

## 📊 Verificar que Funciona

1. **Dashboard de Stripe**: Deberías ver el pago en **Payments**
2. **Base de datos**: Verifica que `Subscription` y `Payment` se crearon
3. **Usuario**: Verifica que `subscriptionTier` se actualizó a `PRO` o `PREMIUM`

---

## 🚀 Producción

Cuando estés listo para producción:

1. **Cambia a Live mode** en Stripe Dashboard
2. **Actualiza las API keys** en `.env` (usa `sk_live_...` y `pk_live_...`)
3. **Configura el webhook** con tu URL de producción
4. **Actualiza los Price IDs** si son diferentes en producción

---

## ⚠️ Notas Importantes

- **Nunca commitees** las API keys secretas
- **Usa variables de entorno** siempre
- **Test mode** no procesa pagos reales
- **Webhooks** son críticos para actualizar suscripciones automáticamente

---

## 🆘 Problemas Comunes

### "Payment service not configured"
- Verifica que `STRIPE_SECRET_KEY` esté en `.env`
- Reinicia el backend después de agregar la key

### "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- Asegúrate de usar el secret del webhook correcto (test vs live)

### "Price ID not found"
- Verifica que los Price IDs en `.env` sean correctos
- Asegúrate de haber copiado los IDs completos desde Stripe Dashboard

---

## 📚 Documentación

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Stripe Subscriptions**: https://stripe.com/docs/billing/subscriptions/overview
- **Stripe Webhooks**: https://stripe.com/docs/webhooks




