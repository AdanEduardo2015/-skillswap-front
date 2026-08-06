# Fase 8 - Busqueda avanzada

## Objetivo

Conectar la pantalla `/search` con los filtros documentados por el backend, sin mezclar esta fase con administracion, reportes ni cambios del feed principal.

## Alcance implementado

- Busqueda por texto (`q`).
- Filtro por categoria (`categoryId`) usando `/categories` con fallback local.
- Filtro por formato (`article`, `image`, `video`, `mixed`).
- Filtro por etiquetas, normalizadas y separadas por coma.
- Filtro por creador (`creatorEmail` y compatibilidad con `email`).
- Ordenamiento por:
  - recientes;
  - mas vistas;
  - mejor calificadas;
  - mas guardadas.
- Paginacion de resultados con `nextToken` e infinite scroll.
- Chips de filtros activos para que el usuario vea el criterio aplicado.
- Validacion de formulario vacio: no se llama al backend sin texto ni filtros reales.

## Contrato con backend

La pantalla usa `api.search.list(filters, limit, nextToken)` y envia parametros limpios:

```json
{
  "q": "typescript",
  "categoryId": "programacion",
  "tags": "react,aws",
  "format": "article",
  "creatorEmail": "creator@example.com",
  "sort": "topRated",
  "limit": 20
}
```

`api.search.list` conserva compatibilidad con busqueda simple por string, pero la pantalla ya usa `PublicationFilters`.

## Archivos principales

- `src/components/Search.tsx`
- `src/features/search/searchFilters.ts`
- `src/features/search/searchFilters.test.ts`
- `src/services/api.ts`
- `src/services/api.test.ts`

## Verificacion

- `npm test`: pasa, 5 archivos y 25 pruebas.
- `npm run build`: pasa.
- `npm run lint`: falla por deuda legacy existente fuera del alcance directo de esta fase; no reporta errores en los archivos nuevos o modificados para fase 8.
