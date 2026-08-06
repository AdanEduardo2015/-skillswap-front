import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useUserData } from "../../utils/UserStore";
import { clearAuthTokenCache } from "../../utils/GlobalVariables";
import { getSessionSnapshot, type SessionSnapshotOptions } from "./session";
import type { AuthSessionContextValue } from "./AuthSessionContext";
import { AuthSessionContext } from "./AuthSessionContext";
import { api } from "../../services/api";

interface AuthSessionProviderProps {
  children: ReactNode;
}

const initialState: Omit<AuthSessionContextValue, "refresh"> = {
  isLoading: true,
  isAuthenticated: false,
  role: "guest",
  user: null,
};


export default function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async (options: SessionSnapshotOptions = {}) => {
    setState((current) => ({ ...current, isLoading: true }));
    if (options.forceRefresh) clearAuthTokenCache();

    const store = useUserData.getState();
    const snapshot = await getSessionSnapshot(store.role, options);

    let dbRole = snapshot.user?.role || "guest";
    let dbActiveSanctions = [];

    if (snapshot.user) {
      store.setEmail(snapshot.user.email);
      store.setName(snapshot.user.name);
      store.setProfilePictureUrl(snapshot.user.picture);

      try {
        const response = await api.publications.listByUser(snapshot.user.email || "", 1);
        if (response.userProfile) {
          const profile = response.userProfile;
          dbRole = profile.role ?? snapshot.user.role;
          dbActiveSanctions = profile.activeSanctions ?? [];

          store.setProfileData({
            role: dbRole,
            isBanned: profile.isBanned || dbRole === "banned",
            activeSanctions: dbActiveSanctions,
            bio: profile.bio,
            location: profile.location,
            interests: profile.interests,
            specialty: profile.specialty,
            followersCount: profile.followersCount,
            followingCount: profile.followingCount,
            ratingAvg: profile.ratingAvg,
            ratingCount: profile.ratingCount,
            isVerified: profile.isVerified,
          });
        } else {
          store.setRole(snapshot.user.role);
        }
      } catch {
        store.setRole(snapshot.user.role);
      }
    } else {
      store.resetUser();
    }

    const nextState = {
      isLoading: false,
      isAuthenticated: snapshot.isAuthenticated,
      role: dbRole,
      user: snapshot.user ? { ...snapshot.user, role: dbRole } : null,
    };

    setState(nextState);
    return {
      isAuthenticated: nextState.isAuthenticated,
      role: nextState.role,
      user: nextState.user,
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      ...state,
      refresh,
    }),
    [refresh, state]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
