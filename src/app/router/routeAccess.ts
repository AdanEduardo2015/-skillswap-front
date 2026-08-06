import type { UserRole } from "../../types";
import { ROUTE_PATHS, type RouteDefinition } from "./routeConfig";

export interface RouteAccessContext {
  isAuthenticated: boolean;
  role: UserRole;
}

export type RouteAccessDenialReason = "requires-auth" | "guest-only" | "banned" | "role";

export type RouteAccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: RouteAccessDenialReason;
      redirectTo?: string;
    };

export const getRouteAccessDecision = (
  routeDefinition: RouteDefinition,
  context: RouteAccessContext
): RouteAccessDecision => {
  if (routeDefinition.access === "guest-only" && context.isAuthenticated) {
    return {
      allowed: false,
      reason: "guest-only",
      redirectTo: ROUTE_PATHS.home,
    };
  }

  if (routeDefinition.access === "protected" && !context.isAuthenticated) {
    return {
      allowed: false,
      reason: "requires-auth",
    };
  }

  if (!context.isAuthenticated) {
    return { allowed: true };
  }

  if (context.role === "banned" && !routeDefinition.allowBanned) {
    return {
      allowed: false,
      reason: "banned",
    };
  }

  if (routeDefinition.allowedRoles && !routeDefinition.allowedRoles.includes(context.role)) {
    return {
      allowed: false,
      reason: "role",
    };
  }

  return { allowed: true };
};
