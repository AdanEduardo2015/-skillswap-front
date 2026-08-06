# Fase 6 - Perfiles y onboarding por rol

## Objetivo

Implementar el onboarding y la visualizacion de perfiles por rol en el front, sin mezclar esta fase con publicaciones, busqueda ni administracion centralizada.

## Alcance implementado

- Registro con seleccion explicita de tipo de cuenta:
  - `consumer`: intereses separados por coma.
  - `creator`: area de especialidad obligatoria.
- Payload de alta compatible con `/user/create`: `email`, `username`, `role`, `bio`, `location`, `interests`, `specialty`.
- Edicion de perfil extendida con nombre, foto, biografia, ubicacion, intereses o especialidad.
- Vistas `MyProfile` y `UserProfile` separadas por secciones:
  - resumen de perfil;
  - seguridad y preferencias nativas en perfil propio;
  - publicaciones del usuario;
  - acciones admin separadas en componente propio para perfil publico.
- Visualizacion de:
  - rol normalizado (`consumer`, `creator`, `admin`, `banned`);
  - estado verificado, si el backend lo entrega;
  - estado restringido/baneado;
  - seguidores, siguiendo, rating promedio y numero de valoraciones;
  - intereses de consumidor o especialidad de creador.

## Contrato de backend

El front sigue consumiendo `api.publications.listByUser(email)` para obtener `userProfile` junto con el feed del usuario. El mapper central acepta campos actuales y variantes tolerantes:

- foto: `profilePicture`, `profilePicUrl`, `Url_foto_perfil`;
- especialidad: `specialty`, `expertise`, `areaEspecialidad`, `area_especialidad`;
- verificacion: `isVerified`, `verified`, `Verificado`;
- booleanos en formato boolean real o string (`true`, `false`, `1`, `0`).

Las acciones admin de creador siguen usando los endpoints existentes `makeModerator` y `removeModerator`, pero la UI los presenta como `Hacer creador` y `Quitar creador` porque el front ya normaliza `moderator/moderators` a `creator`.

## Archivos principales

- `src/features/profiles/profileForm.ts`
- `src/features/profiles/ProfileSummaryCard.tsx`
- `src/features/profiles/ProfileAdminActions.tsx`
- `src/components/SignUp.tsx`
- `src/components/EditProfile.tsx`
- `src/components/MyProfile.tsx`
- `src/components/UserProfile.tsx`
- `src/services/api.ts`
- `src/types/index.ts`
- `src/utils/UserStore.tsx`

## Verificacion

- `npm test`: pasa, 17 pruebas.
- `npm run build`: pasa.
- `npm run lint`: falla por deuda legacy existente fuera del alcance de esta fase; no quedan errores reportados en archivos nuevos o modificados de fase 6.
