import type { UserRole } from "../../types";

export const ROUTE_PATHS = {
  home: "/",
  login: "/login",
  signUp: "/signUp",
  search: "/search",
  profile: "/profile",
  myProfile: "/my-profile",
  editProfile: "/edit-profile",
  editPassword: "/edit-password",
  notifications: "/notifications",
  messages: "/messages",
  publication: "/publication",
  createPublication: "/create-publication",
  previewPublication: "/preview-publication",
  creatorDashboard: "/creator/dashboard",
  adminCategories: "/admin/categories",
  adminReports: "/admin/reports",
  adminSanctions: "/admin/sanctions",
  adminAppeals: "/admin/appeals",
  adminPublications: "/admin/publication-management",
  setupMfa: "/setup-mfa",
  verifyMfa: "/verify-mfa",
  confirmSignup: "/confirm-signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  oauthCallback: "/oauth-callback",
  notFound: "/not-found",
} as const;

export type RouteAccess = "public" | "protected" | "guest-only";

export interface RouteLayoutMetadata {
  showNavBar: boolean;
  showFooter: boolean;
  showLogoOnly: boolean;
}

export interface RouteDefinition {
  id: keyof typeof ROUTE_PATHS | "authenticated";
  path: string;
  access: RouteAccess;
  allowedRoles?: UserRole[];
  allowBanned?: boolean;
  layout: RouteLayoutMetadata;
}

const defaultLayout: RouteLayoutMetadata = {
  showNavBar: false,
  showFooter: false,
  showLogoOnly: false,
};

const route = (
  definition: Omit<RouteDefinition, "layout"> & {
    layout?: Partial<RouteLayoutMetadata>;
  }
): RouteDefinition => ({
  ...definition,
  layout: {
    ...defaultLayout,
    ...definition.layout,
  },
});

const publicAppLayout = {
  showNavBar: true,
  showFooter: true,
};

const authLayout = {
  showNavBar: true,
  showLogoOnly: true,
};

export const AUTHENTICATED_ROUTE = route({
  id: "authenticated",
  path: "",
  access: "protected",
  allowBanned: true,
});

export const ROUTE_DEFINITIONS = {
  home: route({
    id: "home",
    path: ROUTE_PATHS.home,
    access: "public",
    layout: publicAppLayout,
  }),
  login: route({
    id: "login",
    path: ROUTE_PATHS.login,
    access: "guest-only",
    layout: authLayout,
  }),
  signUp: route({
    id: "signUp",
    path: ROUTE_PATHS.signUp,
    access: "guest-only",
    layout: authLayout,
  }),
  search: route({
    id: "search",
    path: ROUTE_PATHS.search,
    access: "public",
    layout: publicAppLayout,
  }),
  profile: route({
    id: "profile",
    path: ROUTE_PATHS.profile,
    access: "public",
    layout: publicAppLayout,
  }),
  myProfile: route({
    id: "myProfile",
    path: ROUTE_PATHS.myProfile,
    access: "protected",
    allowedRoles: ["consumer", "creator", "admin", "banned"],
    allowBanned: true,
    layout: publicAppLayout,
  }),
  editProfile: route({
    id: "editProfile",
    path: ROUTE_PATHS.editProfile,
    access: "protected",
    allowedRoles: ["consumer", "creator", "admin"],
    layout: publicAppLayout,
  }),
  editPassword: route({
    id: "editPassword",
    path: ROUTE_PATHS.editPassword,
    access: "protected",
    allowedRoles: ["consumer", "creator", "admin"],
    layout: publicAppLayout,
  }),
  notifications: route({
    id: "notifications",
    path: ROUTE_PATHS.notifications,
    access: "protected",
    allowedRoles: ["consumer", "creator", "admin"],
    layout: publicAppLayout,
  }),
  messages: route({
    id: "messages",
    path: ROUTE_PATHS.messages,
    access: "protected",
    allowedRoles: ["consumer", "creator", "admin", "banned"],
    allowBanned: true,
    layout: publicAppLayout,
  }),
  publication: route({
    id: "publication",
    path: ROUTE_PATHS.publication,
    access: "public",
    layout: publicAppLayout,
  }),
  createPublication: route({
    id: "createPublication",
    path: ROUTE_PATHS.createPublication,
    access: "protected",
    allowedRoles: ["creator"],
    layout: {
      showNavBar: true,
      showFooter: true,
    },
  }),
  previewPublication: route({
    id: "previewPublication",
    path: ROUTE_PATHS.previewPublication,
    access: "protected",
    allowedRoles: ["creator"],
    layout: {
      showNavBar: true,
      showFooter: true,
    },
  }),
  creatorDashboard: route({
    id: "creatorDashboard",
    path: ROUTE_PATHS.creatorDashboard,
    access: "protected",
    allowedRoles: ["creator"],
    layout: publicAppLayout,
  }),
  adminCategories: route({
    id: "adminCategories",
    path: ROUTE_PATHS.adminCategories,
    access: "protected",
    allowedRoles: ["admin"],
    layout: publicAppLayout,
  }),
  adminReports: route({
    id: "adminReports",
    path: ROUTE_PATHS.adminReports,
    access: "protected",
    allowedRoles: ["admin"],
    layout: publicAppLayout,
  }),
  adminSanctions: route({
    id: "adminSanctions",
    path: ROUTE_PATHS.adminSanctions,
    access: "protected",
    allowedRoles: ["admin"],
    layout: publicAppLayout,
  }),
  adminAppeals: route({
    id: "adminAppeals",
    path: ROUTE_PATHS.adminAppeals,
    access: "protected",
    allowedRoles: ["admin"],
    layout: publicAppLayout,
  }),
  adminPublications: route({
    id: "adminPublications",
    path: ROUTE_PATHS.adminPublications,
    access: "protected",
    allowedRoles: ["admin"],
    layout: publicAppLayout,
  }),
  setupMfa: route({
    id: "setupMfa",
    path: ROUTE_PATHS.setupMfa,
    access: "protected",
    allowedRoles: ["consumer", "creator", "admin"],
  }),
  verifyMfa: route({
    id: "verifyMfa",
    path: ROUTE_PATHS.verifyMfa,
    access: "guest-only",
    layout: authLayout,
  }),
  confirmSignup: route({
    id: "confirmSignup",
    path: ROUTE_PATHS.confirmSignup,
    access: "guest-only",
    layout: authLayout,
  }),
  forgotPassword: route({
    id: "forgotPassword",
    path: ROUTE_PATHS.forgotPassword,
    access: "guest-only",
    layout: authLayout,
  }),
  resetPassword: route({
    id: "resetPassword",
    path: ROUTE_PATHS.resetPassword,
    access: "guest-only",
    layout: authLayout,
  }),
  oauthCallback: route({
    id: "oauthCallback",
    path: ROUTE_PATHS.oauthCallback,
    access: "public",
    layout: authLayout,
  }),
  notFound: route({
    id: "notFound",
    path: ROUTE_PATHS.notFound,
    access: "public",
    layout: publicAppLayout,
  }),
} as const satisfies Record<keyof typeof ROUTE_PATHS, RouteDefinition>;

export const ROUTE_DEFINITION_LIST = Object.values(ROUTE_DEFINITIONS);

export const getRouteDefinition = (pathname: string): RouteDefinition => {
  const cleanPath = pathname || ROUTE_PATHS.home;

  return (
    ROUTE_DEFINITION_LIST.find((definition) => definition.path === cleanPath) ?? ROUTE_DEFINITIONS.notFound
  );
};
