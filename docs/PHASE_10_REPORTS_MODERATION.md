# Fase 10 - Reportes y moderacion

## Objetivo

Permitir que usuarios autenticados reporten contenido y que administradores revisen esos reportes desde el front, usando los endpoints de moderacion del backend.

## Alcance implementado

- Nueva ruta protegida: `/admin/reports`.
- Acceso limitado a rol `admin` mediante `RouteGuard`.
- Entrada de navegacion visible para administradores en nav desktop/mobile.
- Modal reutilizable para crear reportes sobre publicaciones.
- Validacion local alineada con backend:
  - motivo requerido, maximo 160 caracteres;
  - descripcion opcional, maximo 1200 caracteres.
- Bandeja admin con filtro por estado:
  - `pending`;
  - `reviewed`;
  - `dismissed`;
  - `actioned`.
- Revision de reportes con notas.
- Accion de ocultar publicaciones o comentarios reportados y marcar el reporte como `actioned`.
- Cliente API normaliza respuestas `{ report }` para crear y revisar reportes.

## Contrato con backend

Endpoints consumidos:

- `POST /reports`
- `GET /admin/reports?status=pending&limit=20`
- `POST /admin/reports/review`
- `POST /admin/publications/hide`
- `POST /admin/comments/hide`

Payload de crear reporte:

```json
{
  "targetType": "publication",
  "targetId": "pub-1",
  "reason": "Contenido inapropiado",
  "description": "Detalle opcional"
}
```

Payload de revision:

```json
{
  "id": "report-1",
  "status": "actioned",
  "notes": "Publicacion ocultada por moderacion"
}
```

## Archivos principales

- `src/components/admin/AdminReports.tsx`
- `src/components/modals/ReportTargetModal.tsx`
- `src/features/reports/reportForm.ts`
- `src/features/reports/reportForm.test.ts`
- `src/app/router/routeConfig.ts`
- `src/app/router/AppRoutes.tsx`
- `src/components/PublicationCard.tsx`
- `src/components/publication/PublicationActions.tsx`
- `src/components/SideNav.tsx`
- `src/components/NavBar.tsx`
- `src/services/api.ts`

## Pendientes fuera de esta fase

- Agregar reportes directos para comentarios en la vista de detalle cuando se refactorice `PublicationComments`.
- Agregar reportes de usuarios desde perfil publico si el flujo de moderacion lo requiere.
