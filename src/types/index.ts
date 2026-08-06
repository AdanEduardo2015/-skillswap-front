// ===========================
// Core Domain Types
// ===========================

export type UserRole = "admin" | "creator" | "consumer" | "guest" | "banned";
export type LegacyUserRole = "user" | "users" | "moderator" | "moderators";
export type PublicationFormat = "video" | "image" | "article" | "mixed";
export type PublicationStatus = "active" | "hidden" | "reported" | "deleted" | "restricted";
export type PublicationApprovalStatus = "pending" | "approved" | "rejected";
export type RatingTargetType = "publication" | "creator";
export type ReportTargetType = "publication" | "comment" | "user";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
export type NotificationTargetType = "publication" | "comment" | "user" | "creator" | "report";
export type SanctionType = "warning" | "temporary_ban" | "permanent_ban" | "content_restriction";
export type SanctionStatus = "active" | "expired" | "lifted";
export type AppealStatus = "pending" | "in_review" | "accepted" | "rejected";
export type MediaKind = "image" | "video";
export type UploadContext = "publications" | "profile";

export interface UserSummary {
  email: string;
  username: string;
  profilePicUrl?: string | null;
  profilePicture?: string | null;
  coverPicture?: string | null;
  role: UserRole;
  bio?: string;
  location?: string | null;
  interests?: string[];
  specialty?: string | null;
  followersCount?: number;
  followingCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
  userRating?: number | null;
  isBanned?: boolean;
  isVerified?: boolean;
  isFollowed?: boolean;
  activeSanctions?: Sanction[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  publicationsCount?: number;
  suggestedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Specialty {
  id: string;
  name: string;
}

export interface CommentData {
  id: string;
  publicationId?: string;
  parentId?: string | null;
  content: string;
  status?: "active" | "hidden" | "deleted";
  createdAt: string;
  updatedAt?: string;
  canDelete?: boolean;
  canUpdate?: boolean;
  user?: UserSummary;
  likesCount?: number;
  dislikesCount?: number;
  repliesCount?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
}

export interface CommentsSummary {
  total: number;
  list: CommentData[];
}

export interface Publication {
  id: string;
  title?: string;
  content: string;
  categoryId?: string;
  categoryName?: string;
  format?: PublicationFormat;
  tags?: string[];
  status?: PublicationStatus;
  approvalStatus?: PublicationApprovalStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  lat?: number | null;
  long?: number | null;
  createdAt: string;
  updatedAt?: string;
  userEmail?: string;
  creatorEmail?: string;
  authorId?: string;
  authorEmail?: string;
  authorUsername?: string;
  authorProfilePicture?: string | null;
  user?: UserSummary;
  comments?: CommentsSummary;
  commentsCount?: number;
  likesCount: number;
  dislikesCount: number;
  sharesCount: number;
  savedCount?: number;
  viewsCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
  userRating?: number | null;
  isLiked?: boolean;
  isDisliked?: boolean;
  isSaved?: boolean;
  isFollowingCreator?: boolean;
  canDelete?: boolean;
  canUpdate?: boolean;
}

export interface Follow {
  followerEmail: string;
  creatorEmail: string;
  createdAt?: string;
  email?: string;
  userEmail?: string;
  username?: string;
  profilePicture?: string | null;
  profilePicUrl?: string | null;
  role?: string;
  bio?: string | null;
  follower?: UserSummary;
  creator?: UserSummary;
  user?: UserSummary;
}

export interface Rating {
  targetKey?: string;
  targetType: RatingTargetType;
  targetId: string;
  email?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterEmail: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  reportedUser?: {
    username?: string;
    name?: string;
    email?: string;
  };
}

export interface Sanction {
  id: string;
  userEmail: string;
  type: SanctionType;
  reason?: string;
  description?: string;
  status: SanctionStatus;
  startsAt?: string;
  endsAt?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  liftedBy?: string | null;
  liftedAt?: string | null;
  reportId?: string | null;
  publicationId?: string | null;
}

export interface Appeal {
  id: string;
  sanctionId: string;
  userEmail: string;
  userName?: string;
  publicationId?: string | null;
  publicationTitle?: string | null;
  publicationContent?: string | null;
  publicationVideoUrl?: string | null;
  publicationFormat?: string | null;
  sanctionReason: string;
  sanctionType: SanctionType;
  sanctionCreatedAt: string;
  userExplanation: string;
  evidenceUrl?: string | null;
  evidenceType?: "image" | "pdf" | "video" | "link" | null;
  status: AppealStatus;
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  decisionReason?: string | null;
  adminNote?: string | null;
}

export interface PrivateMessage {
  id: string;
  threadKey: string;
  messageKey: string;
  senderEmail: string;
  recipientEmail: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
  status: "sent" | "read" | "deleted";
}

export interface ConversationSummary {
  threadKey: string;
  otherEmail: string;
  otherName?: string;
  otherUsername?: string;
  otherProfilePicture?: string | null;
  otherProfilePicUrl?: string | null;
  otherUser?: UserSummary;
  isOnline?: boolean;
  lastActiveAt?: string | null;
  presenceStatus?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageId: string;
  unreadCount?: number;
}

export interface MessagesSettings {
  messagesEnabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface NotificationsSettings {
  notificationsEnabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface Notification {
  id: string;
  message: string;
  publicationId?: string;
  targetType?: NotificationTargetType;
  targetId?: string;
  type?: string;
  user?: UserSummary;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface CreatorDashboard {
  creator: {
    email: string;
    username: string;
    followersCount: number;
    ratingAvg: number;
    ratingCount: number;
  };
  totals: {
    publications: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saved: number;
    ratingAvg: number;
    ratingCount: number;
  };
  topPublications: {
    byViews: Array<Pick<Publication, "id" | "title" | "categoryId" | "createdAt" | "viewsCount">>;
    byRating: Array<Pick<Publication, "id" | "title" | "categoryId" | "createdAt" | "ratingAvg">>;
    bySaved: Array<Pick<Publication, "id" | "title" | "categoryId" | "createdAt" | "savedCount">>;
  };
}

// ===========================
// API Request/Response Types
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
  sort?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface CreateCommentResponse {
  id: string;
}

export interface PublicationFilters {
  q?: string;
  categoryId?: string;
  tag?: string;
  tags?: string[] | string;
  format?: PublicationFormat;
  creatorEmail?: string;
  email?: string;
  sort?: "recent" | "mostViewed" | "topRated" | "mostSaved";
}

export interface CreatePublicationPayload {
  title?: string;
  content?: string;
  categoryId?: string;
  suggestedCategory?: string;
  format?: PublicationFormat;
  tags?: string[];
  status?: PublicationStatus;
  videoUrl?: string | null;
}

export interface CreatePublicationResponse {
  message?: string;
  publication?: Publication;
  user?: UserSummary;
}

export interface PublicationViewResponse {
  message?: string;
  counted: boolean;
  viewsCount?: number;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  role?: Extract<UserRole, "consumer" | "creator">;
  bio?: string;
  profilePicture?: string | null;
  profilePicUrl?: string | null;
  coverPicture?: string | null;
  location?: string | null;
  interests?: string[];
  specialty?: string | null;
}

export interface UpdateUserPayload {
  username?: string;
  profilePicture?: string | null;
  profilePicUrl?: string | null;
  coverPicture?: string | null;
  bio?: string;
  location?: string | null;
  interests?: string[];
  specialty?: string | null;
}

// ===========================
// Component Prop Interfaces
// ===========================

export interface PathsState {
  showNavBar: boolean;
  showFooter: boolean;
  showLogoOnly: boolean;
  currentPath: string;
}

export interface PublicationCardProps {
  post: Publication;
  onImageClick: (src: string) => void;
  onClickComent?: () => void;
  onPostDelete?: (postId: string) => void;
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
