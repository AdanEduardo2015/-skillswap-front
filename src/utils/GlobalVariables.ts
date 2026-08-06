import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE_URL, IS_LOCAL_AUTH_ENABLED } from "../config/api";
import { getRouteLayoutState, type RouteLayoutState } from "../app/router/routeLayout";

const base_url = API_BASE_URL;
export const apiRoutes = {
  create_user_url: `${base_url}/user/create`,
  delete_account_url: `${base_url}/user/delete`,
  update_user_url: `${base_url}/user/update`,
  become_creator_url: `${base_url}/user/become-creator`,
  update_fcm_token_url: `${base_url}/user/fcm-token/update`,

  push_resouce_url: `${base_url}/media/presigned-url`,
  push_resource_legacy_url: `${base_url}/presigned/push-resource`,

  list_categories_url: `${base_url}/categories`,
  create_category_url: `${base_url}/admin/categories`,
  update_category_url: (id: string) => `${base_url}/admin/categories/${encodeURIComponent(id)}`,
  delete_category_url: (id: string) => `${base_url}/admin/categories/${encodeURIComponent(id)}`,

  list_specialties_url: `${base_url}/specialties`,

  read_notification_url: `${base_url}/notification/read`,
  delete_all_notifications_url: `${base_url}/notification/delete-all`,
  notifications_settings_url: `${base_url}/notifications/settings`,
  admin_notifications_settings_url: `${base_url}/admin/notifications/settings`,

  search_resources_url: `${base_url}/search/search-resources`,
  search_resources_user_auth_url: `${base_url}/search/search-resources-user-auth`,

  messages_account_url: `${base_url}/notifications`,
  messages_account_legacy_url: `${base_url}/account/messages`,
  send_message_url: `${base_url}/messages`,
  message_conversations_url: `${base_url}/account/conversations`,
  message_conversations_legacy_url: `${base_url}/messages/conversations`,
  message_thread_url: (email: string) => `${base_url}/messages/thread/${encodeURIComponent(email)}`,
  read_message_url: (id: string) => `${base_url}/messages/${encodeURIComponent(id)}/read`,
  delete_message_url: (id: string) => `${base_url}/messages/${encodeURIComponent(id)}`,
  messages_settings_url: `${base_url}/messages/settings`,
  admin_messages_settings_url: `${base_url}/admin/messages/settings`,

  list_comments_url: `${base_url}/comment/list`,
  comment_publication_url: `${base_url}/comment/create`,
  delete_comment_url: `${base_url}/comment/delete`,
  edit_comment_url: `${base_url}/comment/edit`,

  like_publications_url: `${base_url}/like/create`,
  unlike_publications_url: `${base_url}/like/delete`,
  dislike_publications_url: `${base_url}/dislike/create`,
  undislike_publications_url: `${base_url}/dislike/delete`,
  like_comment_url: `${base_url}/comment/like`,
  unlike_comment_url: `${base_url}/comment/unlike`,
  dislike_comment_url: `${base_url}/comment/dislike`,
  undislike_comment_url: `${base_url}/comment/undislike`,

  create_publication_url: `${base_url}/publications/create`,
  delete_publication_url: `${base_url}/publications/delete`,
  edit_publication_url: `${base_url}/publications/edit`,

  list_publication_url: `${base_url}/publications/list-publication`,
  list_publications_url: `${base_url}/publications/list-publications`,
  share_publication_url: `${base_url}/publications/share-publication`,
  record_publication_view_url: `${base_url}/publications/view`,
  list_user_publications_url: `${base_url}/publications/list-user-publications`,
  list_publication_user_auth_url: `${base_url}/publications/list-publication-user-auth`,
  list_publications_user_auth_url: `${base_url}/publications/list-publications-user-auth`,
  list_user_publications_user_auth_url: `${base_url}/publications/list-user-publications-user-auth`,
  save_publication_url: `${base_url}/publications/save`,
  unsave_publication_url: `${base_url}/publications/unsave`,
  saved_publications_url: `${base_url}/users/me/saved-publications`,

  follow_creator_url: `${base_url}/creators/follow`,
  unfollow_creator_url: `${base_url}/creators/unfollow`,
  creator_followers_url: (email: string) => `${base_url}/creators/${encodeURIComponent(email)}/followers`,
  creator_me_followers_url: `${base_url}/creator/followers`,
  user_following_url: `${base_url}/users/me/following`,

  create_rating_url: `${base_url}/ratings`,
  publication_ratings_url: (id: string) => `${base_url}/ratings/publication/${encodeURIComponent(id)}`,
  creator_ratings_url: (email: string) => `${base_url}/ratings/creator/${encodeURIComponent(email)}`,

  create_report_url: `${base_url}/reports`,
  admin_reports_url: `${base_url}/admin/reports`,
  review_report_url: `${base_url}/admin/reports/review`,
  admin_publications_url: `${base_url}/admin/publications`,
  review_publication_url: `${base_url}/admin/publications/review`,
  hide_publication_url: `${base_url}/admin/publications/hide`,
  hide_comment_url: `${base_url}/admin/comments/hide`,

  creator_dashboard_url: `${base_url}/creator/dashboard`,

  make_moderator_url: `${base_url}/admin/make-moderator`,
  remove_moderator_url: `${base_url}/admin/remove-moderator`,
  ban_user_url: `${base_url}/admin/ban-user`,
  unban_user_url: `${base_url}/admin/unban-user`,
  admin_update_user_url: (email: string) => `${base_url}/admin/users/${encodeURIComponent(email)}`,
  admin_sanctions_url: `${base_url}/admin/sanctions`,
  admin_user_sanctions_url: (email: string) =>
    `${base_url}/admin/users/${encodeURIComponent(email)}/sanctions`,
  lift_sanction_url: (id: string) => `${base_url}/admin/sanctions/${encodeURIComponent(id)}/lift`,
  create_appeal_url: `${base_url}/appeals`,
  user_appeals_url: `${base_url}/appeals/me`,
  sanction_appeals_url: (sanctionId: string) => `${base_url}/appeals/sanction/${encodeURIComponent(sanctionId)}`,
  admin_appeals_url: `${base_url}/admin/appeals`,
  resolve_appeal_url: (id: string) => `${base_url}/admin/appeals/${encodeURIComponent(id)}/resolve`,
};

let pathsData: RouteLayoutState = getRouteLayoutState("/");

export const setPathLayoutState = (pathname: string) => {
  pathsData = getRouteLayoutState(pathname);
  return pathsData;
};

export const BanMensaje =
  "Usted se encuentra baneado. Si requiere asistencia adicional, envie un correo a [EMAIL_ADDRESS].";

export const PathsInitializer = () => {
  const location = useLocation();

  useEffect(() => {
    setPathLayoutState(location.pathname);
  }, [location]);

  return null;
};

export const useSearchParamsGlobal = () => {
  const [searchParams] = useSearchParams();
  return searchParams;
};

export const formatFecha = (fechaISO: string) =>
  new Date(fechaISO).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const paths = {
  get showNavBar() {
    return pathsData.showNavBar;
  },
  get showFooter() {
    return pathsData.showFooter;
  },
  get showLogoOnly() {
    return pathsData.showLogoOnly;
  },
  get currentPath() {
    return pathsData.currentPath;
  },
};

export const currentPath = () => pathsData.currentPath;
export const searchParams = useSearchParamsGlobal;

const TOKEN_CACHE_MS = 15_000;
const NO_TOKEN_CACHE_MS = 5_000;

const hasCognitoKeys = (): boolean => {
  if (typeof process !== "undefined" && process.env.VITEST) return true;
  if (typeof window === "undefined" || !window.localStorage) return false;
  if (window.location.pathname === "/oauth-callback") return true;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("CognitoIdentityServiceProvider")) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
};

let cachedAuthToken: { value: string | null; expiresAt: number } | null = null;
let pendingTokenRequest: Promise<string | null> | null = null;

export const clearAuthTokenCache = () => {
  cachedAuthToken = null;
  pendingTokenRequest = null;
};

export async function getToken(options: { forceRefresh?: boolean } = {}) {
  if (IS_LOCAL_AUTH_ENABLED) return null;
  if (!hasCognitoKeys()) return null;

  const now = Date.now();
  if (!options.forceRefresh && cachedAuthToken && cachedAuthToken.expiresAt > now) {
    return cachedAuthToken.value;
  }

  if (!options.forceRefresh && pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = (async () => {
    try {
      const session = options.forceRefresh
        ? await fetchAuthSession({ forceRefresh: true })
        : await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() ?? null;

      cachedAuthToken = {
        value: token,
        expiresAt: Date.now() + (token ? TOKEN_CACHE_MS : NO_TOKEN_CACHE_MS),
      };
      return token;
    } catch {
      cachedAuthToken = { value: null, expiresAt: Date.now() + NO_TOKEN_CACHE_MS };
      return null;
    } finally {
      pendingTokenRequest = null;
    }
  })();

  return pendingTokenRequest;
}

export async function isUserAuthenticated() {
  if (IS_LOCAL_AUTH_ENABLED) return true;
  if (!hasCognitoKeys()) return false;

  const token = await getToken();
  return Boolean(token);
}
