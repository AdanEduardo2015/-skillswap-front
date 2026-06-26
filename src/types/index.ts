// ===========================
// Core Entity Interfaces (Standardized camelCase)
// ===========================

export interface UserSummary {
  email: string;
  username: string;
  profilePicUrl?: string;
  role: 'user' | 'moderator' | 'admin';
}

export interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  canDelete?: boolean;
  canUpdate?: boolean;
  user?: UserSummary;
}

export interface CommentsSummary {
  total: number;
  list: CommentData[];
}

export interface Publication {
  id: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  lat?: number | null;
  long?: number | null;
  createdAt: string;
  user?: UserSummary;
  comments?: CommentsSummary;
  likesCount: number;
  sharesCount: number;
  isLiked?: boolean;
  canDelete?: boolean;
  canUpdate?: boolean;
}

export interface Notification {
  id: string;
  message: string;
  publicationId: string;
  user?: UserSummary;
  read?: boolean;
  createdAt: string;
}

// ===========================
// API Response Interfaces
// ===========================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  nextToken?: string | null;
}

export interface PublicationsListResponse extends PaginatedResponse<Publication> {
  userProfile?: UserSummary;
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
