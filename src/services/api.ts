import axios from "axios";
import { IS_LOCAL_AUTH_ENABLED, LOCAL_AUTH_EMAIL, LOCAL_AUTH_ROLE } from "../config/api";
import { apiRoutes, getToken, isUserAuthenticated } from "../utils/GlobalVariables";
import { normalizeRole } from "../domain/roles";
import type {
  Appeal,
  AppealStatus,
  Category,
  CommentData,
  ConversationSummary,
  CreateCommentResponse,
  CreatePublicationPayload,
  CreatePublicationResponse,
  CreateUserPayload,
  CreatorDashboard,
  Follow,
  MediaKind,
  MessagesSettings,
  Notification,
  NotificationsResponse,
  NotificationsSettings,
  PaginatedResponse,
  PrivateMessage,
  Publication,
  PublicationApprovalStatus,
  PublicationFilters,
  PublicationViewResponse,
  PublicationsListResponse,
  Rating,
  RatingTargetType,
  Report,
  ReportStatus,
  ReportTargetType,
  Sanction,
  SanctionStatus,
  SanctionType,
  UpdateUserPayload,
  UploadContext,
  UserSummary,
} from "../types";

export { normalizeRole } from "../domain/roles";
import { useUserData } from "../utils/UserStore";

type RawRecord = Record<string, unknown>;

const apiClient = axios.create({
  timeout: 15000,
});

const isExpectedAuthErrorMessage = (message: unknown) =>
  /^(No autorizado|Usuario no encontrado|Unauthorized)$/i.test(String(message));

const buildAuthRequiredError = () => {
  const error = new Error("Unauthorized") as Error & { status?: number };
  error.status = 401;
  return error;
};

const requireAuthToken = async () => {
  const token = await getToken();
  if (!token && !IS_LOCAL_AUTH_ENABLED) throw buildAuthRequiredError();
  return token;
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (IS_LOCAL_AUTH_ENABLED && LOCAL_AUTH_EMAIL) {
      config.headers["X-Local-User-Email"] = LOCAL_AUTH_EMAIL;
      const currentRole = useUserData.getState().role || LOCAL_AUTH_ROLE;
      if (currentRole) config.headers["X-Local-User-Role"] = currentRole;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || "Error desconocido";
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const isExpectedAuthStateError = [401, 404].includes(status) && isExpectedAuthErrorMessage(message);
    const isIgnoredSilentRoute =
      url.includes("/notifications/settings") ||
      url.includes("/admin/notifications/settings") ||
      url.includes("/admin/publications");

    if (!isExpectedAuthStateError && !isIgnoredSilentRoute) {
      console.error("[API Error]:", message);
    }

    const apiError = new Error(message) as Error & { status?: number };
    apiError.status = status;
    return Promise.reject(apiError);
  }
);

const asRecord = (value: unknown): RawRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const firstValue = (...values: unknown[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const asString = (value: unknown, fallback = ""): string => {
  const resolved = firstValue(value);
  return resolved === undefined ? fallback : String(resolved);
};

const asNullableString = (value: unknown): string | null => {
  const resolved = firstValue(value);
  return resolved === undefined ? null : String(resolved);
};

const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asNullableNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return fallback;
};

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const usernameFromEmail = (email: string): string => {
  const localPart = email.split("@")[0]?.trim();
  return localPart || email || "Usuario";
};

const normalizeFormat = (value: unknown): Publication["format"] => {
  const format = String(value || "").trim();
  return ["video", "image", "article", "mixed"].includes(format)
    ? (format as Publication["format"])
    : undefined;
};

const normalizeStatus = (value: unknown): Publication["status"] => {
  const status = String(value || "").trim();
  return ["active", "hidden", "reported", "deleted"].includes(status)
    ? (status as Publication["status"])
    : undefined;
};

const cleanMediaUrl = (url: string | null): string | null => {
  if (!url) return null;
  const isProd = import.meta.env.PROD || (typeof window !== "undefined" && !window.location.hostname.includes("localhost"));
  if (isProd) {
    return url.replace(
      /^https?:\/\/(?:127\.0\.0\.1|localhost):4569\/[^/]+\//,
      "https://skillswap-media-storage-prod.s3.amazonaws.com/"
    );
  }
  return url.replace(/([^:]\/)\/+/g, "$1");
};

const mapUser = (input: unknown): UserSummary => {
  const raw = asRecord(input);
  const email = asString(firstValue(raw.email, raw.Correo_electronico, raw.correo));
  const username = asString(
    firstValue(
      raw.username,
      raw.name,
      raw.nombre_usuario,
      raw.Nombre_usuario,
      raw.authorUsername,
      raw.creatorUsername,
      raw.creatorName,
      raw.userName
    ),
    email ? usernameFromEmail(email) : "Usuario"
  );
  const profilePicUrl = cleanMediaUrl(asNullableString(
    firstValue(
      raw.profilePicture,
      raw.profilePicUrl,
      raw.authorProfilePicture,
      raw.authorProfilePicUrl,
      raw.creatorProfilePicture,
      raw.creatorProfilePicUrl,
      raw.avatarUrl,
      raw.Url_foto_perfil,
      raw.url_foto_perfil,
      raw.foto_perfil
    )
  ));

  return {
    email,
    username,
    profilePicUrl,
    profilePicture: profilePicUrl,
    coverPicture: cleanMediaUrl(asNullableString(raw.coverPicture)),
    role: normalizeRole(raw.role, raw.isBanned),
    bio: asString(raw.bio),
    location: asNullableString(raw.location),
    interests: asStringArray(raw.interests),
    specialty: asNullableString(
      firstValue(
        raw.specialty,
        raw.expertise,
        raw.areaEspecialidad,
        raw.area_especialidad,
        raw.Area_especialidad
      )
    ),
    followersCount: asNumber(raw.followersCount),
    followingCount: asNumber(raw.followingCount),
    ratingAvg: asNumber(raw.ratingAvg),
    ratingCount: asNumber(raw.ratingCount),
    userRating: asNullableNumber(firstValue(raw.userRating, raw.myRating, raw.currentUserRating)),
    isBanned: asBoolean(raw.isBanned),
    isVerified: asBoolean(firstValue(raw.isVerified, raw.verified, raw.Verificado)),
    isFollowed: asBoolean(firstValue(raw.isFollowed, raw.isFollowing, raw.following)),
    activeSanctions: raw.activeSanctions ? asArray(raw.activeSanctions).map(mapSanction) : undefined,
  };
};

const mapCategory = (input: unknown): Category => {
  const raw = asRecord(input);
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    description: asString(raw.description),
    isActive: raw.isActive === undefined ? true : asBoolean(raw.isActive),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
};

const mapCategoryMutationResponse = (data: unknown): Category => {
  const raw = asRecord(data);
  return mapCategory(firstValue(raw.category, raw.categoria, raw));
};

const mapComment = (input: unknown): CommentData => {
  const raw = asRecord(input);
  const userSource = firstValue(raw.user, raw.Usuario, raw.usuario);

  return {
    id: asString(firstValue(raw.id, raw.id_comentario)),
    publicationId: asString(raw.publicationId),
    content: asString(firstValue(raw.content, raw.contenido)),
    status: asString(raw.status) as CommentData["status"],
    createdAt: asString(firstValue(raw.createdAt, raw.fecha_comentario)),
    updatedAt: asString(raw.updatedAt),
    canDelete: asBoolean(firstValue(raw.canDelete, raw.Can_delete)),
    canUpdate: asBoolean(firstValue(raw.canUpdate, raw.Can_update)),
    user: userSource ? mapUser(userSource) : undefined,
    likesCount: asNumber(raw.likesCount, 0),
    dislikesCount: asNumber(raw.dislikesCount, 0),
    repliesCount: asNumber(raw.repliesCount, 0),
    isLiked: asBoolean(raw.isLiked, false),
    isDisliked: asBoolean(raw.isDisliked, false),
    parentId: asNullableString(raw.parentId),
  };
};

const mapPublication = (input: unknown): Publication => {
  const raw = asRecord(input);
  const userSource = firstValue(raw.user, raw.author, raw.Usuario, raw.usuario);
  const comments = asRecord(firstValue(raw.comments, raw.comentarios));
  const likes = asRecord(raw.likes);
  const compartidos = asRecord(raw.compartidos);
  const category = asRecord(raw.category);
  const userEmail = asString(
    firstValue(
      raw.userEmail,
      raw.creatorEmail,
      raw.authorEmail,
      raw.email,
      raw.Correo_electronico,
      raw.correo
    )
  );
  const creatorEmail = asString(
    firstValue(
      raw.creatorEmail,
      raw.userEmail,
      raw.authorEmail,
      raw.email,
      raw.Correo_electronico,
      raw.correo
    )
  );
  const authorId = asString(firstValue(raw.authorId, raw.userId, raw.creatorId, creatorEmail, userEmail));
  const authorEmail = asString(firstValue(raw.authorEmail, creatorEmail, userEmail));
  const authorUsername = asString(
    firstValue(
      raw.authorUsername,
      raw.authorName,
      raw.creatorUsername,
      raw.creatorName,
      raw.userName,
      raw.username,
      raw.nombre_usuario,
      raw.Nombre_usuario
    )
  );
  const authorProfilePicture = cleanMediaUrl(asNullableString(
    firstValue(
      raw.authorProfilePicture,
      raw.authorProfilePicUrl,
      raw.creatorProfilePicture,
      raw.creatorProfilePicUrl,
      raw.profilePicture,
      raw.profilePicUrl,
      raw.avatarUrl,
      raw.Url_foto_perfil,
      raw.url_foto_perfil,
      raw.foto_perfil
    )
  ));
  const fallbackUserSource =
    userSource ??
    (creatorEmail || userEmail
      ? {
          email: authorEmail || creatorEmail || userEmail,
          username: authorUsername,
          profilePicture: authorProfilePicture,
          role: firstValue(raw.creatorRole, raw.userRole, raw.role),
        }
      : undefined);

  return {
    id: asString(firstValue(raw.id, raw.Id_publicacion)),
    title: asString(firstValue(raw.title, raw.Titulo)),
    content: asString(firstValue(raw.content, raw.Contenido)),
    categoryId: asString(firstValue(raw.categoryId, raw.Id_categoria, raw.id_categoria)),
    categoryName: asString(firstValue(raw.categoryName, category.name, raw.Categoria, raw.categoria)),
    format: normalizeFormat(firstValue(raw.format, raw.Formato)),
    tags: asStringArray(firstValue(raw.tags, raw.Etiquetas)),
    status: normalizeStatus(firstValue(raw.status, raw.Estado)),
    approvalStatus: (asString(raw.approvalStatus) as PublicationApprovalStatus) || undefined,
    rejectionReason: asNullableString(raw.rejectionReason),
    reviewedBy: asNullableString(raw.reviewedBy),
    reviewedAt: asNullableString(raw.reviewedAt),
    imageUrl: cleanMediaUrl(asNullableString(firstValue(raw.imageUrl, raw.Url_imagen))),
    videoUrl: cleanMediaUrl(asNullableString(firstValue(raw.videoUrl, raw.Url_video))),
    lat: asNullableNumber(firstValue(raw.lat, raw.Lat)),
    long: asNullableNumber(firstValue(raw.long, raw.Long)),
    createdAt: asString(firstValue(raw.createdAt, raw.Fecha_publicacion)),
    updatedAt: asString(firstValue(raw.updatedAt, raw.Fecha_actualizacion)),
    userEmail,
    creatorEmail,
    authorId,
    authorEmail,
    authorUsername,
    authorProfilePicture,
    user: fallbackUserSource ? mapUser(fallbackUserSource) : undefined,
    likesCount: asNumber(firstValue(raw.likesCount, likes.total)),
    dislikesCount: asNumber(firstValue(raw.dislikesCount, raw.DislikesCount, raw.dislikes, 0)),
    sharesCount: asNumber(firstValue(raw.sharesCount, compartidos.total)),
    commentsCount: asNumber(firstValue(raw.commentsCount, comments.total)),
    savedCount: asNumber(raw.savedCount),
    viewsCount: asNumber(raw.viewsCount),
    ratingAvg: asNumber(raw.ratingAvg),
    ratingCount: asNumber(raw.ratingCount),
    userRating: asNullableNumber(firstValue(raw.userRating, raw.myRating, raw.currentUserRating)),
    isLiked: asBoolean(firstValue(raw.isLiked, raw.is_Liked, raw.Is_Liked, raw.is_liked)),
    isDisliked: asBoolean(
      firstValue(raw.isDisliked, raw.is_Disliked, raw.Is_Disliked, raw.is_disliked, false)
    ),
    isSaved: asBoolean(raw.isSaved),
    isFollowingCreator: asBoolean(firstValue(raw.isFollowingCreator, raw.isFollowing, raw.followingCreator)),
    canDelete: asBoolean(firstValue(raw.canDelete, raw.Can_delete)),
    canUpdate: asBoolean(firstValue(raw.canUpdate, raw.Can_update)),
    comments: {
      total: asNumber(firstValue(raw.commentsCount, comments.total)),
      list: asArray(firstValue(comments.list, comments.lista)).map(mapComment),
    },
  };
};

const mapNotification = (input: unknown): Notification => {
  const raw = asRecord(input);
  const userSource = firstValue(raw.user, raw.usuario);
  const targetType = asString(raw.targetType) as Notification["targetType"];
  const targetId = asString(raw.targetId);
  const publicationId = asString(
    firstValue(raw.publicationId, raw.id_publicacion, targetType === "publication" ? targetId : undefined)
  );

  return {
    id: asString(firstValue(raw.id, raw.id_notificacion)),
    message: asString(firstValue(raw.message, raw.mensaje)),
    publicationId,
    targetType,
    targetId,
    type: asString(raw.type),
    user: userSource ? mapUser(userSource) : undefined,
    read: asBoolean(firstValue(raw.read, raw.isRead)),
    isRead: asBoolean(firstValue(raw.isRead, raw.read)),
    createdAt: asString(firstValue(raw.createdAt, raw.fecha_creacion), new Date().toISOString()),
  };
};

const mapRating = (input: unknown): Rating => {
  const raw = asRecord(input);
  return {
    targetKey: asString(raw.targetKey),
    targetType: asString(raw.targetType) as RatingTargetType,
    targetId: asString(raw.targetId),
    email: asString(raw.email),
    rating: asNumber(raw.rating),
    comment: asString(raw.comment),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
};

const mapReport = (input: unknown): Report => {
  const raw = asRecord(input);
  return {
    id: asString(raw.id),
    targetType: asString(raw.targetType) as ReportTargetType,
    targetId: asString(raw.targetId),
    reporterEmail: asString(raw.reporterEmail),
    reason: asString(raw.reason),
    description: asString(raw.description),
    status: asString(raw.status) as ReportStatus,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    reviewedBy: asNullableString(raw.reviewedBy),
    reviewedAt: asNullableString(raw.reviewedAt),
    reviewNotes: asString(raw.reviewNotes),
    reportedUser: raw.reportedUser ? {
      username: asString(asRecord(raw.reportedUser).username),
      name: asString(asRecord(raw.reportedUser).name),
      email: asString(asRecord(raw.reportedUser).email),
    } : undefined,
  };
};

const mapSanction = (input: unknown): Sanction => {
  const raw = asRecord(input);
  return {
    id: asString(raw.id),
    userEmail: asString(firstValue(raw.userEmail, raw.email)),
    type: asString(raw.type) as SanctionType,
    reason: asString(raw.reason),
    description: asString(raw.description),
    status: asString(raw.status) as SanctionStatus,
    startsAt: asString(raw.startsAt),
    endsAt: asNullableString(raw.endsAt),
    createdBy: asString(raw.createdBy),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    liftedBy: asNullableString(raw.liftedBy),
    liftedAt: asNullableString(raw.liftedAt),
    reportId: asNullableString(raw.reportId),
    publicationId: asNullableString(raw.publicationId),
  };
};

const mapAppeal = (input: unknown): Appeal => {
  const raw = asRecord(input);
  return {
    id: asString(raw.id),
    sanctionId: asString(raw.sanctionId),
    userEmail: asString(firstValue(raw.userEmail, raw.email)),
    userName: asString(raw.userName),
    publicationId: asNullableString(raw.publicationId),
    publicationTitle: asNullableString(raw.publicationTitle),
    publicationContent: asNullableString(firstValue(raw.publicationContent, raw.content)),
    publicationVideoUrl: cleanMediaUrl(
      asNullableString(
        firstValue(
          raw.publicationVideoUrl,
          raw.videoUrl,
          raw.sanctionedVideoUrl,
          raw.publication_video_url,
          raw.video_url
        )
      )
    ),
    publicationFormat: asNullableString(raw.publicationFormat),
    sanctionReason: asString(raw.sanctionReason),
    sanctionType: asString(raw.sanctionType) as SanctionType,
    sanctionCreatedAt: asString(raw.sanctionCreatedAt),
    userExplanation: asString(raw.userExplanation),
    evidenceUrl: asNullableString(raw.evidenceUrl),
    evidenceType: asNullableString(raw.evidenceType) as Appeal["evidenceType"],
    status: asString(raw.status, "pending") as AppealStatus,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    reviewedBy: asNullableString(raw.reviewedBy),
    reviewedAt: asNullableString(raw.reviewedAt),
    decisionReason: asNullableString(raw.decisionReason),
    adminNote: asNullableString(raw.adminNote),
  };
};

const mapPrivateMessage = (input: unknown): PrivateMessage => {
  const raw = asRecord(input);
  return {
    id: asString(raw.id),
    threadKey: asString(raw.threadKey),
    messageKey: asString(raw.messageKey),
    senderEmail: asString(raw.senderEmail),
    recipientEmail: asString(raw.recipientEmail),
    content: asString(raw.content),
    sentAt: asString(raw.sentAt),
    readAt: asNullableString(raw.readAt),
    status: asString(raw.status, "sent") as PrivateMessage["status"],
  };
};

const mapConversation = (input: unknown): ConversationSummary => {
  const raw = asRecord(input);
  const otherUserRaw = firstValue(raw.otherUser, raw.user, raw.usuario);
  const otherUser = otherUserRaw ? mapUser(otherUserRaw) : undefined;
  const otherProfilePicture = asNullableString(
    firstValue(
      raw.otherProfilePicture,
      raw.otherProfilePicUrl,
      raw.profilePicture,
      raw.profilePicUrl,
      raw.avatarUrl,
      otherUser?.profilePicture,
      otherUser?.profilePicUrl
    )
  );

  return {
    threadKey: asString(raw.threadKey),
    otherEmail: asString(firstValue(raw.otherEmail, otherUser?.email)),
    otherName: asString(firstValue(raw.otherName, raw.name, raw.username, otherUser?.username)),
    otherUsername: asString(firstValue(raw.otherUsername, raw.username, otherUser?.username)),
    otherProfilePicture,
    otherProfilePicUrl: otherProfilePicture,
    otherUser,
    isOnline:
      raw.isOnline === undefined && raw.online === undefined
        ? undefined
        : asBoolean(firstValue(raw.isOnline, raw.online)),
    lastActiveAt: asNullableString(
      firstValue(raw.lastActiveAt, raw.lastSeenAt, raw.lastConnectionAt, raw.lastOnlineAt)
    ),
    presenceStatus: asString(firstValue(raw.presenceStatus, raw.statusText)),
    lastMessage: asString(raw.lastMessage),
    lastMessageAt: asString(raw.lastMessageAt),
    lastMessageId: asString(raw.lastMessageId),
    unreadCount: asNumber(raw.unreadCount),
  };
};

const mapFollow = (input: unknown): Follow => {
  const raw = asRecord(input);
  const followerRaw = firstValue(raw.follower, raw.followerUser);
  const creatorRaw = firstValue(raw.creator, raw.creatorUser);
  const userRaw = firstValue(raw.user, raw.usuario);

  return {
    followerEmail: asString(firstValue(raw.followerEmail, asRecord(followerRaw).email)),
    creatorEmail: asString(firstValue(raw.creatorEmail, asRecord(creatorRaw).email)),
    createdAt: asString(raw.createdAt),
    follower: followerRaw ? mapUser(followerRaw) : undefined,
    creator: creatorRaw ? mapUser(creatorRaw) : undefined,
    user: userRaw ? mapUser(userRaw) : undefined,
  };
};

const mapMessagesSettings = (input: unknown): MessagesSettings => {
  const raw = asRecord(input);
  return {
    messagesEnabled: asBoolean(firstValue(raw.messagesEnabled, raw.enabled), false),
    updatedAt: asNullableString(raw.updatedAt),
    updatedBy: asNullableString(raw.updatedBy),
  };
};

const NOTIFICATION_SETTINGS_STORAGE_KEY = "skillswap_notifications_settings";

const getLocalNotificationSettings = (): NotificationsSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null && "notificationsEnabled" in parsed) {
        return { notificationsEnabled: Boolean(parsed.notificationsEnabled) };
      }
    }
  } catch {
    // fallback
  }
  return { notificationsEnabled: true };
};

const setLocalNotificationSettings = (notificationsEnabled: boolean): NotificationsSettings => {
  const settings = { notificationsEnabled };
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // fallback
  }
  return settings;
};

const mapDashboardPublicationBase = (input: unknown) => {
  const raw = asRecord(input);
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    categoryId: asString(raw.categoryId),
    createdAt: asString(raw.createdAt),
  };
};

const mapCreatorDashboard = (input: unknown): CreatorDashboard => {
  const raw = asRecord(input);
  const creator = asRecord(raw.creator);
  const totals = asRecord(raw.totals);
  const topPublications = asRecord(raw.topPublications);

  return {
    creator: {
      email: asString(creator.email),
      username: asString(creator.username, "Creador"),
      followersCount: asNumber(creator.followersCount),
      ratingAvg: asNumber(creator.ratingAvg),
      ratingCount: asNumber(creator.ratingCount),
    },
    totals: {
      publications: asNumber(totals.publications),
      views: asNumber(totals.views),
      likes: asNumber(totals.likes),
      comments: asNumber(totals.comments),
      shares: asNumber(totals.shares),
      saved: asNumber(totals.saved),
      ratingAvg: asNumber(totals.ratingAvg),
      ratingCount: asNumber(totals.ratingCount),
    },
    topPublications: {
      byViews: asArray(topPublications.byViews).map((item) => {
        const rawItem = asRecord(item);
        return {
          ...mapDashboardPublicationBase(item),
          viewsCount: asNumber(rawItem.viewsCount),
        };
      }),
      byRating: asArray(topPublications.byRating).map((item) => {
        const rawItem = asRecord(item);
        return {
          ...mapDashboardPublicationBase(item),
          ratingAvg: asNumber(rawItem.ratingAvg),
        };
      }),
      bySaved: asArray(topPublications.bySaved).map((item) => {
        const rawItem = asRecord(item);
        return {
          ...mapDashboardPublicationBase(item),
          savedCount: asNumber(rawItem.savedCount),
        };
      }),
    },
  };
};

const mapPaginatedPublications = (data: RawRecord): PaginatedResponse<Publication> => {
  const rawItems = asArray(firstValue(data.items, data.publicaciones));
  const nextToken = asNullableString(data.nextToken);
  return {
    items: rawItems.map(mapPublication),
    hasMore: Boolean(nextToken),
    nextToken,
  };
};

const mediaKindFromFile = (fileType: string, type?: MediaKind | UploadContext): MediaKind => {
  if (type === "image" || type === "video") return type;
  if (fileType.startsWith("video/")) return "video";
  return "image";
};

const buildFilterParams = (filters: PublicationFilters = {}) => {
  const params: Record<string, string> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      const joined = value
        .map((item) => String(item).trim())
        .filter(Boolean)
        .join(",");
      if (joined) params[key] = joined;
      return;
    }

    const normalized = String(value).trim();
    if (normalized) params[key] = normalized;
  });

  return params;
};

export const api = {
  categories: {
    list: async (includeInactive = false): Promise<Category[]> => {
      const res = await apiClient.get(apiRoutes.list_categories_url, {
        params: { includeInactive: String(includeInactive) },
      });
      return asArray(asRecord(res.data).categories).map(mapCategory);
    },
    create: async (payload: Partial<Category>): Promise<Category> => {
      const res = await apiClient.post(apiRoutes.create_category_url, payload);
      return mapCategoryMutationResponse(res.data);
    },
    update: async (id: string, payload: Partial<Category>): Promise<Category> => {
      const res = await apiClient.put(apiRoutes.update_category_url(id), payload);
      return mapCategoryMutationResponse(res.data);
    },
    delete: (id: string) => apiClient.delete(apiRoutes.delete_category_url(id)),
  },

  specialties: {
    list: async (): Promise<{ id: string; name: string }[]> => {
      const res = await apiClient.get(apiRoutes.list_specialties_url);
      const data = asRecord(res.data);
      return asArray(data.specialties).map((item) => {
        const raw = asRecord(item);
        return { id: asString(raw.id), name: asString(raw.name) };
      });
    },
  },

  publications: {
    list: async (limit: number = 10, nextToken?: string | null): Promise<PublicationsListResponse> => {
      const isAuth = await isUserAuthenticated();
      const url = isAuth ? apiRoutes.list_publications_user_auth_url : apiRoutes.list_publications_url;
      const res = await apiClient.get(url, { params: { limit, nextToken } });
      const data = asRecord(res.data);
      const result = mapPaginatedPublications(data);
      return {
        ...result,
        sort: asString(data.sort),
      };
    },

    listFiltered: async (
      filters: PublicationFilters = {},
      limit: number = 20,
      nextToken?: string | null
    ): Promise<PublicationsListResponse> => {
      const isAuth = await isUserAuthenticated();
      const url = isAuth ? apiRoutes.list_publications_user_auth_url : apiRoutes.list_publications_url;
      const res = await apiClient.get(url, {
        params: { ...buildFilterParams(filters), limit, nextToken },
      });
      const data = asRecord(res.data);
      const result = mapPaginatedPublications(data);
      return {
        ...result,
        sort: asString(data.sort),
      };
    },

    create: async (
      payload: CreatePublicationPayload | Partial<Publication>
    ): Promise<CreatePublicationResponse> => {
      const suggestedCategory = "suggestedCategory" in payload ? payload.suggestedCategory : undefined;
      const res = await apiClient.post(apiRoutes.create_publication_url, {
        title: payload.title,
        content: payload.content,
        categoryId: payload.categoryId,
        suggestedCategory,
        format: payload.format,
        tags: payload.tags,
        videoUrl: payload.videoUrl,
      });
      const data = asRecord(res.data);

      // Business Rule: Automatically activate category (isActive: true) and count publication when a video/post is created
      if (payload.categoryId) {
        try {
          void apiClient.put(apiRoutes.update_category_url(payload.categoryId), {
            isActive: true,
          }).catch(() => null);
        } catch {
          // Non-blocking fallback
        }
      }

      return {
        message: asString(data.message),
        publication: data.publication ? mapPublication(data.publication) : undefined,
        user: data.user ? mapUser(data.user) : undefined,
      };
    },

    delete: (id: string) => apiClient.post(apiRoutes.delete_publication_url, { id }),

    edit: (id: string, payload: CreatePublicationPayload | Partial<Publication>) =>
      apiClient.post(apiRoutes.edit_publication_url, {
        id,
        title: payload.title,
        content: payload.content,
        categoryId: payload.categoryId,
        format: payload.format,
        tags: payload.tags,
        videoUrl: payload.videoUrl,
        status: payload.status,
      }),

    get: async (id: string): Promise<Publication> => {
      const isAuth = await isUserAuthenticated();
      const url = isAuth ? apiRoutes.list_publication_user_auth_url : apiRoutes.list_publication_url;
      const res = await apiClient.get(url, { params: { id } });
      return mapPublication(res.data);
    },

    listByUser: async (
      email: string,
      limit: number = 10,
      nextToken?: string | null
    ): Promise<PublicationsListResponse> => {
      const isAuth = await isUserAuthenticated();
      const url = isAuth
        ? apiRoutes.list_user_publications_user_auth_url
        : apiRoutes.list_user_publications_url;
      const res = await apiClient.post(url, { email }, { params: { limit, nextToken } });
      const data = asRecord(res.data);
      const result = mapPaginatedPublications(data);
      const userProfile = firstValue(data.user, data.usuario);

      return {
        ...result,
        userProfile: userProfile ? mapUser(userProfile) : undefined,
      };
    },

    save: (publicationId: string) => apiClient.post(apiRoutes.save_publication_url, { publicationId }),
    unsave: (publicationId: string) => apiClient.post(apiRoutes.unsave_publication_url, { publicationId }),
    recordView: async (publicationId: string): Promise<PublicationViewResponse> => {
      const res = await apiClient.post(apiRoutes.record_publication_view_url, { publicationId });
      const data = asRecord(res.data);
      return {
        message: asString(data.message),
        counted: asBoolean(data.counted),
        viewsCount: data.viewsCount === undefined ? undefined : asNumber(data.viewsCount),
      };
    },
    listSaved: async (
      limit: number = 20,
      nextToken?: string | null
    ): Promise<PaginatedResponse<Publication>> => {
      const res = await apiClient.get(apiRoutes.saved_publications_url, { params: { limit, nextToken } });
      return mapPaginatedPublications(asRecord(res.data));
    },
  },

  comments: {
    list: async (
      publicationId: string,
      limit: number = 20,
      nextToken?: string | null,
      sort: string = "relevant"
    ): Promise<PaginatedResponse<CommentData>> => {
      const res = await apiClient.get(apiRoutes.list_comments_url, {
        params: { publicationId, limit, nextToken, sort },
      });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        items: asArray(data.items).map(mapComment),
        hasMore: Boolean(next),
        nextToken: next,
      };
    },
    create: async (publicationId: string, content: string, parentId?: string): Promise<CreateCommentResponse> => {
      const res = await apiClient.post(apiRoutes.comment_publication_url, {
        publicationId,
        content,
        parentId,
      });
      const data = asRecord(res.data);
      const comment = asRecord(data.comment);
      return { id: asString(firstValue(data.id, comment.id)) };
    },
    delete: (id: string) => apiClient.post(apiRoutes.delete_comment_url, { id }),
    edit: (id: string, content: string) => apiClient.post(apiRoutes.edit_comment_url, { id, content }),
    like: (id: string) => apiClient.post(apiRoutes.like_comment_url, { targetId: id }),
    unlike: (id: string) => apiClient.post(apiRoutes.unlike_comment_url, { targetId: id }),
    dislike: (id: string) => apiClient.post(apiRoutes.dislike_comment_url, { targetId: id }),
    undislike: (id: string) => apiClient.post(apiRoutes.undislike_comment_url, { targetId: id }),
  },

  social: {
    like: (id: string) => apiClient.post(apiRoutes.like_publications_url, { targetId: id }),
    unlike: (id: string) => apiClient.post(apiRoutes.unlike_publications_url, { targetId: id }),
    dislike: (id: string) => apiClient.post(apiRoutes.dislike_publications_url, { targetId: id }),
    undislike: (id: string) => apiClient.post(apiRoutes.undislike_publications_url, { targetId: id }),
    share: async (id: string) => {
      await requireAuthToken();
      return apiClient.post(apiRoutes.share_publication_url, { targetId: id, publicationId: id, id });
    },
    followCreator: (creatorEmail: string) => apiClient.post(apiRoutes.follow_creator_url, { creatorEmail }),
    unfollowCreator: (creatorEmail: string) =>
      apiClient.post(apiRoutes.unfollow_creator_url, { creatorEmail }),
    listFollowers: async (
      creatorEmail?: string,
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ followers: Follow[]; nextToken: string | null; hasMore: boolean }> => {
      const url = creatorEmail
        ? apiRoutes.creator_followers_url(creatorEmail)
        : apiRoutes.creator_me_followers_url;
      const res = await apiClient.get(url, {
        params: { limit, nextToken },
      });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        followers: asArray(firstValue(data.followers, data.items)).map(mapFollow),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    listFollowing: async (
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ following: Follow[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.user_following_url, { params: { limit, nextToken } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        following: asArray(data.following).map(mapFollow),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
  },

  ratings: {
    create: async (payload: {
      targetType: RatingTargetType;
      targetId: string;
      rating: number;
      comment?: string;
    }): Promise<{
      message: string;
      rating?: Rating;
      summary?: { ratingAvg: number; ratingCount: number };
    }> => {
      const res = await apiClient.post(apiRoutes.create_rating_url, payload);
      const data = asRecord(res.data);
      const summary = asRecord(data.summary);

      return {
        message: asString(data.message),
        rating: data.rating ? mapRating(data.rating) : undefined,
        summary: data.summary
          ? {
              ratingAvg: asNumber(summary.ratingAvg),
              ratingCount: asNumber(summary.ratingCount),
            }
          : undefined,
      };
    },
    listPublication: async (
      id: string,
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ ratings: Rating[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.publication_ratings_url(id), {
        params: { limit, nextToken },
      });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        ratings: asArray(data.ratings).map(mapRating),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    listCreator: async (
      email: string,
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ ratings: Rating[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.creator_ratings_url(email), { params: { limit, nextToken } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        ratings: asArray(data.ratings).map(mapRating),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
  },

  reports: {
    create: async (payload: {
      targetType: ReportTargetType;
      targetId: string;
      reason: string;
      description?: string;
    }): Promise<Report> => {
      const res = await apiClient.post(apiRoutes.create_report_url, payload);
      const data = asRecord(res.data);
      return mapReport(firstValue(data.report, data));
    },
  },

  notifications: {
    list: async (
      limit: number = 20,
      nextToken?: string | null
    ): Promise<NotificationsResponse & { hasMore: boolean; nextToken: string | null }> => {
      await requireAuthToken();
      const res = await apiClient.get(apiRoutes.messages_account_url, { params: { limit, nextToken } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        notifications: asArray(data.notifications).map(mapNotification),
        hasMore: Boolean(next),
        nextToken: next,
      };
    },
    read: async (id: string) => {
      await requireAuthToken();
      return apiClient.post(apiRoutes.read_notification_url, { id });
    },
    deleteAll: async () => {
      await requireAuthToken();
      return apiClient.post(apiRoutes.delete_all_notifications_url, {});
    },
    getSettings: async (): Promise<NotificationsSettings> => {
      return getLocalNotificationSettings();
    },
    updateSettings: async (notificationsEnabled: boolean): Promise<NotificationsSettings> => {
      return setLocalNotificationSettings(notificationsEnabled);
    },
  },

  messages: {
    getSettings: async (): Promise<MessagesSettings> => {
      const res = await apiClient.get(apiRoutes.messages_settings_url);
      const data = asRecord(res.data);
      return mapMessagesSettings(firstValue(data.messages, data));
    },
    send: async (recipientEmail: string, content: string): Promise<PrivateMessage> => {
      const res = await apiClient.post(apiRoutes.send_message_url, { recipientEmail, content });
      const data = asRecord(res.data);
      return mapPrivateMessage(firstValue(data.privateMessage, data));
    },
    listConversations: async (
      limit: number = 20
    ): Promise<{ conversations: ConversationSummary[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.message_conversations_url, { params: { limit } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        conversations: asArray(data.conversations).map(mapConversation),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    listThread: async (
      email: string,
      limit: number = 50,
      nextToken?: string | null
    ): Promise<{
      threadKey: string;
      messages: PrivateMessage[];
      nextToken: string | null;
      hasMore: boolean;
    }> => {
      const res = await apiClient.get(apiRoutes.message_thread_url(email), { params: { limit, nextToken } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        threadKey: asString(data.threadKey),
        messages: asArray(data.messages).map(mapPrivateMessage),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    markRead: (id: string) => apiClient.post(apiRoutes.read_message_url(id), {}),
    delete: (id: string) => apiClient.delete(apiRoutes.delete_message_url(id)),
  },

  users: {
    create: (payload: CreateUserPayload) =>
      apiClient.post(apiRoutes.create_user_url, {
        email: payload.email,
        username: payload.username,
        role: payload.role,
        bio: payload.bio,
        profilePicture: payload.profilePicture ?? payload.profilePicUrl,
        coverPicture: payload.coverPicture,
        location: payload.location,
        interests: payload.interests,
        specialty: payload.specialty,
      }),
    becomeCreator: async (): Promise<UserSummary> => {
      const res = await apiClient.post(apiRoutes.become_creator_url, {});
      const data = asRecord(res.data);
      return mapUser(firstValue(data.user, data));
    },
    update: (payload: UpdateUserPayload) =>
      apiClient.post(apiRoutes.update_user_url, {
        username: payload.username,
        profilePicture: payload.profilePicture ?? payload.profilePicUrl,
        coverPicture: payload.coverPicture,
        bio: payload.bio,
        location: payload.location,
        interests: payload.interests,
        specialty: payload.specialty,
      }),
    delete: () => apiClient.post(apiRoutes.delete_account_url, {}),
    updateFcmToken: (fcmToken: string) => apiClient.post(apiRoutes.update_fcm_token_url, { fcmToken }),
  },

  media: {
    getPresignedUrl: async (
      fileName: string,
      fileType: string,
      type?: MediaKind | UploadContext,
      fileSize?: number
    ): Promise<{ uploadUrl: string; fileUrl: string; contentType?: string }> => {
      const parts = fileName.split(".");
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
      const name = parts.join(".");
      const cleanName = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
      const sanitized = (cleanName || "media_file") + (ext ? `.${ext}` : "");

      const res = await apiClient.post(apiRoutes.push_resouce_url, {
        fileName: sanitized,
        fileType,
        fileSize,
        type: mediaKindFromFile(fileType, type),
        context: type,
      });
      return res.data;
    },
  },

  search: {
    list: async (
      queryOrFilters: string | PublicationFilters,
      limit: number = 20,
      nextToken?: string | null
    ): Promise<PaginatedResponse<Publication>> => {
      const isAuth = await isUserAuthenticated();
      const url = isAuth ? apiRoutes.search_resources_user_auth_url : apiRoutes.search_resources_url;
      const filters = typeof queryOrFilters === "string" ? { q: queryOrFilters } : queryOrFilters;
      const res = await apiClient.get(url, {
        params: { ...buildFilterParams(filters), limit, nextToken },
      });
      return mapPaginatedPublications(asRecord(res.data));
    },
  },

  creatorDashboard: {
    get: async (): Promise<CreatorDashboard> => {
      const res = await apiClient.get(apiRoutes.creator_dashboard_url);
      const data = asRecord(res.data);
      return mapCreatorDashboard(firstValue(data.dashboard, data));
    },
  },

  appeals: {
    create: async (payload: {
      sanctionId: string;
      userExplanation: string;
      evidenceUrl?: string | null;
      evidenceType?: string | null;
    }): Promise<{ message: string; appeal: Appeal }> => {
      await requireAuthToken();
      const res = await apiClient.post(apiRoutes.create_appeal_url, payload);
      const data = asRecord(res.data);
      return {
        message: asString(data.message, "Apelación enviada exitosamente"),
        appeal: mapAppeal(firstValue(data.appeal, data)),
      };
    },
    listMine: async (): Promise<Appeal[]> => {
      try {
        await requireAuthToken();
        const res = await apiClient.get(apiRoutes.user_appeals_url);
        const data = asRecord(res.data);
        return asArray(data.appeals).map(mapAppeal);
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 401 || status === 403) {
          return [];
        }
        console.error("Error al obtener apelaciones del usuario:", error);
        return [];
      }
    },
    getBySanction: async (sanctionId: string): Promise<{ appeal: Appeal | null }> => {
      try {
        await requireAuthToken();
        const res = await apiClient.get(apiRoutes.sanction_appeals_url(sanctionId));
        const data = asRecord(res.data);
        const appealItem = firstValue(data.appeal, asArray(data.appeals)[0]);
        return {
          appeal: appealItem ? mapAppeal(appealItem) : null,
        };
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 401 || status === 403) {
          return { appeal: null };
        }
        return { appeal: null };
      }
    },
  },

  admin: {
    makeModerator: (email: string) => apiClient.post(apiRoutes.make_moderator_url, { email }),
    removeModerator: (email: string) => apiClient.post(apiRoutes.remove_moderator_url, { email }),
    banUser: (email: string) => apiClient.post(apiRoutes.ban_user_url, { email }),
    unbanUser: (email: string) => apiClient.post(apiRoutes.unban_user_url, { email }),
    listSanctions: async (
      status: SanctionStatus = "active",
      limit: number = 20,
      nextToken?: string | null,
      userEmail?: string
    ): Promise<{ sanctions: Sanction[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.admin_sanctions_url, {
        params: { status, limit, nextToken, userEmail },
      });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        sanctions: asArray(data.sanctions).map(mapSanction),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    listUserSanctions: async (
      email: string,
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ sanctions: Sanction[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.admin_user_sanctions_url(email), {
        params: { limit, nextToken },
      });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        sanctions: asArray(data.sanctions).map(mapSanction),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    createSanction: async (payload: {
      userEmail: string;
      type: SanctionType;
      description?: string;
      startsAt?: string;
      endsAt?: string | null;
      reportId?: string | null;
      publicationId?: string | null;
    }): Promise<{ sanction: Sanction; user?: UserSummary }> => {
      const res = await apiClient.post(apiRoutes.admin_sanctions_url, payload);
      const data = asRecord(res.data);
      return {
        sanction: mapSanction(data.sanction),
        user: data.user ? mapUser(data.user) : undefined,
      };
    },
    liftSanction: async (id: string): Promise<Sanction> => {
      const res = await apiClient.post(apiRoutes.lift_sanction_url(id), {});
      const data = asRecord(res.data);
      return mapSanction(firstValue(data.sanction, data));
    },
    listAppeals: async (
      status: string = "all",
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ appeals: Appeal[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.admin_appeals_url, { params: { status, limit, nextToken } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        appeals: asArray(data.appeals).map(mapAppeal),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    resolveAppeal: async (
      id: string,
      action: "lift_sanction" | "keep_sanction" | "request_info",
      decisionReason?: string
    ): Promise<{ message: string; appeal: Appeal }> => {
      const res = await apiClient.post(apiRoutes.resolve_appeal_url(id), { action, decisionReason });
      const data = asRecord(res.data);
      return {
        message: asString(data.message, "Apelación resuelta"),
        appeal: mapAppeal(firstValue(data.appeal, data)),
      };
    },
    listReports: async (
      status: ReportStatus = "pending",
      limit: number = 20,
      nextToken?: string | null
    ): Promise<{ reports: Report[]; nextToken: string | null; hasMore: boolean }> => {
      const res = await apiClient.get(apiRoutes.admin_reports_url, { params: { status, limit, nextToken } });
      const data = asRecord(res.data);
      const next = asNullableString(data.nextToken);
      return {
        reports: asArray(data.reports).map(mapReport),
        nextToken: next,
        hasMore: Boolean(next),
      };
    },
    reviewReport: async (
      id: string,
      status: Exclude<ReportStatus, "pending">,
      notes?: string
    ): Promise<Report> => {
      const res = await apiClient.post(apiRoutes.review_report_url, { id, status, notes });
      const data = asRecord(res.data);
      return mapReport(firstValue(data.report, data));
    },
    hidePublication: (id: string) => apiClient.post(apiRoutes.hide_publication_url, { id }),
    hideComment: (id: string) => apiClient.post(apiRoutes.hide_comment_url, { id }),
    createCategory: async (payload: Partial<Category>): Promise<Category> => {
      const res = await apiClient.post(apiRoutes.create_category_url, payload);
      return mapCategoryMutationResponse(res.data);
    },
    updateCategory: async (id: string, payload: Partial<Category>): Promise<Category> => {
      const res = await apiClient.put(apiRoutes.update_category_url(id), payload);
      return mapCategoryMutationResponse(res.data);
    },
    deleteCategory: (id: string) => apiClient.delete(apiRoutes.delete_category_url(id)),
    updateMessagesSettings: async (messagesEnabled: boolean): Promise<MessagesSettings> => {
      const res = await apiClient.put(apiRoutes.admin_messages_settings_url, { messagesEnabled });
      const data = asRecord(res.data);
      return mapMessagesSettings(firstValue(data.messages, data));
    },
    updateNotificationsSettings: async (notificationsEnabled: boolean): Promise<NotificationsSettings> => {
      return setLocalNotificationSettings(notificationsEnabled);
    },
    listPublications: async (status = "pending", limit = 50, nextToken?: string | null): Promise<PaginatedResponse<Publication>> => {
      const res = await apiClient.get(apiRoutes.admin_publications_url, {
        params: { status, limit, nextToken },
      });
      return {
        items: asArray(res.data?.items).map(mapPublication),
        hasMore: !!res.data?.nextToken,
        nextToken: asNullableString(res.data?.nextToken),
      };
    },
    reviewPublication: async (payload: { id: string; approvalStatus: "approved" | "rejected"; rejectionReason?: string; categoryId?: string }): Promise<Publication> => {
      const res = await apiClient.put(apiRoutes.review_publication_url, payload);
      const data = asRecord(res.data);
      return mapPublication(firstValue(data.publication, data));
    },
    updateUser: (email: string, payload: UpdateUserPayload) =>
      apiClient.put(apiRoutes.admin_update_user_url(email), {
        username: payload.username,
        profilePicture: payload.profilePicture ?? payload.profilePicUrl,
        coverPicture: payload.coverPicture,
        bio: payload.bio,
        location: payload.location,
        interests: payload.interests,
        specialty: payload.specialty,
      }),
  },
};

export const listPublications = api.publications.list;
export const createPublication = api.publications.create;
export const deletePublication = api.publications.delete;
export const editPublication = api.publications.edit;
export const createComment = api.comments.create;
export const deleteComment = api.comments.delete;
export const likePublication = api.social.like;
export const unlikePublication = api.social.unlike;
export const sharePublication = api.social.share;
export const listNotifications = api.notifications.list;
