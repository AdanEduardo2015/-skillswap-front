import { create } from "zustand";

export interface NotificationState {
  hasUnreadNotifications: boolean;
  setHasUnreadNotifications: (value: boolean) => void;
  pushEnabled: boolean;
  setPushEnabled: (value: boolean) => void;
  pushRegistrationError: boolean;
  setPushRegistrationError: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  hasUnreadNotifications: false,
  setHasUnreadNotifications: (value) => set({ hasUnreadNotifications: value }),
  pushEnabled: false,
  setPushEnabled: (value) => set({ pushEnabled: value }),
  pushRegistrationError: false,
  setPushRegistrationError: (value) => set({ pushRegistrationError: value }),
}));
