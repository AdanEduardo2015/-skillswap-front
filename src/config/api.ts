const DEFAULT_API_BASE_URL = "http://localhost:4000";
const DEFAULT_LOCAL_AUTH_EMAIL = "";
const TRUE_VALUES = new Set(["1", "true", "yes", "si"]);
const FALSE_VALUES = new Set(["0", "false", "no"]);

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

const asEnvBoolean = (value: unknown, fallback: boolean) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
};

const isDev = Boolean(import.meta.env.DEV);
const localAuthEnabled = asEnvBoolean(import.meta.env.VITE_LOCAL_AUTH_ENABLED, false);

export const LOCAL_AUTH_EMAIL = String(
  import.meta.env.VITE_LOCAL_AUTH_EMAIL || (isDev ? DEFAULT_LOCAL_AUTH_EMAIL : "")
).trim();
export const LOCAL_AUTH_ROLE = String(import.meta.env.VITE_LOCAL_AUTH_ROLE || "consumer").trim();
export const IS_LOCAL_AUTH_ENABLED = isDev && localAuthEnabled && Boolean(LOCAL_AUTH_EMAIL);
