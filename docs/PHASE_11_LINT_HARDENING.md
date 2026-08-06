# Fase 11 - Saneamiento tecnico y lint

## Objetivo

Cerrar la deuda de lint heredada sin introducir cambios funcionales de producto. Esta fase estabiliza componentes legacy para que las siguientes fases partan de una base verificable.

## Alcance implementado

- `npm run lint` queda en cero errores y cero warnings.
- Se reemplazaron `any` por tipos de dominio o tipos concretos en:
  - comentarios;
  - layouts legacy;
  - prompts nativos;
  - formularios de auth;
  - mapa de ubicacion;
  - notificaciones.
- Se eliminaron bloques `catch` vacios con fallback explicito o logging leve.
- Se corrigieron dependencias de hooks reportadas por `react-hooks/exhaustive-deps`.
- Se eliminaron expresiones condicionales usadas como statements en `PublicationHeader`.
- Se movio `src/utils/GlobalVariables.tsx` a `src/utils/GlobalVariables.ts` para quitar errores de Fast Refresh en un archivo que exporta utilidades y constantes, no JSX.
- Se simplifico `UploadUtils.uploadFile` eliminando el `try/catch` redundante.

## Archivos principales

- `src/utils/GlobalVariables.ts`
- `src/components/PublicationComments.tsx`
- `src/components/hooks/CommentActions.ts`
- `src/components/AppLinkPrompt.tsx`
- `src/components/PushNotificationPrompt.tsx`
- `src/components/Notifications.tsx`
- `src/components/LocationPicker.tsx`
- `src/components/ViewPublication.tsx`
- `src/components/publication/PublicationHeader.tsx`
- `src/components/hooks/useNotificationPolling.ts`
- `src/components/hooks/usePushNotifications.ts`
- `src/components/layouts/DesktopLayout.tsx`
- `src/components/layouts/MobileLayout.tsx`
- `src/utils/UploadUtils.ts`

## Verificacion esperada

- `npm run lint`: pasa sin problemas.
- `npm test`: debe mantenerse en verde.
- `npm run build`: debe mantenerse en verde.
