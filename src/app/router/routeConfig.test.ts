import { describe, expect, it } from "vitest";
import { resolveSessionRole } from "../auth/session";
import { normalizeRole } from "../../domain/roles";
import { getRouteAccessDecision } from "./routeAccess";
import { getRouteDefinition, ROUTE_DEFINITIONS, ROUTE_PATHS } from "./routeConfig";

describe("router access metadata", () => {
  it("keeps public discovery routes open for guests", () => {
    const decision = getRouteAccessDecision(ROUTE_DEFINITIONS.search, {
      isAuthenticated: false,
      role: "guest",
    });

    expect(decision.allowed).toBe(true);
  });

  it("requires authentication for private routes", () => {
    const decision = getRouteAccessDecision(ROUTE_DEFINITIONS.myProfile, {
      isAuthenticated: false,
      role: "guest",
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "requires-auth",
    });
  });

  it("redirects authenticated users away from guest-only routes", () => {
    const decision = getRouteAccessDecision(ROUTE_DEFINITIONS.login, {
      isAuthenticated: true,
      role: "consumer",
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "guest-only",
      redirectTo: ROUTE_PATHS.home,
    });
  });

  it("limits publication creation to creators", () => {
    const consumerDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.createPublication, {
      isAuthenticated: true,
      role: "consumer",
    });
    const creatorDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.createPublication, {
      isAuthenticated: true,
      role: "creator",
    });

    const adminDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.createPublication, {
      isAuthenticated: true,
      role: "admin",
    });

    expect(consumerDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
    expect(creatorDecision.allowed).toBe(true);
    expect(adminDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
  });

  it("limits publication preview to creators because it is part of creation", () => {
    const consumerDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.previewPublication, {
      isAuthenticated: true,
      role: "consumer",
    });
    const creatorDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.previewPublication, {
      isAuthenticated: true,
      role: "creator",
    });

    expect(consumerDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
    expect(creatorDecision.allowed).toBe(true);
  });

  it("limits category administration to admins", () => {
    const consumerDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.adminCategories, {
      isAuthenticated: true,
      role: "consumer",
    });
    const adminDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.adminCategories, {
      isAuthenticated: true,
      role: "admin",
    });

    expect(consumerDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
    expect(adminDecision.allowed).toBe(true);
  });

  it("limits report administration to admins", () => {
    const consumerDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.adminReports, {
      isAuthenticated: true,
      role: "consumer",
    });
    const adminDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.adminReports, {
      isAuthenticated: true,
      role: "admin",
    });

    expect(consumerDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
    expect(adminDecision.allowed).toBe(true);
  });

  it("limits creator dashboard to creators", () => {
    const consumerDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.creatorDashboard, {
      isAuthenticated: true,
      role: "consumer",
    });
    const creatorDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.creatorDashboard, {
      isAuthenticated: true,
      role: "creator",
    });
    const adminDecision = getRouteAccessDecision(ROUTE_DEFINITIONS.creatorDashboard, {
      isAuthenticated: true,
      role: "admin",
    });

    expect(consumerDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
    expect(creatorDecision.allowed).toBe(true);
    expect(adminDecision).toMatchObject({
      allowed: false,
      reason: "role",
    });
  });

  it("uses the route definition as layout source", () => {
    expect(getRouteDefinition(ROUTE_PATHS.login).layout.showLogoOnly).toBe(true);
    expect(getRouteDefinition("/missing").path).toBe(ROUTE_PATHS.notFound);
  });

  it("normalizes legacy roles before access checks", () => {
    expect(normalizeRole("moderators")).toBe("creator");
    expect(normalizeRole("users")).toBe("consumer");
    expect(normalizeRole("consumer")).toBe("consumer");
  });

  it("keeps a freshly promoted creator role while Cognito refresh catches up", () => {
    expect(resolveSessionRole("consumer", "creator")).toBe("creator");
  });

  it("denies access to banned users on routes that do not explicitly allow them", () => {
    const decision = getRouteAccessDecision(ROUTE_DEFINITIONS.createPublication, {
      isAuthenticated: true,
      role: "banned",
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "banned",
    });
  });
});
