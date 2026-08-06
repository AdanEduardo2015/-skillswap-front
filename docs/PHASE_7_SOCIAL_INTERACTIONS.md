# Fase 7 - Interacciones sociales

## Objetivo

Completar las interacciones sociales principales sobre tarjetas de publicacion sin mezclar esta fase con busqueda avanzada, administracion ni reportes.

## Alcance implementado

- Guardar/quitar publicacion guardada desde `PublicationCard`.
- Calificar publicaciones con estrellas interactivas de 1 a 5.
- Seguir/dejar de seguir al creador desde la tarjeta.
- Estados optimistas con rollback cuando el backend rechaza la operacion.
- Modales de autenticacion reutilizados para errores `401` y mensajes de permisos para `403`.
- Lectura de `summary.ratingAvg` y `summary.ratingCount` devueltos por `/ratings` para mantener promedio y conteo exactos.
- Soporte tolerante para campos enriquecidos si el backend los entrega:
  - `userRating`, `myRating`, `currentUserRating`.
  - `isFollowingCreator`, `isFollowing`, `followingCreator`.
  - `user.isFollowed`, `user.isFollowing`.

## Contrato con backend

Endpoints consumidos:

- `POST /publications/save` con `{ publicationId }`.
- `POST /publications/unsave` con `{ publicationId }`.
- `POST /ratings` con `{ targetType: "publication", targetId, rating }`.
- `POST /creators/follow` con `{ creatorEmail }`.
- `POST /creators/unfollow` con `{ creatorEmail }`.

El feed autenticado ya devuelve `isSaved`; si en el futuro devuelve `isFollowingCreator` o `userRating`, el front inicializa los controles con esos valores. Mientras no exista `isFollowingCreator`, el boton de follow inicia como no seguido y corrige estados `409/404` desde la respuesta del backend.

## Archivos principales

- `src/components/PublicationCard.tsx`
- `src/components/hooks/PublicationsActions.ts`
- `src/components/publication/PublicationActions.tsx`
- `src/features/social/InteractiveRating.tsx`
- `src/features/social/socialInteractions.ts`
- `src/services/api.ts`
- `src/types/index.ts`

## Verificacion

- `npm test`: pasa, 4 archivos y 21 pruebas.
- `npm run build`: pasa.
- `npm run lint`: falla por deuda legacy existente fuera del alcance directo de esta fase; no quedan errores reportados en los archivos nuevos o modificados para fase 7.
