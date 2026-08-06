# Fase 2: Contratos de Dominio, Roles y Cliente API

Fecha de corte: 2026-06-27.

## Objetivo

Alinear la capa de tipos y servicios del frontend con `skillswap-back/Docs/API.md`, manteniendo compatibilidad temporal con el modelo legacy que ya usan las pantallas actuales.

## Cambios implementados

### Tipos de dominio

Se amplio `src/types/index.ts` con contratos para:

- Roles oficiales: `admin`, `creator`, `consumer`, `guest`, `banned`.
- Publicaciones educativas: `title`, `categoryId`, `format`, `tags`, `status`, `savedCount`, `viewsCount`, `ratingAvg`, `ratingCount`, `isSaved`.
- Categorias.
- Follows.
- Guardados.
- Ratings.
- Reports.
- Notificaciones con `targetType` y `targetId`.
- Dashboard de creador.
- Payloads de usuario y publicacion.

### Normalizacion legacy

Se agrego `normalizeRole` en `src/services/api.ts`:

| Entrada legacy/API          | Rol normalizado |
| --------------------------- | --------------- |
| `user`, `users`             | `consumer`      |
| `moderator`, `moderators`   | `creator`       |
| `admin`                     | `admin`         |
| `creator`                   | `creator`       |
| `consumer`                  | `consumer`      |
| `isBanned: true` o `banned` | `banned`        |

Tambien se extendieron los mappers para aceptar campos legacy y nuevos en usuarios, publicaciones, comentarios y notificaciones.

### Cliente API

Se extendio `api` con dominios faltantes:

- `api.categories`
- `api.publications.save`
- `api.publications.unsave`
- `api.publications.listSaved`
- `api.social.followCreator`
- `api.social.unfollowCreator`
- `api.social.listFollowers`
- `api.social.listFollowing`
- `api.ratings`
- `api.reports`
- `api.creatorDashboard`
- `api.admin.listReports`
- `api.admin.reviewReport`
- `api.admin.hidePublication`
- `api.admin.hideComment`
- `api.admin.createCategory`
- `api.admin.updateCategory`
- `api.admin.deleteCategory`

Se conservaron las exportaciones legacy:

- `listPublications`
- `createPublication`
- `deletePublication`
- `editPublication`
- `createComment`
- `deleteComment`
- `likePublication`
- `unlikePublication`
- `sharePublication`
- `listNotifications`

### Media upload

`api.media.getPresignedUrl` ahora envia al backend `type: image|video`, aunque los callers legacy sigan pasando `publications|profile`. La normalizacion se hace con base en el MIME type.

### Rutas API

`GlobalVariables` ahora contiene rutas para los dominios nuevos del backend:

- categorias.
- follows.
- guardados.
- ratings.
- reportes/admin.
- dashboard de creador.

### Pruebas

Se ampliaron pruebas en `src/services/api.test.ts`:

- Mapeo legacy de publicaciones.
- Normalizacion de roles.
- Mapeo de campos educativos de publicacion.
- Listado de categorias.
- Normalizacion de media upload.

## Fuera de alcance de esta fase

- No se modifico UI para consumir categorias, follows, guardados, ratings o reportes.
- No se cambio el formulario de publicacion para requerir `title`, `categoryId` y `format`.
- No se implementaron guards de rutas.
- No se corrigio la deuda completa de lint.
- No se elimino `api.admin.updateUser`, aunque se mantiene marcado como riesgoso porque `/user/update` actualiza al usuario autenticado.

## Verificacion

| Comando         | Resultado                                   |
| --------------- | ------------------------------------------- |
| `npm test`      | Pasa: 5 tests.                              |
| `npm run build` | Pasa.                                       |
| `npm run lint`  | Sigue con deuda legacy; se verifica aparte. |

## Siguiente paso recomendado

Fase 3 debe centralizar router/autorizacion real:

- rutas publicas/protegidas/admin/creator.
- bloqueo de baneados.
- invitado con acceso limitado.
- remocion progresiva de permisos dispersos en componentes.
