# Fase 1: Estructura Base, Configuracion y Convenciones

Fecha de corte: 2026-06-27.

## Objetivo

Preparar el esqueleto del frontend para las siguientes fases sin cambiar reglas de negocio ni redisenar pantallas.

## Cambios implementados

### Capa `app`

Se agrego `src/app` como entrada de aplicacion:

- `src/app/App.tsx`: compone router, layout raiz y efectos globales.
- `src/app/AppProviders.tsx`: concentra providers globales.
- `src/app/theme.ts`: concentra la configuracion de Chakra.
- `src/app/router/AppRoutes.tsx`: define rutas de la aplicacion.
- `src/app/router/RouterSideEffects.tsx`: concentra scroll-to-top, app links y sincronizacion de metadata de layout.
- `src/app/router/routeLayout.ts`: define rutas y metadata de layout.

`src/main.tsx` queda reducido al montaje de React y providers.

### Lazy loading de rutas

Las pantallas principales se cargan con `React.lazy` dentro de `AppRoutes`. Esto prepara code splitting por ruta sin modificar comportamiento funcional.

### Metadata de rutas

Las listas inline de navbar/footer/sidebar/logo-only salieron de `GlobalVariables` y ahora viven en `routeLayout.ts`.

Por compatibilidad temporal, `GlobalVariables` conserva `paths` y `PathsInitializer`, pero delega el calculo a `getRouteLayoutState`.

### Configuracion de API

Se agrego `src/config/api.ts`:

```ts
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
```

El fallback conserva la URL AWS existente. En desarrollo local o ambientes nuevos se debe usar:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

### Layout activo

`RootLayout` queda como layout activo. `MobileLayout` y `DesktopLayout` se marcaron como deprecated para evitar que futuras fases trabajen en layouts no usados.

## Fuera de alcance de esta fase

- No se cambiaron contratos API.
- No se agregaron endpoints faltantes.
- No se cambiaron roles ni tipos de dominio.
- No se redisenaron pantallas.
- No se corrigio la deuda completa de lint.

## Criterios de salida

- `npm test` debe pasar.
- `npm run build` debe pasar.
- El warning de chunk grande puede continuar hasta la fase de rendimiento.
- `npm run lint` puede seguir fallando con deuda existente documentada en fase 0.
