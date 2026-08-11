import type { Category, CreatePublicationPayload, Publication, PublicationFormat } from "../../types";

export const PUBLICATION_TITLE_MAX_LENGTH = 100;
export const PUBLICATION_CONTENT_MAX_LENGTH = 300;
export const PUBLICATION_MAX_TAGS = 5;
export const PUBLICATION_MAX_TAG_LENGTH = 30;
export const PUBLICATION_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const PUBLICATION_VIDEO_MAX_SECONDS = 10 * 60;

export const PUBLICATION_FORMAT_LABELS: Record<PublicationFormat, string> = {
  article: "Articulo",
  image: "Imagen",
  video: "Video",
  mixed: "Mixto",
};

export const PUBLICATION_FORMAT_OPTIONS: Array<{
  value: PublicationFormat;
  label: string;
}> = [
  { value: "article", label: PUBLICATION_FORMAT_LABELS.article },
  { value: "video", label: PUBLICATION_FORMAT_LABELS.video },
];

export const FALLBACK_PUBLICATION_CATEGORIES: Category[] = [
  {
    id: "tecnologia",
    name: "Tecnología",
    description: "Contenido sobre herramientas digitales, computación y novedades tecnológicas.",
    isActive: true,
  },
  {
    id: "programacion",
    name: "Programación",
    description: "Tutoriales de código, desarrollo web, aplicaciones móviles y software.",
    isActive: true,
  },
  {
    id: "matematicas",
    name: "Matemáticas",
    description: "Lecciones y resolución de ejercicios de álgebra, geometría, cálculo y lógica.",
    isActive: true,
  },
  {
    id: "ciencia",
    name: "Ciencia",
    description: "Divulgación científica, experimentos y temas de ciencias naturales.",
    isActive: true,
  },
  {
    id: "idiomas",
    name: "Idiomas",
    description: "Recursos para aprender, practicar y mejorar habilidades de comunicación en otros idiomas.",
    isActive: true,
  },
  {
    id: "negocios_finanzas",
    name: "Negocios y Finanzas",
    description: "Estrategias empresariales, administración, inversiones y finanzas personales.",
    isActive: true,
  },
  {
    id: "diseno_arte",
    name: "Diseño y Arte",
    description: "Técnicas de ilustración, diseño gráfico, UI/UX y expresión artística.",
    isActive: true,
  },
  {
    id: "musica",
    name: "Música",
    description: "Clases de instrumentos, teoría musical, producción de audio y canto.",
    isActive: true,
  },
  {
    id: "cocina",
    name: "Cocina",
    description: "Recetas, técnicas culinarias, repostería y gastronomía.",
    isActive: true,
  },
  {
    id: "salud_fitness",
    name: "Salud y Fitness",
    description: "Rutinas de ejercicio, bienestar físico, nutrición y hábitos saludables.",
    isActive: true,
  },
  {
    id: "mecanica",
    name: "Mecánica",
    description: "Mantenimiento, reparación y funcionamiento de sistemas mecánicos y automotrices.",
    isActive: true,
  },
  {
    id: "fotografia",
    name: "Fotografía",
    description: "Consejos de iluminación, composición, edición y manejo de cámaras.",
    isActive: true,
  },
  {
    id: "educacion",
    name: "Educación",
    description: "Métodos de estudio, pedagogía y recursos de enseñanza en general.",
    isActive: true,
  },
  {
    id: "videojuegos",
    name: "Videojuegos",
    description: "Desarrollo de juegos, diseño de niveles, motores gráficos y tutoriales.",
    isActive: true,
  },
  {
    id: "manualidades",
    name: "Manualidades",
    description: "Proyectos de bricolaje, proyectos DIY (Hazlo tú mismo) y artesanías.",
    isActive: true,
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Estrategias de posicionamiento, redes sociales, ventas y publicidad digital.",
    isActive: true,
  },
  {
    id: "derecho",
    name: "Derecho",
    description: "Conceptos legales, leyes, trámites y orientación jurídica básica.",
    isActive: true,
  },
  {
    id: "psicologia",
    name: "Psicología",
    description: "Desarrollo personal, comportamiento humano, salud mental y bienestar emocional.",
    isActive: true,
  },
  {
    id: "quimica",
    name: "Química",
    description: "Reacciones químicas, elementos, laboratorio y propiedades de la materia.",
    isActive: true,
  },
  {
    id: "fisica",
    name: "Física",
    description: "Principios mecánicos, termodinámica, energía y fenómenos naturales.",
    isActive: true,
  },
  {
    id: "medicina",
    name: "Medicina",
    description: "Contenido informativo sobre salud médica, anatomía y primeros auxilios.",
    isActive: true,
  },
  {
    id: "reparacion_dispositivos",
    name: "Reparación de Dispositivos",
    description: "Guías prácticas para reparar teléfonos, computadoras y equipos electrónicos.",
    isActive: true,
  },
];

export interface PublicationFormValues {
  title: string;
  content: string;
  categoryId: string;
  format: PublicationFormat;
  tags: string[];
  videoUrl: string | null;
}

export type PublicationFormErrors = Partial<Record<keyof PublicationFormValues | "media", string>>;

export const createEmptyPublicationFormValues = (): PublicationFormValues => ({
  title: "",
  content: "",
  categoryId: "",
  format: "article",
  tags: [],
  videoUrl: null,
});

export const parsePublicationTags = (value: string | string[]): string[] => {
  const rawTags = Array.isArray(value) ? value : value.split(",");
  const seen = new Set<string>();

  return rawTags
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, PUBLICATION_MAX_TAGS);
};

export const inferPublicationFormat = (videoUrl: string | null): PublicationFormat => {
  if (videoUrl) return "video";
  return "article";
};

export const validatePublicationForm = (values: PublicationFormValues): PublicationFormErrors => {
  const errors: PublicationFormErrors = {};
  const title = values.title.trim();
  const content = values.content.trim();

  if (!title) {
    errors.title = "Agrega un titulo para la publicacion.";
  } else if (title.length > PUBLICATION_TITLE_MAX_LENGTH) {
    errors.title = `El titulo no puede superar ${PUBLICATION_TITLE_MAX_LENGTH} caracteres.`;
  }

  if (!content) {
    errors.content = "Agrega una descripcion o contenido educativo.";
  } else if (content.length > PUBLICATION_CONTENT_MAX_LENGTH) {
    errors.content = `El contenido no puede superar ${PUBLICATION_CONTENT_MAX_LENGTH} caracteres.`;
  }

  if (!values.categoryId) {
    errors.categoryId = "Selecciona una categoría obligatoriamente.";
  }

  if (values.tags.length > PUBLICATION_MAX_TAGS) {
    errors.tags = `Usa maximo ${PUBLICATION_MAX_TAGS} etiquetas.`;
  } else if (values.tags.some((tag) => tag.length > PUBLICATION_MAX_TAG_LENGTH)) {
    errors.tags = `Cada etiqueta debe tener maximo ${PUBLICATION_MAX_TAG_LENGTH} caracteres.`;
  }

  // Se removio la validacion estricta de media para evitar bloqueos falsos
  // si el usuario decide quitar el video y publicar solo texto.

  return errors;
};

export const buildPublicationPayload = (values: PublicationFormValues): CreatePublicationPayload => ({
  title: values.title.trim(),
  content: values.content.trim(),
  categoryId: values.categoryId,
  format: values.videoUrl ? "video" : "article",
  tags: values.tags,
  videoUrl: values.videoUrl,
});

export const getPublicationFormValues = (publication: Publication): PublicationFormValues => ({
  title: publication.title ?? "",
  content: publication.content ?? "",
  categoryId: publication.categoryId ?? "",
  format: publication.videoUrl ? "video" : "article",
  tags: publication.tags ?? [],
  videoUrl: publication.videoUrl ?? null,
});

export const validateVideoFile = (file: File): string | null => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isAmbiguousMp4 =
    extension === "mp4" && ["", "application/octet-stream", "application/mp4"].includes(file.type);

  if (file.type !== "video/mp4" && !isAmbiguousMp4) {
    return "El video debe ser MP4.";
  }

  if (file.size > PUBLICATION_VIDEO_MAX_BYTES) {
    return "El video no puede superar 100 MB.";
  }

  return null;
};

export const readVideoDuration = (file: File): Promise<number | null> => {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : null;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
};

export const validateVideoDuration = async (file: File): Promise<string | null> => {
  const duration = await readVideoDuration(file);

  if (duration !== null && duration > PUBLICATION_VIDEO_MAX_SECONDS) {
    return "El video no puede durar mas de 10 minutos.";
  }

  return null;
};
