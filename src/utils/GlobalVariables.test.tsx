import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import {
  setPathLayoutState,
  formatFecha,
  paths,
  currentPath,
  getToken,
  isUserAuthenticated,
  clearAuthTokenCache,
  PathsInitializer,
  useSearchParamsGlobal,
  apiRoutes,
} from "./GlobalVariables";

const authMock = vi.hoisted(() => ({
  fetchAuthSession: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: authMock.fetchAuthSession,
}));

const apiMock = vi.hoisted(() => ({
  IS_LOCAL_AUTH_ENABLED: false,
}));

vi.mock("../config/api", () => ({
  API_BASE_URL: "http://localhost:4000",
  get IS_LOCAL_AUTH_ENABLED() {
    return apiMock.IS_LOCAL_AUTH_ENABLED;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams("?q=query")],
  };
});

describe("GlobalVariables Utilities", () => {
  beforeEach(() => {
    clearAuthTokenCache();
    vi.clearAllMocks();
    apiMock.IS_LOCAL_AUTH_ENABLED = false;
  });

  it("formats dates correctly in es-MX locale", () => {
    const isoDate = "2026-07-09T03:00:00Z";
    const formatted = formatFecha(isoDate);
    expect(formatted).toContain("2026");
  });

  it("handles path layout states and getters", () => {
    const layout = setPathLayoutState("/login");
    expect(layout.showNavBar).toBe(true);
    expect(layout.showFooter).toBe(false);
    expect(layout.showLogoOnly).toBe(true);

    expect(paths.showNavBar).toBe(true);
    expect(paths.showFooter).toBe(false);
    expect(paths.showLogoOnly).toBe(true);
    expect(paths.currentPath).toBe("/login");
    expect(currentPath()).toBe("/login");
  });

  it("getToken retrieves Cognito token or returns null on error", async () => {
    authMock.fetchAuthSession.mockResolvedValueOnce({
      tokens: {
        idToken: {
          toString: () => "mock-token-string",
        },
      },
    });

    const token = await getToken();
    expect(token).toBe("mock-token-string");

    clearAuthTokenCache();
    authMock.fetchAuthSession.mockRejectedValueOnce(new Error("err"));
    const emptyToken = await getToken();
    expect(emptyToken).toBeNull();
  });

  it("getToken briefly caches missing sessions to avoid repeated Cognito calls", async () => {
    authMock.fetchAuthSession.mockResolvedValueOnce({});

    await expect(getToken()).resolves.toBeNull();
    await expect(getToken()).resolves.toBeNull();

    expect(authMock.fetchAuthSession).toHaveBeenCalledTimes(1);
  });

  it("isUserAuthenticated checks token presence or local auth fallback", async () => {
    apiMock.IS_LOCAL_AUTH_ENABLED = false;
    authMock.fetchAuthSession.mockResolvedValueOnce({
      tokens: {
        idToken: {
          toString: () => "mock-token-string",
        },
      },
    });
    expect(await isUserAuthenticated()).toBe(true);

    clearAuthTokenCache();
    authMock.fetchAuthSession.mockRejectedValueOnce(new Error("err"));
    expect(await isUserAuthenticated()).toBe(false);

    apiMock.IS_LOCAL_AUTH_ENABLED = true;
    expect(await isUserAuthenticated()).toBe(true);
  });

  it("PathsInitializer component runs effect on location change", () => {
    const TestComponent = () => {
      return (
        <MemoryRouter initialEntries={["/register"]}>
          <PathsInitializer />
        </MemoryRouter>
      );
    };

    render(<TestComponent />);
    expect(currentPath()).toBe("/register");
  });

  it("useSearchParamsGlobal hook returns search params", () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useSearchParamsGlobal(), { wrapper: TestWrapper });
    expect(result.current.get("q")).toBe("query");
  });

  it("covers all dynamic api route functions", () => {
    expect(apiRoutes.update_category_url("cat")).toContain("/admin/categories/cat");
    expect(apiRoutes.delete_category_url("cat")).toContain("/admin/categories/cat");
    expect(apiRoutes.message_thread_url("user@example.com")).toContain("/messages/thread/user%40example.com");
    expect(apiRoutes.read_message_url("msg-1")).toContain("/messages/msg-1/read");
    expect(apiRoutes.delete_message_url("msg-1")).toContain("/messages/msg-1");
    expect(apiRoutes.creator_followers_url("user@example.com")).toContain(
      "/creators/user%40example.com/followers"
    );
    expect(apiRoutes.publication_ratings_url("pub-1")).toContain("/ratings/publication/pub-1");
    expect(apiRoutes.creator_ratings_url("user@example.com")).toContain(
      "/ratings/creator/user%40example.com"
    );
    expect(apiRoutes.admin_update_user_url("user@example.com")).toContain("/admin/users/user%40example.com");
    expect(apiRoutes.admin_user_sanctions_url("user@example.com")).toContain(
      "/admin/users/user%40example.com/sanctions"
    );
    expect(apiRoutes.lift_sanction_url("sanc-1")).toContain("/admin/sanctions/sanc-1/lift");
  });
});
