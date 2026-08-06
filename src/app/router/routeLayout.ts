import { getRouteDefinition, ROUTE_PATHS } from "./routeConfig";

export { ROUTE_PATHS } from "./routeConfig";

export interface RouteLayoutState {
  currentPath: string;
  showNavBar: boolean;
  showFooter: boolean;
  showLogoOnly: boolean;
}

export function getRouteLayoutState(pathname: string): RouteLayoutState {
  const currentPath = pathname || ROUTE_PATHS.home;
  const routeDefinition = getRouteDefinition(currentPath);

  return {
    currentPath,
    ...routeDefinition.layout,
  };
}
