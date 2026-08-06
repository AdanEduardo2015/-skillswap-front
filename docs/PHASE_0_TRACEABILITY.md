# Fase 0: Control de Entrada y Trazabilidad Frontend

Fecha de corte: 2026-06-27.

## Alcance

Esta fase no cambia comportamiento productivo. Su objetivo es dejar una base verificable para refactorizar `skillswap-front` contra:

- `Equipo902 bien.docx`.
- `skillswap-back/README.md`.
- `skillswap-back/Docs/API.md`.

## Decisiones Base

### Nombre del producto

- Nombre oficial de dominio y UI: `SkillSwap`.
- `ComuniRed` queda como nombre legacy detectado en el codigo actual y debe migrarse de forma controlada en fases posteriores.
- Nombres de paquetes, textos visibles, prompts, app links y assets deben revisarse antes de publicacion.

### Version objetivo

- V1 cubre la red social educativa multimedia basica: roles, contenido educativo, categorias, feed, busqueda, comentarios, likes, compartir, seguimiento, favoritos, calificaciones, reportes y administracion.
- V2 queda fuera de la refactorizacion base: mensajeria privada, realtime completo, recomendaciones, estadisticas avanzadas y verificacion visual de creadores.

### Compatibilidad temporal con datos legacy

El frontend debe aceptar temporalmente respuestas antiguas y nuevas mientras se completa la migracion:

| Dominio        | Regla temporal                                                                                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles          | `user` y `users` se normalizan a `consumer`; `moderator` y `moderators` se normalizan a `creator`; `admin` se mantiene; `isBanned` o `banned` bloquean acciones privadas.                                                                                        |
| Publicaciones  | Aceptar `id` o `Id_publicacion`, `content` o `Contenido`, `imageUrl` o `Url_imagen`, `videoUrl` o `Url_video`; agregar soporte nuevo para `title`, `categoryId`, `format`, `tags`, `isSaved`, `savedCount`, `ratingAvg`, `ratingCount`, `viewsCount` y `status`. |
| Usuarios       | Aceptar `profilePicture`, `profilePicUrl`, `Url_foto_perfil` y equivalentes actuales; agregar `bio`, `coverPicture`, `location`, `interests`, `followersCount`, `followingCount`, `ratingAvg`, `ratingCount`.                                                    |
| Notificaciones | Aceptar `publicationId` legacy, pero preferir `targetType` y `targetId` del backend nuevo para navegar correctamente.                                                                                                                                            |
| Media          | El backend documenta `type: image                                                                                                                                                                                                                                | video`; el front actual usa `publications | profile`. El contrato nuevo debe enviar `image`o`video` y resolver carpeta/intencion desde la feature que sube el archivo. |
| Categorias     | La respuesta esperada es `{ categories: Category[] }`; el front todavia no tiene cliente de categorias.                                                                                                                                                          |

## Inventario Actual del Front

### Rutas existentes

| Ruta                                                     | Pantalla                  | Estado frente al objetivo                                                                             |
| -------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`                                                      | Feed/Home                 | Parcial: lista publicaciones, pero no filtra por categorias ni muestra estructura educativa completa. |
| `/login`                                                 | Login                     | Existente.                                                                                            |
| `/signUp`                                                | Registro                  | Parcial: no selecciona rol `consumer`/`creator`.                                                      |
| `/search`                                                | Busqueda                  | Parcial: busqueda simple, faltan filtros y ordenamientos.                                             |
| `/profile`                                               | Perfil publico            | Parcial: perfil basico y acciones admin puntuales.                                                    |
| `/my-profile`                                            | Perfil propio             | Parcial: perfil y publicaciones, faltan datos de rol y listas sociales.                               |
| `/edit-profile`                                          | Edicion de perfil         | Parcial: no cubre todos los campos de dominio.                                                        |
| `/publication`                                           | Detalle de publicacion    | Parcial: detalle y comentarios, falta contenido educativo completo.                                   |
| `/create-publication`                                    | Crear publicacion         | Parcial: no envia `title`, `categoryId`, `format` ni `tags`.                                          |
| `/preview-publication`                                   | Previsualizar publicacion | Parcial: usa modelo legacy.                                                                           |
| `/notifications`                                         | Notificaciones            | Parcial: espera `publicationId` legacy.                                                               |
| `/setup-mfa`, `/verify-mfa`                              | MFA                       | Existente.                                                                                            |
| `/forgot-password`, `/reset-password`, `/confirm-signup` | Recuperacion/confirmacion | Existente.                                                                                            |

### Servicios actuales

| Servicio front      | Estado                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| `api.publications`  | Parcial: lista, obtiene, crea, edita y elimina; falta contrato educativo completo.    |
| `api.comments`      | Parcial: comentarios basicos; falta limite UI y respuestas si se implementan.         |
| `api.social`        | Parcial: like/unlike/share; faltan follows, saved y ratings.                          |
| `api.notifications` | Parcial: lista, leer, limpiar; falta modelo `targetType`/`targetId`.                  |
| `api.users`         | Parcial: create/update/delete/fcm; falta rol de registro y campos extendidos.         |
| `api.media`         | Parcial: usa tipo legacy.                                                             |
| `api.search`        | Parcial: solo `q`, faltan filtros documentados.                                       |
| `api.admin`         | Parcial: ban/unban/creator legacy; faltan reportes, categorias y moderacion completa. |
| Categorias          | Faltante.                                                                             |
| Follows             | Faltante.                                                                             |
| Guardados           | Faltante.                                                                             |
| Ratings             | Faltante.                                                                             |
| Reports             | Faltante.                                                                             |
| Creator dashboard   | Faltante/V2 segun prioridad.                                                          |

## Matriz Funcional

Estados:

- Existente: la UI cubre el flujo base.
- Parcial: hay implementacion, pero falta contrato, campos, permisos o experiencia.
- Faltante: no hay UI/servicio suficiente.
- V2: documentado como extension posterior.

### Administrador

| ID     | Requerimiento                           | Estado front | Ruta/pantalla actual     | Servicio actual                | Brecha                                                     |
| ------ | --------------------------------------- | ------------ | ------------------------ | ------------------------------ | ---------------------------------------------------------- |
| RF-A01 | Registro e inicio de sesion             | Parcial      | `/login`                 | Amplify                        | Login existe, pero no hay entrada dedicada a panel admin.  |
| RF-A02 | Gestion de usuarios                     | Parcial      | `/profile`               | `api.admin.*`                  | No hay listado/busqueda admin ni vista centralizada.       |
| RF-A03 | Gestion de publicaciones                | Parcial      | Feed/perfil              | `api.publications.delete/edit` | No hay panel para revisar publicaciones educativas.        |
| RF-A04 | Gestion de reportes                     | Faltante     | Ninguna                  | Ninguno                        | Backend expone `/admin/reports`; front no lo consume.      |
| RF-A05 | Control de contenido y sanciones        | Parcial      | `/profile`               | ban/unban legacy               | Falta flujo por gravedad y ocultar publicacion/comentario. |
| RF-A06 | Gestion de categorias                   | Faltante     | Ninguna                  | Ninguno                        | Backend expone `/categories` y `/admin/categories`.        |
| RF-A07 | Panel de estadisticas                   | V2           | Ninguna                  | Ninguno                        | Extension posterior.                                       |
| RF-A08 | Notificaciones administrativas realtime | V2           | `/notifications` parcial | `api.notifications`            | No hay realtime ni clasificacion admin.                    |

### Creador de contenido

| ID     | Requerimiento                    | Estado front | Ruta/pantalla actual            | Servicio actual              | Brecha                                                                      |
| ------ | -------------------------------- | ------------ | ------------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| RF-C01 | Registro con tipo de usuario     | Parcial      | `/signUp`                       | `api.users.create`           | No envia `role: creator`.                                                   |
| RF-C02 | Inicio de sesion                 | Existente    | `/login`                        | Amplify                      | Cubierto.                                                                   |
| RF-C03 | Gestion de perfil                | Parcial      | `/my-profile`, `/edit-profile`  | `api.users.update`           | Faltan bio, especialidad/intereses completos y contadores.                  |
| RF-C04 | Publicacion educativa multimedia | Parcial      | `/create-publication`           | `api.publications.create`    | No envia titulo, categoria, formato, tags ni valida limites requeridos.     |
| RF-C05 | Visualizacion de publicaciones   | Existente    | `/`, `/publication`, `/profile` | `api.publications.*`         | Cubierto como base.                                                         |
| RF-C06 | Interaccion social               | Parcial      | Cards/comentarios               | `api.social`, `api.comments` | Likes/comentarios/share existen; faltan dislike/respuestas si se requieren. |
| RF-C07 | Seguimiento de usuarios          | Faltante     | Ninguna                         | Ninguno                      | Backend expone `/creators/follow`.                                          |
| RF-C08 | Guardado de publicaciones        | Faltante     | Ninguna                         | Ninguno                      | Backend expone `/publications/save`.                                        |
| RF-C09 | Sistema de calificacion          | Faltante     | Ninguna                         | Ninguno                      | Backend expone `/ratings`.                                                  |
| RF-C10 | Mensajeria privada               | V2           | Ninguna                         | Ninguno                      | Extension posterior.                                                        |
| RF-C11 | Notificaciones en tiempo real    | Parcial/V2   | `/notifications`                | `api.notifications`, polling | Hay notificaciones basicas, no realtime.                                    |
| RF-C13 | Verificacion de cuenta           | V2           | Ninguna                         | Ninguno                      | Extension posterior.                                                        |

### Usuario consumidor

| ID     | Requerimiento                 | Estado front | Ruta/pantalla actual                  | Servicio actual              | Brecha                                                          |
| ------ | ----------------------------- | ------------ | ------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| RF-U01 | Registro                      | Parcial      | `/signUp`                             | `api.users.create`           | No envia `role: consumer` explicitamente.                       |
| RF-U02 | Inicio de sesion              | Existente    | `/login`                              | Amplify                      | Cubierto.                                                       |
| RF-U03 | Gestion de perfil             | Parcial      | `/my-profile`, `/edit-profile`        | `api.users.update`           | Faltan intereses y campos extendidos.                           |
| RF-U04 | Visualizacion de contenido    | Parcial      | `/`, `/publication`                   | `api.publications.*`         | Falta modelo educativo completo en UI.                          |
| RF-U05 | Interaccion social            | Parcial      | Cards/comentarios                     | `api.social`, `api.comments` | Falta dislike/respuestas si se requieren.                       |
| RF-U06 | Calificacion de creadores     | Faltante     | Ninguna                               | Ninguno                      | Backend expone `/ratings`.                                      |
| RF-U07 | Busqueda avanzada             | Parcial      | `/search`                             | `api.search.list`            | Solo usa `q`; faltan categoria, tags, formato, creador y orden. |
| RF-U08 | Seguimiento de creadores      | Faltante     | Ninguna                               | Ninguno                      | Backend listo, front no.                                        |
| RF-U09 | Guardado de favoritos         | Faltante     | Ninguna                               | Ninguno                      | Backend listo, front no.                                        |
| RF-U10 | Recuperacion de password      | Existente    | `/forgot-password`, `/reset-password` | Amplify                      | Cubierto.                                                       |
| RF-U11 | Reporte de contenido          | Faltante     | Ninguna                               | Ninguno                      | Backend expone `/reports`.                                      |
| RF-U12 | Mensajeria privada            | V2           | Ninguna                               | Ninguno                      | Extension posterior.                                            |
| RF-U13 | Notificaciones personalizadas | Parcial/V2   | `/notifications`                      | `api.notifications`          | Basicas; falta realtime/mensajes privados.                      |

### Usuario invitado

| ID     | Requerimiento            | Estado front | Ruta/pantalla actual           | Servicio actual                         | Brecha                                                     |
| ------ | ------------------------ | ------------ | ------------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| RF-G01 | Acceso como invitado     | Existente    | `/`, `/search`, `/publication` | Endpoints publicos                      | Puede navegar sin sesion.                                  |
| RF-G02 | Visualizacion publica    | Existente    | `/`, `/publication`            | `list-publications`, `list-publication` | Cubierto.                                                  |
| RF-G03 | Busqueda basica          | Existente    | `/search`                      | `search-resources`                      | Cubierto como base.                                        |
| RF-G04 | Restriccion de funciones | Parcial      | Modales puntuales              | Errores 401/403                         | Hay modales en algunas acciones; falta guard centralizado. |
| RF-G05 | Invitacion al registro   | Parcial/V2   | `RequireAuthModal`             | N/A                                     | Existe para algunas acciones; falta consistencia global.   |

## Matriz No Funcional

| ID     | Categoria      | Estado front  | Evidencia                     | Brecha                                                             |
| ------ | -------------- | ------------- | ----------------------------- | ------------------------------------------------------------------ |
| RNF-01 | Disponibilidad | Parcial       | Build productivo pasa.        | Depende de deploy/monitoring; no hay smoke test automatizado.      |
| RNF-02 | Seguridad      | Parcial       | Amplify + JWT en interceptor. | Base URL hardcodeada, permisos UI no centralizados.                |
| RNF-03 | Escalabilidad  | Parcial       | Vite build pasa.              | Bundle principal aproximado `1,162.07 kB`; falta code splitting.   |
| RNF-04 | Usabilidad     | Parcial       | Layout responsive existente.  | Falta UX de categorias, roles, admin y estados consistentes.       |
| RNF-05 | Almacenamiento | Parcial       | Presigned upload existe.      | Front debe alinear `type` y validaciones de archivo.               |
| RNF-06 | Mantenibilidad | Parcial       | TypeScript presente.          | `npm run lint` falla con 95 errores y 9 warnings en corte inicial. |
| RNF-07 | Compatibilidad | No verificado | Sin E2E/browser matrix.       | Falta validar Chrome, Firefox, Edge y Safari modernas.             |

## Estado Tecnico de Entrada

Comandos ejecutados antes de implementar esta fase:

| Comando          | Resultado                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `npm run build`  | Pasa. Genera advertencia por chunk mayor a 500 kB; bundle principal aprox. `1,162.07 kB`. |
| `npm run lint`   | Falla con 95 errores y 9 warnings.                                                        |
| `npm test`       | No existia script.                                                                        |
| `npx vitest run` | Fallaba porque el mock de Axios no simulaba `axios.create().interceptors`.                |

Cambios incluidos en Fase 0:

- Se agrega script `npm test` como `vitest run`.
- Se corrige la prueba existente de `api.ts` para mockear `axios.create`, interceptores y `fetchAuthSession`.

## Preparacion de Pruebas

Pruebas minimas para fases siguientes:

| Area                                   | Tipo                  | Prioridad |
| -------------------------------------- | --------------------- | --------- |
| Mapeadores API                         | Unitarias             | Alta      |
| Normalizacion de roles legacy          | Unitarias             | Alta      |
| Validacion de publicacion educativa    | Unitarias             | Alta      |
| Guards de rutas                        | Unitarias/integracion | Alta      |
| Acciones sociales optimistas           | Unitarias             | Media     |
| Flujos invitado/consumer/creator/admin | E2E                   | Media     |
| Layout mobile/desktop                  | E2E visual/manual     | Media     |

## Veredicto de Consumo del Backend

El backend esta listo en cobertura de dominios para que el front lo consuma, pero el cliente actual del front esta desfasado. Antes de construir UI nueva deben resolverse estos puntos:

1. Actualizar tipos de dominio y roles oficiales.
2. Cambiar creacion/edicion de publicaciones para enviar `title`, `categoryId`, `format` y `tags`.
3. Agregar clientes para categorias, follows, guardados, ratings, reportes, admin avanzado y creator dashboard.
4. Mover base URL a `VITE_API_BASE_URL`.
5. Alinear media upload a `type: image|video`.
6. Mapear notificaciones por `targetType` y `targetId`.
7. Eliminar el supuesto de admin update por `/user/update`; ese endpoint actualiza al usuario autenticado.

Con esos ajustes, el front podra consumir correctamente la API documentada.
