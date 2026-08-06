import type { UserSummary } from "../../types";
import { clearAuthTokenCache } from "../../utils/GlobalVariables";
import { useUserData } from "../../utils/UserStore";

type RefreshAuthSession = (options?: { forceRefresh?: boolean }) => Promise<unknown>;

export const applyUserSummaryToStore = (user: UserSummary) => {
  const store = useUserData.getState();

  store.setProfileData({
    email: user.email,
    name: user.username,
    profilePictureUrl: user.profilePicUrl ?? user.profilePicture ?? null,
    role: user.role,
    bio: user.bio ?? null,
    location: user.location ?? null,
    specialty: user.specialty ?? null,
    followersCount: user.followersCount ?? 0,
    followingCount: user.followingCount ?? 0,
    ratingAvg: user.ratingAvg ?? 0,
    ratingCount: user.ratingCount ?? 0,
    isBanned: Boolean(user.isBanned || user.role === "banned"),
    isVerified: Boolean(user.isVerified),
  });
};

export const syncAuthenticatedProfile = async (
  user: UserSummary | null | undefined,
  refreshAuthSession: RefreshAuthSession
) => {
  if (user) applyUserSummaryToStore(user);

  clearAuthTokenCache();
  await refreshAuthSession({ forceRefresh: true });
};
