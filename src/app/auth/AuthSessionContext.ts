import { createContext, useContext } from "react";
import type { SessionSnapshot, SessionSnapshotOptions, SessionUser } from "./session";
import type { UserRole } from "../../types";

export interface AuthSessionContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  user: SessionUser | null;
  refresh: (options?: SessionSnapshotOptions) => Promise<SessionSnapshot>;
}

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return context;
};
