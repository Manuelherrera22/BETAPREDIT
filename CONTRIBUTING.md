# Guía de Contribución - BETAPREDIT

## Estructura del Proyecto

```
BETAPREDIT/
├── backend/          # API Backend (Node.js/TypeScript)
├── frontend/         # Frontend (React/TypeScript)
├── ml-services/      # Servicios ML (Python/FastAPI)
├── shared/           # Código compartido
└── infrastructure/   # Docker, scripts
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

## Git Workflow

1. Crear branch desde `main`:
   ```bash
   git checkout -b feature/nombre-feature
   ```

2. Hacer commits descriptivos:
   ```bash
   git commit -m "feat: agregar funcionalidad X"
   ```

3. Push y crear Pull Request

## Convenciones de Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato, no afecta código
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

## Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Pull Requests

1. Descripción clara del cambio
2. Referencias a issues relacionados
3. Screenshots si aplica
4. Tests pasando
5. Sin errores de linting

## Preguntas

Para preguntas, crear un issue con la etiqueta `question`.

