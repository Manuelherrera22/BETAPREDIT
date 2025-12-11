# 📊 Monitoreo BETAPREDIT - Guía de Instalación

Este directorio contiene la configuración completa de monitoreo con **Prometheus**, **Grafana** y **Alertmanager**.

---

## 🏗️ **ARQUITECTURA**

```
┌─────────────────┐
│  Backend API    │
│  (Puerto 3000)  │
│  /metrics       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Prometheus    │
│   (Puerto 9090) │
│  Recopila métricas
└────────┬────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│    Grafana      │  │ Alertmanager │
│  (Puerto 3001)  │  │ (Puerto 9093)│
│  Visualización  │  │   Alertas    │
└─────────────────┘  └──────────────┘
```

---

## 🚀 **INSTALACIÓN RÁPIDA**

### **Opción 1: Docker Compose (Recomendado para desarrollo/local)**

```bash
# 1. Configurar contraseña de Grafana (opcional)
export GRAFANA_ADMIN_PASSWORD=tu_contraseña_segura

# 2. Iniciar servicios
docker-compose -f docker-compose.monitoring.yml up -d

# 3. Verificar que todo esté corriendo
docker-compose -f docker-compose.monitoring.yml ps
```

**Acceso:**
- **Grafana:** http://localhost:3001 (admin/admin por defecto)
- **Prometheus:** http://localhost:9090
- **Alertmanager:** http://localhost:9093

---

### **Opción 2: Servicios Cloud (Producción)**

#### **Railway / Render / Heroku:**

1. **Prometheus:**
   - Desplegar como servicio separado
   - Configurar `prometheus.yml` para apuntar a tu backend
   - URL: `https://prometheus.tu-dominio.com`

2. **Grafana Cloud (Gratis hasta cierto límite):**
   - Crear cuenta en https://grafana.com
   - Conectar con tu Prometheus
   - Dashboards se sincronizan automáticamente

3. **Grafana Self-Hosted:**
   - Desplegar en Railway/Render
   - Configurar datasource para apuntar a Prometheus
   - Importar dashboards desde `monitoring/grafana/dashboards/`

---

## 📋 **CONFIGURACIÓN**

### **1. Prometheus - Conectar con Backend**

Editar `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'betapredit-backend'
    static_configs:
      - targets: 
          # Para desarrollo local:
          - 'host.docker.internal:3000'  # Windows/Mac
          # - 'localhost:3000'            # Linux
          
          # Para producción:
          - 'api.betapredit.com:3000'
          # O la URL de tu backend
```

### **2. Grafana - Datasource**

El datasource se configura automáticamente con `monitoring/grafana/provisioning/datasources/prometheus.yml`.

Para producción, editar la URL:
```yaml
url: http://prometheus:9090  # Para Docker
# O
url: https://prometheus.tu-dominio.com  # Para producción
```

### **3. Alertas - Configurar Notificaciones**

Editar `monitoring/alertmanager/config.yml`:

```yaml
receivers:
  - name: 'critical-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'
        channel: '#alerts'
    
    # O email:
    email_configs:
      - to: 'alerts@betapredit.com'
        from: 'alerts@betapredit.com'
        smarthost: 'smtp.gmail.com:587'
```

---

## 📊 **DASHBOARDS INCLUIDOS**

### **1. Sistema Dashboard**
- Requests HTTP por segundo
- Tiempo de respuesta (p95)
- Tasa de errores
- Queries de base de datos
- Duración de queries
- Uptime del sistema
- Estado de salud

### **2. Negocio Dashboard**
- Predicciones generadas
- Value bets detectados
- Apuestas realizadas
- Usuarios activos
- Precisión de predicciones
- APIs externas
- Cache hit rate

---

## 🔧 **COMANDOS ÚTILES**

```bash
# Iniciar servicios
docker-compose -f docker-compose.monitoring.yml up -d

# Ver logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Detener servicios
docker-compose -f docker-compose.monitoring.yml down

# Reiniciar un servicio
docker-compose -f docker-compose.monitoring.yml restart grafana

# Ver estado
docker-compose -f docker-compose.monitoring.yml ps
```

---

## 🌐 **DESPLIEGUE EN PRODUCCIÓN**

### **Railway:**

1. Crear 3 servicios:
   - Backend (ya existe)
   - Prometheus (nuevo)
   - Grafana (nuevo)

2. Configurar variables de entorno:
   - `GRAFANA_ADMIN_PASSWORD`
   - URLs de servicios

3. Conectar Prometheus con Backend:
   - URL interna de Railway para el backend

### **Render:**

Similar a Railway, crear servicios separados y configurar URLs internas.

---

## 📝 **NOTAS**

- **Desarrollo:** Usa Docker Compose local
- **Producción:** Usa servicios cloud separados o Grafana Cloud
- **Seguridad:** Cambia contraseñas por defecto
- **Backup:** Los dashboards se guardan en `monitoring/grafana/dashboards/`

---

## 🆘 **TROUBLESHOOTING**

### **Prometheus no puede conectar con backend:**
- Verificar que el backend esté corriendo
- Verificar que `/metrics` esté accesible
- En Docker, usar `host.docker.internal` en Windows/Mac

### **Grafana no muestra datos:**
- Verificar que Prometheus esté corriendo
- Verificar datasource en Grafana (Settings > Data Sources)
- Verificar que Prometheus tenga datos (http://localhost:9090/graph)

### **Alertas no funcionan:**
- Verificar que Alertmanager esté corriendo
- Verificar configuración en `alertmanager/config.yml`
- Verificar reglas en `prometheus/alerts.yml`

---

**Última actualización:** Enero 2025

