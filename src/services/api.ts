import axios from 'axios';
import { apiRoutes, getToken, isUserAuthenticated } from '../utils/GlobalVariables';
import type {
    Publication,
    PublicationsListResponse,
    NotificationsResponse,
    CreateCommentResponse,
    UserSummary,
    CommentData,
    PaginatedResponse,
} from '../types';

// ===========================
// Axios Instance Configuration
// ===========================

const apiClient = axios.create({
    timeout: 15000,
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Error Handling Standardization
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Error desconocido';
        console.error('[API Error]:', message);
        return Promise.reject(new Error(message));
    }
);

// ===========================
// Data Mappers (Standardizing Cocktail of Conventions)
// ===========================

const mapUser = (raw: any): UserSummary => ({
    email: raw.email || raw.Correo_electronico || raw.correo || '',
    username: raw.username || raw.nombre_usuario || raw.Nombre_usuario || 'Usuario',
    profilePicUrl: raw.profilePicture || raw.profilePicUrl || raw.Url_foto_perfil || raw.url_foto_perfil || raw.foto_perfil || null,
    role: raw.role || 'user',
});

const mapComment = (raw: any): CommentData => ({
    id: raw.id || raw.id_comentario || '',
    content: raw.content || raw.contenido || '',
    createdAt: raw.createdAt || raw.fecha_comentario || '',
    canDelete: raw.canDelete ?? raw.Can_delete ?? false,
    canUpdate: raw.canUpdate ?? raw.Can_update ?? false,
    user: raw.user ? mapUser(raw.user) : (raw.Usuario ? mapUser(raw.Usuario) : undefined),
});

const mapPublication = (raw: any): Publication => ({
    id: raw.id || raw.Id_publicacion || '',
    content: raw.content || raw.Contenido || '',
    imageUrl: raw.imageUrl || raw.Url_imagen || null,
    videoUrl: raw.videoUrl || raw.Url_video || null,
    lat: raw.lat ? parseFloat(raw.lat) : (raw.Lat ? parseFloat(raw.Lat) : null),
    long: raw.long ? parseFloat(raw.long) : (raw.Long ? parseFloat(raw.Long) : null),
    createdAt: raw.createdAt || raw.Fecha_publicacion || '',
    user: raw.user ? mapUser(raw.user) : (raw.Usuario ? mapUser(raw.Usuario) : undefined),
    likesCount: raw.likesCount || raw.likes?.total || 0,
    sharesCount: raw.sharesCount || raw.compartidos?.total || 0,
    isLiked: raw.isLiked ?? raw.is_Liked ?? raw.Is_Liked ?? raw.is_liked ?? false,
    canDelete: raw.canDelete ?? raw.Can_delete ?? false,
    canUpdate: raw.canUpdate ?? raw.Can_update ?? false,
    comments: {
        total: raw.commentsCount || raw.comentarios?.total || 0,
        list: (raw.comments?.list || raw.comentarios?.lista || []).map(mapComment),
    },
});

// ===========================
// API Services
// ===========================

export const api = {
    publications: {
        list: async (limit: number = 10, nextToken?: string | null): Promise<PublicationsListResponse> => {
            const isAuth = await isUserAuthenticated();
            const url = isAuth ? apiRoutes.list_publications_user_auth_url : apiRoutes.list_publications_url;
            const res = await apiClient.get(url, { params: { limit, nextToken } });
            
            const rawItems = res.data.items || res.data.publicaciones || [];
            const newNextToken = res.data.nextToken || null;
            
            return {
                items: rawItems.map(mapPublication),
                hasMore: !!newNextToken,
                nextToken: newNextToken
            };
        },

        create: (payload: Partial<Publication>) => 
            apiClient.post(apiRoutes.create_publication_url, {
                content: payload.content,
                imageUrl: payload.imageUrl,
                videoUrl: payload.videoUrl,
                lat: payload.lat,
                long: payload.long
            }),

        delete: (id: string) => 
            apiClient.post(apiRoutes.delete_publication_url, { id }),

        edit: (id: string, payload: Partial<Publication>) =>
            apiClient.post(apiRoutes.edit_publication_url, {
                id,
                content: payload.content,
                imageUrl: payload.imageUrl,
                videoUrl: payload.videoUrl
            }),

        get: async (id: string): Promise<Publication> => {
            const isAuth = await isUserAuthenticated();
            const url = isAuth ? apiRoutes.list_publication_user_auth_url : apiRoutes.list_publication_url;
            const res = await apiClient.get(url, { params: { id } });
            return mapPublication(res.data);
        },

        listByUser: async (email: string, limit: number = 10, nextToken?: string | null): Promise<PublicationsListResponse> => {
            const isAuth = await isUserAuthenticated();
            const url = isAuth ? apiRoutes.list_user_publications_user_auth_url : apiRoutes.list_user_publications_url;
            // Note: list-user-publications is defined as POST in serverless.yml to support email in body easily
            const res = await apiClient.post(url, { email }, { params: { limit, nextToken } });
            
            const rawItems = res.data.items || res.data.publicaciones || [];
            const newNextToken = res.data.nextToken || null;
            const userProfile = res.data.user || res.data.usuario;
            
            return {
                items: rawItems.map(mapPublication),
                hasMore: !!newNextToken,
                nextToken: newNextToken,
                userProfile: userProfile ? mapUser(userProfile) : undefined
            };
        },
    },

    comments: {
        list: async (publicationId: string, limit: number = 20, nextToken?: string | null): Promise<PaginatedResponse<CommentData>> => {
            const res = await apiClient.get(apiRoutes.list_comments_url, { params: { publicationId, limit, nextToken } });
            const rawItems = res.data.items || [];
            const newNextToken = res.data.nextToken || null;
            return {
                items: rawItems.map(mapComment),
                hasMore: !!newNextToken,
                nextToken: newNextToken
            };
        },
        create: async (publicationId: string, content: string): Promise<CreateCommentResponse> => {
            const res = await apiClient.post(apiRoutes.comment_publication_url, {
                publicationId,
                content
            });
            return { id: res.data.id || res.data.comment?.id };
        },
        delete: (id: string) => 
            apiClient.post(apiRoutes.delete_comment_url, { id }),
        edit: (id: string, content: string) =>
            apiClient.post(apiRoutes.edit_comment_url, { id, content }),
    },

    social: {
        like: (id: string) => apiClient.post(apiRoutes.like_publications_url, { targetId: id }),
        unlike: (id: string) => apiClient.post(apiRoutes.unlike_publications_url, { targetId: id }),
        share: (id: string) => apiClient.post(apiRoutes.share_publication_url, { targetId: id }),
    },

    notifications: {
        list: async (limit: number = 20, nextToken?: string | null): Promise<NotificationsResponse & { hasMore: boolean, nextToken: string | null }> => {
            const res = await apiClient.get(apiRoutes.messages_account_url, { params: { limit, nextToken } });
            const raw = res.data.notifications || [];
            const newNextToken = res.data.nextToken || null;
            return {
                notifications: raw.map((n: any) => ({
                    id: n.id || n.id_notificacion || '',
                    message: n.message || n.mensaje || '',
                    publicationId: n.publicationId || n.id_publicacion || '',
                    user: n.user ? mapUser(n.user) : (n.usuario ? mapUser(n.usuario) : undefined),
                    createdAt: n.createdAt || n.fecha_creacion || new Date().toISOString()
                })),
                hasMore: !!newNextToken,
                nextToken: newNextToken
            };
        },
        read: (id: string) => apiClient.post(apiRoutes.read_notification_url, { id }),
        deleteAll: () => apiClient.post(apiRoutes.delete_all_notifications_url, {}),
    },

    users: {
        create: (payload: { email: string; username: string }) =>
            apiClient.post(apiRoutes.create_user_url, {
                email: payload.email,
                username: payload.username,
            }),
        update: (payload: { username?: string; profilePicUrl?: string; bio?: string; location?: string }) => 
            apiClient.post(apiRoutes.update_user_url, {
                username: payload.username,
                profilePicture: payload.profilePicUrl,
                bio: payload.bio,
                location: payload.location
            }),
        delete: () => apiClient.post(apiRoutes.delete_account_url, {}),
        updateFcmToken: (fcmToken: string) => apiClient.post(apiRoutes.update_fcm_token_url, { fcmToken }),
    },

    media: {
        getPresignedUrl: async (fileName: string, fileType: string, type: "publications" | "profile"): Promise<{ uploadUrl: string; fileUrl: string }> => {
            const res = await apiClient.post(apiRoutes.push_resouce_url, {
                fileName,
                fileType,
                type
            });
            return res.data;
        },
    },

    search: {
        list: async (query: string, limit: number = 20, nextToken?: string | null): Promise<PaginatedResponse<Publication>> => {
            const isAuth = await isUserAuthenticated();
            const url = isAuth ? apiRoutes.search_resources_user_auth_url : apiRoutes.search_resources_url;
            const res = await apiClient.get(url, { params: { q: query, limit, nextToken } });
            const raw = res.data.items || res.data.publicaciones || [];
            const newNextToken = res.data.nextToken || null;
            return {
                items: raw.map(mapPublication),
                hasMore: !!newNextToken,
                nextToken: newNextToken
            };
        },
    },

    admin: {
        makeModerator: (email: string) => apiClient.post(apiRoutes.make_moderator_url, { email }),
        removeModerator: (email: string) => apiClient.post(apiRoutes.remove_moderator_url, { email }),
        banUser: (email: string) => apiClient.post(apiRoutes.ban_user_url, { email }),
        unbanUser: (email: string) => apiClient.post(apiRoutes.unban_user_url, { email }),
        updateUser: (email: string, payload: { username?: string; profilePicUrl?: string }) =>
            apiClient.post(apiRoutes.update_user_url, {
                email, // For admin edits, we specify the target email
                username: payload.username,
                profilePicture: payload.profilePicUrl
            }),
    }
};

// Deprecated exports for backward compatibility while refactoring components
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
