# Fase 5: Publicaciones educativas

## Objetivo

Convertir publicaciones genericas en contenido educativo estructurado, alineado con el contrato del backend y con las reglas del documento funcional.

## Cambios implementados

- Se extendio `PublicationStore` para conservar:
  - `title`.
  - `categoryId`.
  - `format`.
  - `tags`.
  - multimedia y ubicacion existentes.
- Se creo `src/features/publications/publicationForm.ts` con:
  - constantes de limites.
  - normalizacion de etiquetas.
  - validacion de formulario.
  - validacion de archivos.
  - construccion del payload al backend.
- Se agrego `usePublicationCategories` para cargar `/categories` con categorias fallback si el backend no responde.
- Se creo `PublicationFormFields` para reutilizar titulo, descripcion, categoria, formato y etiquetas.
- Se creo `PublicationMediaPicker` para reutilizar imagen, video y ubicacion.
- Se refactorizo `CreatePublication` para crear publicaciones educativas con `title`, `content`, `categoryId`, `format`, `tags`, `imageUrl`, `videoUrl`, `lat` y `long`.
- Se refactorizo `PreviewPublication` para previsualizar y publicar el mismo payload educativo.
- Se refactorizo `EditPublicationModal` para editar publicaciones educativas usando `api.publications.edit`.
- Se actualizo `PublicationContent` para mostrar:
  - titulo.
  - categoria.
  - formato.
  - etiquetas.
  - rating.
  - guardados.
  - vistas.
- Se elimino `window.location.reload()` del borrado de publicaciones; ahora la tarjeta se retira localmente.
- Se amplio el mapper de publicaciones para aceptar campos educativos actuales y algunos nombres legacy.

## Validaciones aplicadas

- Titulo obligatorio, maximo 100 caracteres.
- Contenido obligatorio, maximo 1000 caracteres.
- Categoria obligatoria.
- Hasta 5 etiquetas.
- Cada etiqueta maximo 30 caracteres.
- Imagen: JPG, PNG o WEBP, maximo 5 MB.
- Video: MP4, maximo 100 MB.
- Duracion de video: maximo 10 minutos cuando el navegador permite leer metadata.
- Formato `image` requiere imagen.
- Formato `video` requiere video.
- Formato `mixed` requiere al menos imagen o video.
- Formato `article` permite contenido textual sin multimedia.

## Compatibilidad con backend

El payload enviado por crear/editar queda alineado con `skillswap-back/Docs/API.md`:

```json
{
  "title": "Introduccion a TypeScript",
  "content": "Contenido educativo",
  "categoryId": "tecnologia",
  "format": "article",
  "tags": ["typescript", "programacion"],
  "imageUrl": null,
  "videoUrl": null,
  "lat": null,
  "long": null
}
```

## Verificacion

- `npm run build`: pasa.
- `npm test`: pasa, 3 archivos y 15 pruebas.
- `npm run lint`: falla por deuda legacy, 72 errores y 7 warnings.
- No quedan `window.location.reload()` en acciones de publicaciones.

## Pendientes fuera de esta fase

- En fase 8, conectar busqueda avanzada con `categoryId`, `tags`, `format` y ordenamientos.
- En fase 7, agregar guardado, rating interactivo y follow sobre las tarjetas.
- En fase 9, permitir administracion real de categorias.
- En fase 11, terminar deuda lint restante en componentes legacy.
