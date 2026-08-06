import type { UserRole } from "../types";

const ROLE_MAP: Record<string, UserRole> = {
  admin: "admin",
  admins: "admin",
  creator: "creator",
  creators: "creator",
  moderator: "creator",
  moderators: "creator",
  consumer: "consumer",
  consumers: "consumer",
  viewer: "consumer",
  viewers: "consumer",
  user: "consumer",
  users: "consumer",
  guest: "guest",
  banned: "banned",
};

const isTruthyFlag = (value: unknown) => value === true || String(value).trim().toLowerCase() === "true";

export const toKnownRole = (role: unknown): UserRole | null => {
  if (typeof role !== "string") return null;

  return ROLE_MAP[role.trim().toLowerCase()] ?? null;
};

export const normalizeRole = (role: unknown, isBanned?: unknown): UserRole => {
  if (isTruthyFlag(isBanned)) return "banned";

  return toKnownRole(role) ?? "consumer";
};
