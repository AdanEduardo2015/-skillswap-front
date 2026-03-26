import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { apiRoutes, getToken, isUserAuthenticated } from '../utils/GlobalVariables';
import type {
  Publication,
  PublicationsListResponse,
  NotificationsResponse,
  CreateCommentResponse,
} from '../types';

// ===========================
// Authenticated Axios Helper
// ===========================

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const headers = await authHeaders();
  const res = await axios({ ...config, headers: { ...config.headers, ...headers } });
  return res.data;
}

// ===========================
// Publications
// ===========================

export async function listPublications(page: number, limit: number = 10): Promise<{ publications: Publication[]; hasMore: boolean }> {
  const isAuth = await isUserAuthenticated();
  const token = isAuth ? await getToken() : null;
  const url = isAuth ? apiRoutes.list_publications_user_auth_url : apiRoutes.list_publications_url;

  const res = await axios.get(url, {
    params: { page, limit },
    ...(isAuth && token && { headers: { Authorization: `Bearer ${token}` } }),
  });

  if (Array.isArray(res.data)) {
    return { publications: res.data, hasMore: false };
  }

  return {
    publications: res.data.publicaciones || [],
    hasMore: res.data.hasMore ?? false,
  };
}

export async function listUserPublications(
  email: string,
  page: number,
  limit: number = 10
): Promise<PublicationsListResponse & { hasMore: boolean }> {
  const data = await authRequest<PublicationsListResponse>({
    method: 'POST',
    url: apiRoutes.list_user_publications_user_auth_url,
    data: { Correo_electronico: email },
    params: { page, limit },
  });

  const pubs = Array.isArray(data) ? data as unknown as Publication[] : (data.publicaciones || []);
  const hasMore = !Array.isArray(data) && (data as any).hasMore ? true : false;

  return { ...data, publicaciones: pubs, hasMore };
}

export async function createPublication(payload: {
  Contenido: string;
  Url_imagen?: string | null;
  Url_video?: string | null;
  Lat?: number | null;
  Long?: number | null;
}): Promise<void> {
  await authRequest({ method: 'POST', url: apiRoutes.create_publication_url, data: payload });
}

export async function deletePublication(publicationId: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.delete_publication_url,
    data: { Id_publicacion: publicationId },
  });
}

export async function editPublication(payload: {
  Id_publicacion: string;
  Contenido: string;
  Url_imagen?: string | null;
  Url_video?: string | null;
}): Promise<void> {
  await authRequest({ method: 'POST', url: apiRoutes.edit_publication_url, data: payload });
}

export async function getPublication(publicationId: string): Promise<Publication> {
  const isAuth = await isUserAuthenticated();
  const url = isAuth ? apiRoutes.list_publication_user_auth_url : apiRoutes.list_publication_url;
  const token = isAuth ? await getToken() : null;

  const res = await axios.get(url, {
    params: { Id_publicacion: publicationId },
    ...(isAuth && token && { headers: { Authorization: `Bearer ${token}` } }),
  });

  return res.data;
}

// ===========================
// Likes & Shares
// ===========================

export async function likePublication(publicationId: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.like_publications_url,
    data: { Id_objetivo: publicationId },
  });
}

export async function unlikePublication(publicationId: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.unlike_publications_url,
    data: { Id_objetivo: publicationId },
  });
}

export async function sharePublication(publicationId: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.share_publication_url,
    data: { Id_objetivo: publicationId },
  });
}

// ===========================
// Comments
// ===========================

export async function createComment(publicationId: string, content: string): Promise<CreateCommentResponse> {
  return authRequest<CreateCommentResponse>({
    method: 'POST',
    url: apiRoutes.comment_publication_url,
    data: { Id_objetivo: publicationId, Contenido: content },
  });
}

export async function editComment(commentId: string, content: string): Promise<void> {
  await authRequest({
    method: 'PUT',
    url: apiRoutes.edit_comment_url,
    data: { Id_comentario: commentId, Contenido: content },
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.delete_comment_url,
    data: { Id_comentario: commentId },
  });
}

// ===========================
// Notifications
// ===========================

export async function listNotifications(): Promise<NotificationsResponse> {
  return authRequest<NotificationsResponse>({
    method: 'GET',
    url: apiRoutes.messages_account_url,
  });
}

export async function readNotification(notificationId: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.read_notification_url,
    data: { Id_notificacion: notificationId },
  });
}

export async function deleteAllNotifications(): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.delete_all_notifications_url,
    data: {},
  });
}

// ===========================
// Search
// ===========================

export async function searchResources(query: string): Promise<any> {
  const isAuth = await isUserAuthenticated();
  const url = isAuth ? apiRoutes.search_resources_user_auth_url : apiRoutes.search_resources_url;
  const token = isAuth ? await getToken() : null;

  const res = await axios.get(url, {
    params: { query },
    ...(isAuth && token && { headers: { Authorization: `Bearer ${token}` } }),
  });

  return res.data;
}

// ===========================
// Admin
// ===========================

export async function makeModerator(email: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.make_moderator_url,
    data: { Correo_electronico: email },
  });
}

export async function removeModerator(email: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.remove_moderator_url,
    data: { Correo_electronico: email },
  });
}

export async function banUser(email: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.ban_user_url,
    data: { Correo_electronico: email },
  });
}

export async function unbanUser(email: string): Promise<void> {
  await authRequest({
    method: 'POST',
    url: apiRoutes.unban_user_url,
    data: { Correo_electronico: email },
  });
}
