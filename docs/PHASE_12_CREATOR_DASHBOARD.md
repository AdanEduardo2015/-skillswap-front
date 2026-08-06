# Fase 12 - Dashboard de creador

## Objetivo

Dar a creadores y administradores una vista operativa de rendimiento usando el endpoint agregado del backend para metricas del creador autenticado.

## Alcance implementado

- Nueva ruta protegida: `/creator/dashboard`.
- Acceso limitado a `creator` y `admin`.
- Entrada de navegacion visible para creadores y administradores.
- Se oculta el acceso lateral de crear publicacion para usuarios `consumer`.
- Pantalla con:
  - resumen del creador;
  - seguidores;
  - rating del perfil;
  - totales de publicaciones, vistas, likes, comentarios, compartidos y guardados;
  - rating agregado de publicaciones;
  - top de publicaciones mas vistas;
  - top de publicaciones mejor calificadas;
  - top de publicaciones mas guardadas.
- Cliente API normaliza la respuesta `{ dashboard }` y convierte contadores numericos.

## Contrato con backend

Endpoint consumido:

- `GET /creator/dashboard`

Respuesta esperada:

```json
{
  "dashboard": {
    "creator": {
      "email": "creator@example.com",
      "username": "Creador",
      "followersCount": 7,
      "ratingAvg": 4.5,
      "ratingCount": 2
    },
    "totals": {
      "publications": 2,
      "views": 14,
      "likes": 4,
      "comments": 3,
      "shares": 1,
      "saved": 6,
      "ratingAvg": 4.33,
      "ratingCount": 3
    },
    "topPublications": {
      "byViews": [],
      "byRating": [],
      "bySaved": []
    }
  }
}
```

## Archivos principales

- `src/components/creator/CreatorDashboard.tsx`
- `src/app/router/routeConfig.ts`
- `src/app/router/AppRoutes.tsx`
- `src/app/router/routeConfig.test.ts`
- `src/components/SideNav.tsx`
- `src/components/NavBar.tsx`
- `src/services/api.ts`
- `src/services/api.test.ts`

## Verificacion esperada

- `npm run lint`: pasa.
- `npm test`: pasa.
- `npm run build`: pasa.
