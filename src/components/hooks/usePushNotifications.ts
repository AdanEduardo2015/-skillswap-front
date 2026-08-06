import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useNotificationStore } from "../../utils/NotificationStore";
import { apiRoutes, isUserAuthenticated, getToken } from "../../utils/GlobalVariables";
import axios from "axios";

export const usePushNotifications = (pathname: string) => {
  const setHasUnreadNotifications = useNotificationStore((state) => state.setHasUnreadNotifications);
  const setPushRegistrationError = useNotificationStore((state) => state.setPushRegistrationError);

  useEffect(() => {
    const setupPush = async () => {
      if (Capacitor.getPlatform() !== "web") {
        const isAuth = await isUserAuthenticated();
        if (!isAuth) return;

        try {
          let permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== "granted") {
            return;
          }

          await PushNotifications.register();

          PushNotifications.addListener("registration", async (token) => {
            const jwtToken = await getToken();
            if (jwtToken) {
              try {
                await axios.post(
                  apiRoutes.update_fcm_token_url,
                  { fcm_token: token.value },
                  { headers: { Authorization: `Bearer ${jwtToken}` } }
                );
              } catch {
                setPushRegistrationError(true);
              }
            }
          });

          PushNotifications.addListener("registrationError", () => {
            setPushRegistrationError(true);
          });

          PushNotifications.addListener("pushNotificationReceived", () => {
            setHasUnreadNotifications(true);
          });

          PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
            setHasUnreadNotifications(true);

            const urlDestino = notification.notification.data.urlDestino;
            if (urlDestino) {
              window.location.href = urlDestino;
            }
          });
        } catch (error: unknown) {
          console.error("Error setting up push notifications:", error);
          setPushRegistrationError(true);
        }
      }
    };

    void setupPush();

    return () => {
      if (Capacitor.getPlatform() !== "web") {
        PushNotifications.removeAllListeners();
      }
    };
  }, [setHasUnreadNotifications, setPushRegistrationError, pathname]);
};
