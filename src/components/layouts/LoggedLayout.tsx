import { Outlet } from "react-router-dom";
import { useAuthSession } from "../../app/auth/AuthSessionContext";

export type AuthContext = {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  picture: string | null;
  role: string | null;
};

export default function LoggedLayout() {
  const authSession = useAuthSession();

  if (authSession.isLoading || !authSession.user) return null;

  const authContext: AuthContext = {
    isAuthenticated: authSession.isAuthenticated,
    email: authSession.user.email,
    name: authSession.user.name,
    picture: authSession.user.picture,
    role: authSession.user.role,
  };

  return <Outlet context={authContext} />;
}
