import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Messages from "./Messages";
import { renderWithProviders } from "../test/render";
import { useUserData } from "../utils/UserStore";

const apiMock = vi.hoisted(() => ({
  messages: {
    getSettings: vi.fn(),
    listConversations: vi.fn(),
    listThread: vi.fn(),
    markRead: vi.fn(),
    send: vi.fn(),
    delete: vi.fn(),
  },
  social: {
    listFollowing: vi.fn(),
    listFollowers: vi.fn(),
  },
  publications: {
    listByUser: vi.fn(),
  },
  admin: {
    updateMessagesSettings: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  api: apiMock,
}));

const setUser = (role: string, email = "me@test.com") => {
  useUserData.setState({
    email,
    name: "Test User",
    role,
    profilePictureUrl: null,
    bio: null,
    location: null,
    interests: [],
    specialty: null,
    followersCount: 0,
    followingCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    isBanned: false,
    isVerified: false,
    activeSanctions: [],
  });
};

describe("Messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setUser("consumer");

    apiMock.social.listFollowing.mockResolvedValue({
      following: [],
      nextToken: null,
      hasMore: false,
    });
    apiMock.social.listFollowers.mockResolvedValue({
      followers: [],
      nextToken: null,
      hasMore: false,
    });
    apiMock.messages.listConversations.mockResolvedValue({
      conversations: [],
      nextToken: null,
      hasMore: false,
    });
    apiMock.messages.listThread.mockResolvedValue({
      threadKey: "",
      messages: [],
      nextToken: null,
      hasMore: false,
    });
    apiMock.messages.markRead.mockResolvedValue({});
  });

  it("shows only Proximamente when messages are disabled", async () => {
    apiMock.messages.getSettings.mockResolvedValue({ messagesEnabled: false });

    renderWithProviders(<Messages />);

    expect(await screen.findByRole("heading", { name: "Próximamente" })).toBeInTheDocument();
    expect(apiMock.messages.listConversations).not.toHaveBeenCalled();
    expect(screen.queryByText("Chats")).not.toBeInTheDocument();
  });

  it("lets admins toggle the messages feature without showing chats", async () => {
    setUser("admin", "admin@test.com");
    apiMock.messages.getSettings.mockResolvedValue({ messagesEnabled: false });
    apiMock.admin.updateMessagesSettings.mockResolvedValue({
      messagesEnabled: true,
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "admin@test.com",
    });

    renderWithProviders(<Messages />);

    expect(
      await screen.findByText("El administrador solo puede activar o desactivar la funcion de mensajes.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Chats")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Habilitar" }));

    await waitFor(() => expect(apiMock.admin.updateMessagesSettings).toHaveBeenCalledWith(true));
    expect(await screen.findByText("Mensajes habilitados.")).toBeInTheDocument();
  });

  it("renders the two-panel messenger layout when messages are enabled", async () => {
    apiMock.messages.getSettings.mockResolvedValue({ messagesEnabled: true });
    apiMock.messages.listConversations.mockResolvedValue({
      conversations: [
        {
          threadKey: "ana@test.com#me@test.com",
          otherEmail: "ana@test.com",
          otherUsername: "Ana",
          lastMessage: "Hola",
          lastMessageAt: "2026-01-01T10:00:00.000Z",
          lastMessageId: "message-1",
          unreadCount: 0,
        },
      ],
      nextToken: null,
      hasMore: false,
    });
    apiMock.messages.listThread.mockResolvedValue({
      threadKey: "ana@test.com#me@test.com",
      messages: [
        {
          id: "message-1",
          threadKey: "ana@test.com#me@test.com",
          messageKey: "2026-01-01T10:00:00.000Z#message-1",
          senderEmail: "ana@test.com",
          recipientEmail: "me@test.com",
          content: "Hola",
          sentAt: "2026-01-01T10:00:00.000Z",
          status: "sent",
        },
      ],
      nextToken: null,
      hasMore: false,
    });

    renderWithProviders(<Messages />);

    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    const holas = await screen.findAllByText("Hola");
    expect(holas.length).toBeGreaterThan(0);
    expect(screen.getByRole("textbox", { name: "Mensaje" })).toBeInTheDocument();
  });
});
