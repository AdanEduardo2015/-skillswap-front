import { useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import { FaBalanceScale, FaBell, FaChartLine, FaFlag, FaGavel, FaHome, FaSearch, FaTags, FaUser, FaVideo } from "react-icons/fa";
import { FiPlusSquare, FiSend } from "react-icons/fi";
import { useAuthSession } from "../../app/auth/AuthSessionContext";
import { ROUTE_PATHS } from "../../app/router/routeConfig";
import { normalizeRole } from "../../domain/roles";
import { useNotificationStore } from "../../utils/NotificationStore";

export interface AppNavigationItem {
  id: string;
  label: string;
  path: string;
  Icon: IconType;
  isActive: boolean;
  hasIndicator?: boolean;
}

type NavigationDefinition = Omit<AppNavigationItem, "isActive">;

export function useAppNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const authSession = useAuthSession();
  const hasUnreadNotifications = useNotificationStore((state) => state.hasUnreadNotifications);
  const normalizedRole = authSession.isAuthenticated ? normalizeRole(authSession.role) : "guest";
  const isAdmin = normalizedRole === "admin";
  const canCreatePublication = normalizedRole === "creator";
  const canUseCreatorTools = normalizedRole === "creator";

  const withActiveState = (item: NavigationDefinition): AppNavigationItem => ({
    ...item,
    isActive: currentPath === item.path,
  });

  const home = withActiveState({
    id: "home",
    label: "Inicio",
    path: ROUTE_PATHS.home,
    Icon: FaHome,
  });

  const search = withActiveState({
    id: "search",
    label: "Buscar",
    path: ROUTE_PATHS.search,
    Icon: FaSearch,
  });

  const notifications = withActiveState({
    id: "notifications",
    label: "Notificaciones",
    path: ROUTE_PATHS.notifications,
    Icon: FaBell,
    hasIndicator: hasUnreadNotifications,
  });

  const messages = withActiveState({
    id: "messages",
    label: "Mensajes",
    path: ROUTE_PATHS.messages,
    Icon: FiSend,
  });

  const createPublication = withActiveState({
    id: "create-publication",
    label: "Crear",
    path: ROUTE_PATHS.createPublication,
    Icon: FiPlusSquare,
  });

  const creatorDashboard = withActiveState({
    id: "creator-dashboard",
    label: "Dashboard",
    path: ROUTE_PATHS.creatorDashboard,
    Icon: FaChartLine,
  });

  const adminReports = withActiveState({
    id: "admin-reports",
    label: "Reportes",
    path: ROUTE_PATHS.adminReports,
    Icon: FaFlag,
  });

  const adminCategories = withActiveState({
    id: "admin-categories",
    label: "Categorias",
    path: ROUTE_PATHS.adminCategories,
    Icon: FaTags,
  });

  const adminSanctions = withActiveState({
    id: "admin-sanctions",
    label: "Sanciones",
    path: ROUTE_PATHS.adminSanctions,
    Icon: FaGavel,
  });

  const adminAppeals = withActiveState({
    id: "admin-appeals",
    label: "Apelaciones",
    path: ROUTE_PATHS.adminAppeals,
    Icon: FaBalanceScale,
  });

  const adminPublications = withActiveState({
    id: "admin-publications",
    label: "Moderación",
    path: ROUTE_PATHS.adminPublications,
    Icon: FaVideo,
  });

  const profile = withActiveState({
    id: "profile",
    label: "Perfil",
    path: ROUTE_PATHS.myProfile,
    Icon: FaUser,
  });

  return {
    desktopTopItems: [home, search, messages, notifications],
    desktopCreateItem: canCreatePublication ? createPublication : null,
    desktopBottomItems: [
      ...(canUseCreatorTools ? [creatorDashboard] : []),
      ...(isAdmin ? [adminReports, adminSanctions, adminCategories, adminPublications, adminAppeals] : []),
      profile,
    ],
    desktopItems: [
      home,
      search,
      messages,
      notifications,
      ...(canCreatePublication ? [createPublication] : []),
      ...(canUseCreatorTools ? [creatorDashboard] : []),
      ...(isAdmin ? [adminReports, adminSanctions, adminCategories, adminPublications, adminAppeals] : []),
      profile,
    ],
    mobileHeaderItems: [messages, notifications],
    mobileFooterItems: [
      home,
      search,
      ...(canUseCreatorTools ? [creatorDashboard] : []),
      ...(canCreatePublication ? [createPublication] : []),
      profile,
    ],
  };
}
