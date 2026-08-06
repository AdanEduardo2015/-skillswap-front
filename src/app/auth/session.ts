import { fetchAuthSession, signOut } from "aws-amplify/auth";
import type { UserRole } from "../../types";
import { IS_LOCAL_AUTH_ENABLED, LOCAL_AUTH_EMAIL, LOCAL_AUTH_ROLE } from "../../config/api";
import { normalizeRole, toKnownRole } from "../../domain/roles";

export interface SessionUser {
  email: string | null;
  name: string | null;
  picture: string | null;
  role: UserRole;
  rawRole: string | null;
}

export interface SessionSnapshot {
  isAuthenticated: boolean;
  user: SessionUser | null;
  role: UserRole;
}

export interface SessionSnapshotOptions {
  forceRefresh?: boolean;
}

const guestSnapshot: SessionSnapshot = {
  isAuthenticated: false,
  user: null,
  role: "guest",
};

type TokenPayload = Record<string, unknown>;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  const singleValue = asString(value);
  return singleValue ? [singleValue] : [];
};

const firstKnownRole = (values: unknown[]) => {
  for (const value of values) {
    if (toKnownRole(value)) return value;
  }

  return null;
};

const isBannedClaim = (payload: TokenPayload) =>
  payload["custom:isBanned"] === true ||
  String(payload["custom:isBanned"]).trim().toLowerCase() === "true" ||
  payload.isBanned === true ||
  String(payload.isBanned).trim().toLowerCase() === "true";

const buildLocalSessionSnapshot = (persistedRole?: unknown): SessionSnapshot => {
  const baseRole = toKnownRole(persistedRole) || LOCAL_AUTH_ROLE;
  const role = normalizeRole(baseRole);

  return {
    isAuthenticated: true,
    role,
    user: {
      email: LOCAL_AUTH_EMAIL,
      name: null,
      picture: null,
      role,
      rawRole: String(baseRole),
    },
  };
};

export const resolveSessionRole = (
  tokenRole: unknown,
  persistedRole?: unknown,
  isBanned?: unknown
): UserRole => {
  if (normalizeRole(persistedRole) === "banned" || isBanned === true) {
    return "banned";
  }

  const knownTokenRole = toKnownRole(tokenRole);
  const knownPersistedRole = toKnownRole(persistedRole);

  if (knownTokenRole === "admin") {
    return "admin";
  }

  if (knownPersistedRole === "creator" && knownTokenRole === "consumer") {
    return "creator";
  }

  if (knownTokenRole) return normalizeRole(knownTokenRole, isBanned);

  if (knownPersistedRole && knownPersistedRole !== "guest") {
    return normalizeRole(knownPersistedRole, isBanned);
  }

  return normalizeRole(null, isBanned);
};

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

export const getSessionSnapshot = async (
  persistedRole?: unknown,
  options: SessionSnapshotOptions = {}
): Promise<SessionSnapshot> => {
  if (IS_LOCAL_AUTH_ENABLED) {
    return buildLocalSessionSnapshot(persistedRole);
  }

  if (!hasCognitoKeys()) {
    return guestSnapshot;
  }

  try {
    const { tokens } = options.forceRefresh
      ? await fetchAuthSession({ forceRefresh: true })
      : await fetchAuthSession();
    const idToken = tokens?.idToken;

    if (!idToken) {
      return guestSnapshot;
    }

    const payload = idToken.payload as TokenPayload;
    const groups = asStringArray(payload["cognito:groups"]);
    const rawRole = firstKnownRole([payload["custom:role"], payload.role, ...groups]);
    const role = resolveSessionRole(rawRole, persistedRole, isBannedClaim(payload));

    return {
      isAuthenticated: true,
      role,
      user: {
        email: asString(payload.email),
        name: asString(payload.name),
        picture: asString(payload.picture),
        role,
        rawRole: asString(rawRole),
      },
    };
  } catch {
    return guestSnapshot;
  }
};

export const appSignOut = async (): Promise<void> => {
  if (hasCognitoKeys()) {
    try {
      await signOut();
    } catch {
      // Continue even if Cognito returns error
    }
  }

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("CognitoIdentityServiceProvider") || key.startsWith("amplify"))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
};
