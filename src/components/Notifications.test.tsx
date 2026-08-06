import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Notifications from "./Notifications";
import { renderWithProviders } from "../test/render";

const mockAuthSession = {
  isAuthenticated: true,
  isLoading: false,
  user: { email: "me@test.com", role: "consumer" },
};

vi.mock("../app/auth/AuthSessionContext", () => ({
  useAuthSession: () => mockAuthSession,
}));

const apiMock = vi.hoisted(() => ({
  notifications: {
    list: vi.fn(),
    read: vi.fn(),
    deleteAll: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
  admin: {
    updateNotificationsSettings: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  api: apiMock,
}));

describe("Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthSession.user = { email: "me@test.com", role: "consumer" };

    apiMock.notifications.list.mockResolvedValue({
      notifications: [],
    });
    apiMock.notifications.getSettings.mockResolvedValue({
      notificationsEnabled: true,
    });
    apiMock.notifications.updateSettings.mockResolvedValue({
      notificationsEnabled: false,
    });
  });

  it("shows Proximamente when notifications feature flag is disabled for normal users", async () => {
    apiMock.notifications.getSettings.mockResolvedValue({ notificationsEnabled: false });

    renderWithProviders(<Notifications />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Próximamente" })).toBeInTheDocument();
    });

    expect(
      screen.getByText("Estamos haciendo mejoras en el centro de notificaciones.")
    ).toBeInTheDocument();
  });

  it("always shows notification center for admins even when notifications are disabled", async () => {
    mockAuthSession.user = { email: "admin@test.com", role: "admin" };
    apiMock.notifications.getSettings.mockResolvedValue({ notificationsEnabled: false });

    renderWithProviders(<Notifications />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Notificaciones" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Alternar notificaciones (Admin)")).toBeInTheDocument();
  });

  it("allows admins to toggle notifications status using the discrete toggle button", async () => {
    const user = userEvent.setup();
    mockAuthSession.user = { email: "admin@test.com", role: "admin" };
    apiMock.notifications.getSettings.mockResolvedValue({ notificationsEnabled: true });
    apiMock.notifications.updateSettings.mockResolvedValue({ notificationsEnabled: false });

    renderWithProviders(<Notifications />);

    await waitFor(() => {
      expect(screen.getByLabelText("Alternar notificaciones (Admin)")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Alternar notificaciones (Admin)"));

    expect(apiMock.notifications.updateSettings).toHaveBeenCalledWith(false);
  });
});
