# 👥 Guía de Contribución - BETAPREDIT

**Última actualización:** Enero 2025

¡Gracias por tu interés en contribuir a BETAPREDIT! 🎉

## 📁 Estructura del Proyecto

```
BETAPREDIT/
├── backend/              # API Backend (Node.js/TypeScript)
│   ├── src/
│   │   ├── api/          # Controllers y Routes
│   │   ├── services/     # Lógica de negocio
│   │   ├── middleware/   # Auth, validación, etc.
│   │   ├── config/       # Configuración
│   │   └── tests/        # Tests
│   └── prisma/           # Schema y migraciones
├── frontend/             # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/   # Componentes UI
│   │   ├── pages/        # Páginas
│   │   ├── services/     # Clientes API
│   │   └── hooks/        # React hooks
├── ml-services/          # Servicios ML (Python/FastAPI)
├── supabase/             # Edge Functions
│   └── functions/        # Funciones serverless
└── .github/              # CI/CD workflows
```

## Estándares de Código

### Backend (TypeScript)
- Usar TypeScript estricto
- Seguir convenciones de nombres:
  - Clases: PascalCase
  - Funciones/variables: camelCase
  - Constantes: UPPER_SNAKE_CASE
- Documentar funciones complejas
- Usar async/await, no callbacks

### Frontend (React/TypeScript)
- Componentes funcionales con hooks
- TypeScript para todos los componentes
- Separar lógica de presentación
- Usar React Query para data fetching

### ML Services (Python)
- Seguir PEP 8
- Type hints en todas las funciones
- Docstrings para clases y funciones
- Separar lógica de ML de API

## 🔀 Git Workflow

### Branches

- `main` / `master` - Producción (protegido)
- `develop` - Desarrollo (auto-deploy a staging)
- `feature/*` - Nuevas funcionalidades
- `fix/*` - Correcciones de bugs
- `docs/*` - Documentación

### Proceso

1. **Crear branch desde `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nombre-feature
   ```

2. **Hacer commits descriptivos:**
   ```bash
   git commit -m "feat: agregar funcionalidad X"
   ```

3. **Push y crear Pull Request:**
   ```bash
   git push origin feature/nombre-feature
   ```
   - Crear PR a `develop` (no a `main`)
   - El CI se ejecutará automáticamente
   - Esperar aprobación antes de merge

4. **Después del merge:**
   - El código se despliega automáticamente a staging
   - Para producción, crear PR de `develop` → `main`

## Convenciones de Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato, no afecta código
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

## 🧪 Testing

### Backend
```bash
cd backend
npm test              # Ejecutar tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

**Cobertura mínima requerida:** 50% (objetivo: 60%+)

### Frontend
```bash
cd frontend
npm test              # Ejecutar tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

**Cobertura mínima requerida:** 40% (objetivo: 60%+)

### Antes de crear PR

- ✅ Todos los tests pasan
- ✅ Linting sin errores (`npm run lint`)
- ✅ Build exitoso (`npm run build`)
- ✅ Cobertura mínima alcanzada

## 📝 Pull Requests

### Checklist antes de crear PR

- [ ] Código sigue los estándares del proyecto
- [ ] Tests agregados/actualizados
- [ ] Todos los tests pasan
- [ ] Linting sin errores
- [ ] Build exitoso
- [ ] Documentación actualizada (si aplica)
- [ ] Swagger actualizado (si agregas endpoints)
- [ ] Commits descriptivos

### Template de PR

```markdown
## Descripción
Breve descripción del cambio

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Tests agregados
- [ ] Documentación actualizada
- [ ] Sin errores de linting
```

## 🐛 Reportar Bugs

1. Crear issue con etiqueta `bug`
2. Incluir:
   - Descripción del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Versión del sistema

## 💡 Sugerir Features

1. Crear issue con etiqueta `enhancement`
2. Incluir:
   - Descripción de la feature
   - Casos de uso
   - Beneficios esperados

## ❓ Preguntas

Para preguntas, crear un issue con la etiqueta `question`.

## 📚 Recursos

- [Análisis Completo del Sistema](./ANALISIS_COMPLETO_ESTADO_SISTEMA.md)
- [Guía de Inicio Rápido](./GUIA_INICIO_RAPIDO_ACTUALIZADA.md)
- [Documentación CI/CD](./.github/workflows/README.md)
- [Swagger API Docs](http://localhost:3000/api-docs) (cuando backend esté corriendo)

---

**¡Gracias por contribuir!** 🎉

