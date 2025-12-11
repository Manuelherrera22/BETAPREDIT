# 🚀 Guía de Despliegue - Monitoreo BETAPREDIT

## 📍 **DÓNDE ESTARÁ EL SISTEMA**

### **Opción 1: Local/Desarrollo (Docker Compose)**
- **Grafana:** `http://localhost:3001`
- **Prometheus:** `http://localhost:9090`
- **Alertmanager:** `http://localhost:9093`

**Ventajas:**
- ✅ Fácil de configurar
- ✅ Todo en tu máquina
- ✅ Ideal para desarrollo

---

### **Opción 2: Producción - Servicios Cloud Separados**

#### **A. Railway (Recomendado)**
1. Crear 3 servicios en Railway:
   - **Backend** (ya existe)
   - **Prometheus** (nuevo servicio)
   - **Grafana** (nuevo servicio)

2. URLs resultantes:
   - `https://betapredit-backend.railway.app`
   - `https://betapredit-prometheus.railway.app`
   - `https://betapredit-grafana.railway.app`

#### **B. Render**
Similar a Railway, crear servicios separados.

#### **C. Grafana Cloud (Más fácil)**
1. Crear cuenta en https://grafana.com
2. Conectar con Prometheus (self-hosted o cloud)
3. Dashboards automáticos

**Ventajas:**
- ✅ No necesitas mantener Grafana
- ✅ Dashboards pre-configurados
- ✅ Alertas integradas

---

### **Opción 3: VPS/Dedicated Server**

Si tienes un servidor propio:

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clonar repositorio
git clone https://github.com/tu-usuario/BETAPREDIT.git
cd BETAPREDIT

# Iniciar monitoreo
docker-compose -f docker-compose.monitoring.yml up -d
```

**URLs:**
- `http://tu-servidor:3001` (Grafana)
- `http://tu-servidor:9090` (Prometheus)

---

## 🎯 **RECOMENDACIÓN POR ESCENARIO**

### **Desarrollo:**
→ **Docker Compose local** (Opción 1)

### **Producción - Startup:**
→ **Grafana Cloud** (Opción 2C) - Más fácil, gratis hasta cierto límite

### **Producción - Escalado:**
→ **Railway/Render** (Opción 2A/2B) - Más control

### **Producción - Enterprise:**
→ **VPS propio** (Opción 3) - Máximo control

---

## 📋 **CHECKLIST DE DESPLIEGUE**

### **Para Desarrollo:**
- [ ] Docker instalado
- [ ] `docker-compose.monitoring.yml` configurado
- [ ] Backend corriendo en puerto 3000
- [ ] Acceder a http://localhost:3001

### **Para Producción (Grafana Cloud):**
- [ ] Cuenta en Grafana Cloud
- [ ] Prometheus desplegado (Railway/Render)
- [ ] Datasource configurado
- [ ] Dashboards importados

### **Para Producción (Self-Hosted):**
- [ ] Servicios creados en Railway/Render
- [ ] Variables de entorno configuradas
- [ ] URLs internas configuradas
- [ ] Contraseñas cambiadas

---

## 🔐 **SEGURIDAD**

### **Cambiar contraseñas por defecto:**
```bash
# En docker-compose.monitoring.yml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=tu_contraseña_segura
```

### **Configurar autenticación en producción:**
- Grafana: OAuth con Google/GitHub
- Prometheus: Basic Auth o reverse proxy
- Alertmanager: Similar a Prometheus

---

## 📊 **ACCESO A DASHBOARDS**

Una vez desplegado:

1. **Grafana:**
   - Ir a `http://localhost:3001` (o tu URL de producción)
   - Login: `admin` / `admin` (cambiar en producción)
   - Dashboards disponibles en el menú lateral

2. **Prometheus:**
   - Ir a `http://localhost:9090`
   - Ver métricas en tiempo real
   - Ejecutar queries PromQL

3. **Alertas:**
   - Configurar en Grafana o Alertmanager
   - Recibir notificaciones en Slack/Email

---

**¿Necesitas ayuda?** Revisa `monitoring/README.md` para más detalles.

