import type { CreateUserPayload, UpdateUserPayload, UserRole, UserSummary } from "../../types";

export interface ProfileFormSnapshot {
  username: string;
  profilePicture: string;
  bio: string;
  specialty: string;
  role: UserRole;
}

export const emptyProfileSnapshot: ProfileFormSnapshot = {
  username: "",
  profilePicture: "",
  bio: "",
  specialty: "",
  role: "consumer",
};

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

export const profileSnapshotFromUser = (
  user?: Partial<UserSummary> | null,
  fallback: Partial<ProfileFormSnapshot> = {}
): ProfileFormSnapshot => ({
  username: asString(user?.username ?? fallback.username),
  profilePicture: asString(user?.profilePicUrl ?? user?.profilePicture ?? fallback.profilePicture),
  bio: asString(user?.bio ?? fallback.bio),
  specialty: asString(user?.specialty ?? fallback.specialty),
  role: user?.role ?? fallback.role ?? "consumer",
});

export const normalizeProfileSnapshot = (
  snapshot?: Partial<ProfileFormSnapshot> | null
): ProfileFormSnapshot => ({
  username: asString(snapshot?.username),
  profilePicture: asString(snapshot?.profilePicture),
  bio: asString(snapshot?.bio),
  specialty: asString(snapshot?.specialty),
  role: snapshot?.role ?? "consumer",
});

const normalizeSnapshot = (snapshot: ProfileFormSnapshot) => ({
  username: asString(snapshot.username).trim(),
  profilePicture: asString(snapshot.profilePicture).trim(),
  bio: asString(snapshot.bio).trim(),
  specialty: asString(snapshot.specialty).trim(),
  role: snapshot.role,
});

export const hasProfileChanges = (current: ProfileFormSnapshot, original: ProfileFormSnapshot): boolean =>
  JSON.stringify(normalizeSnapshot(current)) !== JSON.stringify(normalizeSnapshot(original));

export const buildCreateUserPayload = (values: ProfileFormSnapshot, email: string): CreateUserPayload => ({
  email,
  username: asString(values.username).trim(),
  role: "consumer",
  bio: asString(values.bio).trim(),
  specialty: asString(values.specialty).trim() || null,
});

export const buildUpdateUserPayload = (values: ProfileFormSnapshot): UpdateUserPayload => ({
  username: asString(values.username).trim(),
  profilePicUrl: asString(values.profilePicture).trim() || null,
  bio: asString(values.bio).trim(),
  specialty: asString(values.specialty).trim() || null,
});
