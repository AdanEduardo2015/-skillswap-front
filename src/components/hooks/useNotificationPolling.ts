import { useEffect } from 'react';
import { api } from '../../services/api';
import { isUserAuthenticated } from '../../utils/GlobalVariables';
import { useNotificationStore } from '../../utils/NotificationStore';

export function useNotificationPolling() {
    const setHasUnreadNotifications = useNotificationStore((state) => state.setHasUnreadNotifications);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkNotifications = async () => {
            try {
                const isAuthenticated = await isUserAuthenticated();
                if (!isAuthenticated) return;

                const res = await api.notifications.list(1);

                const notifications = res.notifications || [];
                if (notifications.length > 0) {
                    setHasUnreadNotifications(true);
                } else {
                    setHasUnreadNotifications(false);
                }
            } catch {
            }
        };

        checkNotifications();

        intervalId = setInterval(checkNotifications, 30000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [setHasUnreadNotifications]);

    return null;
}
