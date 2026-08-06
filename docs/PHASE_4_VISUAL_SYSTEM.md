# Fase 4: Sistema visual y componentes compartidos

## Objetivo

Estandarizar controles visuales reutilizables sin cambiar reglas de negocio, endpoints ni flujos funcionales.

## Cambios implementados

- Se ampliaron tokens de Chakra en `src/app/theme.ts`:
  - `brand`.
  - `accent`.
  - `danger`.
  - `surface`.
  - `muted`.
  - radio `control` y `panel`.
  - spacing `touch`.
- Se creo `src/shared/ui` como capa UI compartida:
  - `AppButton`.
  - `AppIconButton`.
  - `TextField`.
  - `TextareaField`.
  - `AppModal`.
  - `ConfirmDialog`.
  - `EmptyState`.
  - `LoadingState`.
  - `RoleBadge`.
  - `CategoryBadge`.
  - `RatingStars`.
  - `FilePicker`.
- Se agrego `src/shared/ui/index.ts` para importaciones consistentes.
- Se migraron componentes de bajo riesgo:
  - `Login`.
  - `ForgotPassword`.
  - `Search`.
  - `NotFound`.
  - `ConfirmModal`.
  - `RequireAuthModal`.
  - estado de acceso denegado en `RouteGuard`.

## Decisiones

- Se mantiene Chakra UI como base para minimizar riesgo y respetar el stack existente.
- Los nuevos componentes viven en `shared/ui`; los componentes legacy permanecen en `components` hasta que cada fase funcional los vaya reemplazando.
- Los nuevos textos tocados en esta fase se dejaron en ASCII para no seguir propagando los problemas de codificacion que existen en varios archivos legacy.
- `ConfirmModal` y `RequireAuthModal` quedan como adaptadores compatibles, pero ya consumen `ConfirmDialog`, `AppModal` y `AppButton`.

## Verificacion

- `npm run build`: pasa.
- `npm test`: pasa, 2 archivos y 11 pruebas.
- `npm run lint`: falla por deuda heredada, 84 errores y 8 warnings.
- No hay errores de lint reportados en `src/shared/ui`.

## Impacto tecnico

- Se redujo duplicacion de estilos en inputs, botones, modales y estados vacios.
- Los componentes nuevos quedan tipados con props de Chakra y no usan `any`.
- `Login` y `ForgotPassword` dejaron de usar `catch (error: any)`.
- `Search` y `NotFound` ya usan estados visuales compartidos.

## Pendientes fuera de esta fase

- Migrar `SignUp`, `ResetPassword`, `ConfirmSignUp`, `EditProfile`, `EditPassword` y `SetupMFA` a `TextField`/`AppButton` cuando se trabaje onboarding y perfiles.
- Migrar `CreatePublication`, `EditPublicationModal` y comentarios durante la fase 5 y fase 7.
- Consolidar modales de push/app links con `AppModal`.
- Resolver la codificacion dañada restante en textos legacy en una fase controlada para evitar cambios masivos mezclados con funcionalidad.
- Reducir lint a cero en fase 11.
