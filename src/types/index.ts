// ===========================
// Core Entity Interfaces
// ===========================

export interface UserSummary {
  Correo_electronico?: string;
  nombre_usuario?: string;
  Nombre_usuario?: string;
  Url_foto_perfil?: string;
  url_foto_perfil?: string;
  role?: string;
  foto_perfil?: string;
}

export interface CommentData {
  id_comentario: string;
  contenido: string;
  fecha_comentario: string;
  Can_delete?: boolean;
  Can_update?: boolean;
  Usuario?: UserSummary;
}

export interface CommentsSummary {
  total: number;
  lista?: CommentData[];
}

export interface LikesSummary {
  total: number;
}

export interface SharedSummary {
  total: number;
}

export interface Publication {
  Id_publicacion: string;
  Contenido: string;
  Url_imagen?: string | null;
  Url_video?: string | null;
  Lat?: string | null;
  Long?: string | null;
  Fecha_publicacion: string;
  Usuario?: UserSummary;
  comentarios?: CommentsSummary;
  likes?: LikesSummary;
  compartidos?: SharedSummary;
  is_Liked?: boolean;
  Is_Liked?: boolean;
  is_liked?: boolean;
  Can_delete?: boolean;
  Can_update?: boolean;
}

export interface Notification {
  id_notificacion: string;
  mensaje: string;
  id_publicacion: string;
  usuario?: UserSummary;
}

// ===========================
// API Response Interfaces
// ===========================

export interface PublicationsListResponse {
  publicaciones: Publication[];
  hasMore?: boolean;
  usuario?: {
    nombre_usuario: string;
    foto_perfil: string;
    role: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface CreateCommentResponse {
  id: string;
}

// ===========================
// Component Prop Interfaces
// ===========================

export interface PathsState {
  showNavBar: boolean;
  showFooter: boolean;
  showSideNav: boolean;
  showLogoOnly: boolean;
  currentPath: string;
}

export interface PublicationCardProps {
  post: Publication;
  onImageClick: (src: string) => void;
  onClickComent?: () => void;
  isPreview?: boolean;
}

export interface PublicationCommentsProps {
  publication: Publication;
  showInput: boolean;
  setShowInput: (show: boolean) => void;
  onImageClick: (src: string) => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}
