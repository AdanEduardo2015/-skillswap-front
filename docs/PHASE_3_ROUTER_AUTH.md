# Fase 3: Router, app shell y autorizacion

## Objetivo

Centralizar navegacion, metadata de layout y reglas de acceso sin redisenar pantallas ni cambiar formularios funcionales.

## Cambios implementados

- Se agrego metadata declarativa de rutas en `src/app/router/routeConfig.ts`.
- Se separo la decision pura de acceso en `src/app/router/routeAccess.ts`.
- Se agrego `RouteGuard` para aplicar:
  - rutas publicas.
  - rutas solo invitado.
  - rutas protegidas.
  - bloqueo de usuarios baneados en acciones privadas.
  - restriccion de creacion de publicaciones a `creator` y `admin`.
- Se agrego `AuthSessionProvider` como fuente central de sesion.
- `LoggedLayout` dejo de consultar Cognito directamente y ahora consume la sesion central.
- `routeLayout.ts` ahora deriva navbar, footer, sidenav y logo desde la metadata de rutas.
- Se movio la normalizacion de roles a `src/domain/roles.ts` para compartirla entre API y router.
- Se agregaron pruebas unitarias de metadata y permisos de rutas.

## Reglas de acceso actuales

| Ruta                                                                                         | Acceso        | Roles                                    |
| -------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------- |
| `/`, `/search`, `/profile`, `/publication`, `/not-found`                                     | Publica       | Todos, incluido invitado                 |
| `/login`, `/signUp`, `/forgot-password`, `/reset-password`, `/confirm-signup`, `/verify-mfa` | Solo invitado | Redirige a `/` si ya hay sesion          |
| `/my-profile`                                                                                | Protegida     | `consumer`, `creator`, `admin`, `banned` |
| `/edit-profile`, `/edit-password`, `/notifications`, `/setup-mfa`                            | Protegida     | `consumer`, `creator`, `admin`           |
| `/create-publication`, `/preview-publication`                                                | Protegida     | `creator`, `admin`                       |

## Compatibilidad legacy

- `user` y `users` se normalizan a `consumer`.
- `moderator` y `moderators` se normalizan a `creator`.
- `admin` y `admins` se normalizan a `admin`.
- `banned` o banderas `isBanned`/`custom:isBanned` se normalizan a `banned`.
- `GlobalVariables.paths` queda como adaptador legacy, pero ya no es la fuente primaria de metadata de layout.

## Verificacion

- `npm test`: pasa, 2 archivos y 11 pruebas.
- `npm run build`: pasa.
- `npm run lint`: falla por deuda heredada, 86 errores y 8 warnings. No aparecen errores nuevos en `src/app` ni `src/domain`.

## Pendientes fuera de esta fase

- Crear rutas reales de admin cuando se implemente la fase 9.
- Ajustar UI para que los usuarios `consumer` no vean acciones de creador antes de tocar el guard.
- Eliminar `GlobalVariables.tsx` como mezcla de constantes, hooks y componentes en fase 11 o durante una migracion controlada.
- Revisar si el backend expondra el rol efectivo en claims de Cognito o si el front debera consultarlo desde perfil al hidratar sesion.
