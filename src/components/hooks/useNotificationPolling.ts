import { useEffect } from "react";
import { useAuthSession } from "../../app/auth/AuthSessionContext";
import { api } from "../../services/api";
import { getToken } from "../../utils/GlobalVariables";
import { useNotificationStore } from "../../utils/NotificationStore";
import { useUserData } from "../../utils/UserStore";

const isRecoverableAuthError = (error: unknown) => {
  if (!(error instanceof Error)) return false;

  const status = (error as Error & { status?: number }).status;
  return (
    (status === 401 || status === 404) &&
    /^(No autorizado|Usuario no encontrado|Unauthorized)$/i.test(error.message)
  );
};

export function useNotificationPolling() {
  const setHasUnreadNotifications = useNotificationStore((state) => state.setHasUnreadNotifications);
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const storedEmail = useUserData((state) => state.email);
  const canPoll = !isLoading && isAuthenticated && Boolean(user?.email || storedEmail);

  useEffect(() => {
    if (!canPoll) {
      setHasUnreadNotifications(false);
      return;
    }

    let isActive = true;

    const checkNotifications = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (isActive) setHasUnreadNotifications(false);
          return;
        }

        const res = await api.notifications.list(1);
        if (!isActive) return;

        const notifications = res.notifications || [];
        setHasUnreadNotifications(notifications.length > 0);
      } catch (error: unknown) {
        if (isRecoverableAuthError(error)) {
          if (isActive) setHasUnreadNotifications(false);
          return;
        }

        console.error("Error polling notifications:", error);
      }
    };

    void checkNotifications();

    const intervalId = setInterval(checkNotifications, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [canPoll, setHasUnreadNotifications]);

  return null;
}
