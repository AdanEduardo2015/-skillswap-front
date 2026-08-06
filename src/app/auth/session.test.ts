import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  IS_LOCAL_AUTH_ENABLED: false,
  LOCAL_AUTH_EMAIL: "local@example.com",
  LOCAL_AUTH_ROLE: "creator",
}));

vi.mock("../../config/api", () => ({
  get IS_LOCAL_AUTH_ENABLED() { return apiMock.IS_LOCAL_AUTH_ENABLED; },
  get LOCAL_AUTH_EMAIL() { return apiMock.LOCAL_AUTH_EMAIL; },
  get LOCAL_AUTH_ROLE() { return apiMock.LOCAL_AUTH_ROLE; },
}));

const authMock = vi.hoisted(() => ({
  fetchAuthSession: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: authMock.fetchAuthSession,
}));

import { resolveSessionRole, getSessionSnapshot } from "./session";

describe("Session Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    apiMock.IS_LOCAL_AUTH_ENABLED = false;
    apiMock.LOCAL_AUTH_EMAIL = "local@example.com";
    apiMock.LOCAL_AUTH_ROLE = "creator";
  });

  describe("resolveSessionRole", () => {
    it("returns banned if persistedRole is banned or isBanned flag is true", () => {
      expect(resolveSessionRole("admin", "banned", false)).toBe("banned");
      expect(resolveSessionRole("admin", "creator", true)).toBe("banned");
    });

    it("returns admin if knownTokenRole is admin, even if persistedRole is creator", () => {
      expect(resolveSessionRole("admin", "creator")).toBe("admin");
    });

    it("returns creator if knownPersistedRole is creator and tokenRole is consumer", () => {
      expect(resolveSessionRole("consumer", "creator")).toBe("creator");
    });

    it("prefers knownTokenRole if present", () => {
      expect(resolveSessionRole("creator", "consumer")).toBe("creator");
      expect(resolveSessionRole("consumer", "guest")).toBe("consumer");
    });

    it("uses knownPersistedRole if tokenRole is null or unknown", () => {
      expect(resolveSessionRole(null, "creator")).toBe("creator");
      expect(resolveSessionRole("unknown_role", "consumer")).toBe("consumer");
    });

    it("falls back to consumer if no roles are valid", () => {
      expect(resolveSessionRole(null, null)).toBe("consumer");
      expect(resolveSessionRole("unknown", "guest")).toBe("consumer");
    });
  });

  describe("getSessionSnapshot", () => {
    it("returns guest snapshot if tokens are missing and local auth is disabled", async () => {
      authMock.fetchAuthSession.mockResolvedValueOnce({});
      const snapshot = await getSessionSnapshot();
      expect(snapshot.isAuthenticated).toBe(false);
      expect(snapshot.user).toBeNull();
      expect(snapshot.role).toBe("guest");
    });

    it("returns local auth snapshot if tokens are missing and local auth is enabled", async () => {
      apiMock.IS_LOCAL_AUTH_ENABLED = true;
      authMock.fetchAuthSession.mockResolvedValueOnce({});
      const snapshot = await getSessionSnapshot();
      expect(snapshot.isAuthenticated).toBe(true);
      expect(snapshot.user?.email).toBe("local@example.com");
      expect(snapshot.role).toBe("creator");
    });

    it("decodes claims correctly from cognito groups, custom:role, and basic fields", async () => {
      authMock.fetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
              name: "Test User",
              picture: "pic.png",
              "cognito:groups": ["admin"],
              "custom:role": "consumer",
              "custom:isBanned": "false",
            },
          },
        },
      });

      const snapshot = await getSessionSnapshot();
      expect(snapshot.isAuthenticated).toBe(true);
      expect(snapshot.role).toBe("consumer"); // custom:role "consumer" takes priority over groups ["admin"]
      expect(snapshot.user?.name).toBe("Test User");
      expect(snapshot.user?.email).toBe("test@example.com");
      expect(snapshot.user?.picture).toBe("pic.png");
    });

    it("resolves role from cognito groups if other role claims are missing", async () => {
      authMock.fetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
              "cognito:groups": ["admin"],
            },
          },
        },
      });

      const snapshot = await getSessionSnapshot();
      expect(snapshot.role).toBe("admin");
    });

    it("detects banned claim variations", async () => {
      // test custom:isBanned = true (boolean)
      authMock.fetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
              "custom:isBanned": true,
            },
          },
        },
      });
      let snapshot = await getSessionSnapshot();
      expect(snapshot.role).toBe("banned");

      // test custom:isBanned = "true" (string)
      authMock.fetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
              "custom:isBanned": "true",
            },
          },
        },
      });
      snapshot = await getSessionSnapshot();
      expect(snapshot.role).toBe("banned");

      // test isBanned = true
      authMock.fetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
              isBanned: true,
            },
          },
        },
      });
      snapshot = await getSessionSnapshot();
      expect(snapshot.role).toBe("banned");
    });

    it("handles cognito groups as string (non-array fallback) or empty", async () => {
      authMock.fetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
              "cognito:groups": "creator",
            },
          },
        },
      });
      const snapshot = await getSessionSnapshot();
      expect(snapshot.role).toBe("creator");
    });

    it("returns guest snapshot on catch/fetch error if local auth is disabled", async () => {
      authMock.fetchAuthSession.mockRejectedValueOnce(new Error("Network error"));
      const snapshot = await getSessionSnapshot();
      expect(snapshot.isAuthenticated).toBe(false);
      expect(snapshot.role).toBe("guest");
    });

    it("returns local auth snapshot on catch/fetch error if local auth is enabled", async () => {
      apiMock.IS_LOCAL_AUTH_ENABLED = true;
      authMock.fetchAuthSession.mockRejectedValueOnce(new Error("Network error"));
      const snapshot = await getSessionSnapshot();
      expect(snapshot.isAuthenticated).toBe(true);
      expect(snapshot.user?.email).toBe("local@example.com");
    });
  });
});
