import { registerPlugin } from "@capacitor/core";

export interface OpenDefaultSettingsPlugin {
  checkAppLinksStatus: () => Promise<{ enabled?: boolean }>;
  openAppLinkSettings: () => Promise<void>;
  openNotificationSettings: () => Promise<void>;
}

export const OpenDefaultSettings = registerPlugin<OpenDefaultSettingsPlugin>("OpenDefaultSettings");
