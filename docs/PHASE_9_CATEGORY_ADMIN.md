# Fase 9 - Administracion de categorias

## Objetivo

Permitir administracion real de categorias desde el front, usando los endpoints admin del backend y una ruta protegida para `admin`.

## Alcance implementado

- Nueva ruta protegida: `/admin/categories`.
- Acceso limitado a rol `admin` mediante `RouteGuard`.
- Entrada de navegacion visible para administradores en nav desktop/mobile.
- Listado de categorias incluyendo inactivas.
- Crear categoria con:
  - id opcional;
  - nombre;
  - descripcion;
  - orden;
  - estado activo/inactivo.
- Editar categorias existentes.
- Eliminar categorias con confirmacion.
- Validacion local alineada con backend:
  - nombre requerido, maximo 80 caracteres;
  - descripcion maximo 500 caracteres;
  - orden numerico.
- Cliente API admin normaliza la respuesta `{ category }` para devolver `Category`.

## Contrato con backend

Endpoints consumidos:

- `GET /categories?includeInactive=true`
- `POST /admin/categories`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`

Payload de crear/actualizar:

```json
{
  "id": "tecnologia",
  "name": "Tecnologia",
  "description": "Contenido tecnico",
  "order": 1,
  "isActive": true
}
```

## Archivos principales

- `src/components/admin/AdminCategories.tsx`
- `src/features/admin/categories/categoryForm.ts`
- `src/features/admin/categories/categoryForm.test.ts`
- `src/app/router/routeConfig.ts`
- `src/app/router/AppRoutes.tsx`
- `src/components/SideNav.tsx`
- `src/components/NavBar.tsx`
- `src/services/api.ts`

## Verificacion

- `npm test`: pasa, 6 archivos y 30 pruebas.
- `npm run build`: pasa.
- `npm run lint`: falla por deuda legacy existente fuera del alcance directo de esta fase; no reporta errores en archivos nuevos o modificados para fase 9.
