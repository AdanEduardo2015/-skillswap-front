import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  requestUse: vi.fn(),
  responseUse: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: axiosMock.get,
      post: axiosMock.post,
      put: axiosMock.put,
      delete: axiosMock.delete,
      interceptors: {
        request: { use: axiosMock.requestUse },
        response: { use: axiosMock.responseUse },
      },
    })),
  },
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(async () => ({})),
}));

import { api, normalizeRole } from "./api";

describe("Frontend API Service", () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();
    axiosMock.delete.mockReset();
  });

  it("maps legacy publication fields to camelCase", async () => {
    const rawData = {
      items: [{ Id_publicacion: "123", Contenido: "Hola" }],
      nextToken: "abc",
    };

    axiosMock.get.mockResolvedValue({ data: rawData });

    const response = await api.publications.list(10);

    expect(response.items[0].id).toBe("123");
    expect(response.items[0].content).toBe("Hola");
    expect(response.hasMore).toBe(true);
  });

  it("normalizes legacy and current roles", () => {
    expect(normalizeRole("user")).toBe("consumer");
    expect(normalizeRole("users")).toBe("consumer");
    expect(normalizeRole("moderator")).toBe("creator");
    expect(normalizeRole("moderators")).toBe("creator");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("consumer")).toBe("consumer");
    expect(normalizeRole("creator")).toBe("creator");
    expect(normalizeRole("consumer", true)).toBe("banned");
  });

  it("maps educational publication contract fields", async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        items: [
          {
            id: "pub-1",
            title: "Intro a TypeScript",
            content: "Contenido educativo",
            categoryId: "tecnologia",
            category: { name: "Tecnologia" },
            format: "article",
            tags: ["typescript"],
            isSaved: true,
            savedCount: 4,
            ratingAvg: 4.5,
            ratingCount: 2,
            user: {
              email: "creator@example.com",
              username: "Creador",
              role: "moderator",
              profilePicture: "https://example.com/avatar.png",
            },
          },
        ],
      },
    });

    const response = await api.publications.list(10);
    const publication = response.items[0];

    expect(publication.title).toBe("Intro a TypeScript");
    expect(publication.categoryId).toBe("tecnologia");
    expect(publication.categoryName).toBe("Tecnologia");
    expect(publication.format).toBe("article");
    expect(publication.tags).toEqual(["typescript"]);
    expect(publication.isSaved).toBe(true);
    expect(publication.savedCount).toBe(4);
    expect(publication.ratingAvg).toBe(4.5);
    expect(publication.user?.role).toBe("creator");
  });

  it("maps publication author snapshot and avoids generic Usuario fallback", async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        items: [
          {
            id: "pub-author",
            title: "Con autor",
            content: "Contenido",
            authorEmail: "ana@example.com",
            authorUsername: "Ana creadora",
            authorProfilePicture: "https://cdn.example.com/ana.png",
          },
          {
            id: "pub-email",
            title: "Con email",
            content: "Contenido",
            creatorEmail: "bruno@example.com",
          },
        ],
      },
    });

    const response = await api.publications.list(10);

    expect(response.items[0].authorUsername).toBe("Ana creadora");
    expect(response.items[0].user).toMatchObject({
      email: "ana@example.com",
      username: "Ana creadora",
      profilePicUrl: "https://cdn.example.com/ana.png",
    });
    expect(response.items[1].user).toMatchObject({
      email: "bruno@example.com",
      username: "bruno",
    });
  });

  it("maps extended user profile fields from list by user", async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        items: [],
        user: {
          email: "creator@example.com",
          username: "Creador",
          role: "creator",
          bio: "Ensenanza de frontend",
          location: "CDMX",
          interests: "react,typescript",
          specialty: "Frontend",
          followersCount: 7,
          followingCount: 3,
          ratingAvg: 4.8,
          ratingCount: 5,
          userRating: 4,
          isVerified: true,
        },
      },
    });

    const response = await api.publications.listByUser("creator@example.com");

    expect(response.userProfile).toMatchObject({
      email: "creator@example.com",
      username: "Creador",
      role: "creator",
      bio: "Ensenanza de frontend",
      location: "CDMX",
      interests: ["react", "typescript"],
      specialty: "Frontend",
      followersCount: 7,
      followingCount: 3,
      ratingAvg: 4.8,
      ratingCount: 5,
      userRating: 4,
      isVerified: true,
    });
  });

  it("sends extended profile fields when creating a user", async () => {
    axiosMock.post.mockResolvedValue({ data: {} });

    await api.users.create({
      email: "creator@example.com",
      username: "Creador",
      role: "creator",
      bio: "Perfil publico",
      location: "Monterrey",
      interests: ["educacion"],
      specialty: "Diseno UX",
    });

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        email: "creator@example.com",
        username: "Creador",
        role: "creator",
        bio: "Perfil publico",
        location: "Monterrey",
        interests: ["educacion"],
        specialty: "Diseno UX",
      })
    );
  });

  it("maps rating creation summary from backend", async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        message: "Calificacion creada",
        rating: {
          targetType: "publication",
          targetId: "pub-1",
          email: "consumer@example.com",
          rating: 5,
        },
        summary: {
          ratingAvg: 4.75,
          ratingCount: 4,
        },
      },
    });

    const response = await api.ratings.create({
      targetType: "publication",
      targetId: "pub-1",
      rating: 5,
    });

    expect(response.summary).toEqual({
      ratingAvg: 4.75,
      ratingCount: 4,
    });
    expect(response.rating?.rating).toBe(5);
    expect(axiosMock.post).toHaveBeenCalledWith(expect.any(String), {
      targetType: "publication",
      targetId: "pub-1",
      rating: 5,
    });
  });

  it("sends advanced search filters without empty params", async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        items: [],
        nextToken: null,
      },
    });

    await api.search.list({
      q: "typescript",
      categoryId: "programacion",
      tags: ["react", "aws"],
      format: "article",
      creatorEmail: "creator@example.com",
      sort: "topRated",
    });

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          q: "typescript",
          categoryId: "programacion",
          tags: "react,aws",
          format: "article",
          creatorEmail: "creator@example.com",
          sort: "topRated",
          limit: 20,
        }),
      })
    );
  });

  it("lists categories from backend contract", async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        categories: [{ id: "salud", name: "Salud", isActive: true }],
      },
    });

    const categories = await api.categories.list();

    expect(categories[0]).toMatchObject({
      id: "salud",
      name: "Salud",
      isActive: true,
    });
  });

  it("maps admin category mutations from backend contract", async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        category: {
          id: "tecnologia",
          name: "Tecnologia",
          description: "Contenido tecnico",
          isActive: true,
        },
      },
    });
    axiosMock.put.mockResolvedValue({
      data: {
        category: {
          id: "tecnologia",
          name: "Tecnologia aplicada",
          isActive: false,
        },
      },
    });

    const created = await api.admin.createCategory({ name: "Tecnologia" });
    const updated = await api.admin.updateCategory("tecnologia", { name: "Tecnologia aplicada" });

    expect(created).toMatchObject({
      id: "tecnologia",
      name: "Tecnologia",
      description: "Contenido tecnico",
      isActive: true,
    });
    expect(updated).toMatchObject({
      id: "tecnologia",
      name: "Tecnologia aplicada",
      isActive: false,
    });
  });

  it("maps report create, list and review contracts", async () => {
    axiosMock.post
      .mockResolvedValueOnce({
        data: {
          report: {
            id: "report-1",
            targetType: "publication",
            targetId: "pub-1",
            reporterEmail: "user@example.com",
            reason: "Spam",
            status: "pending",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          report: {
            id: "report-1",
            targetType: "publication",
            targetId: "pub-1",
            reporterEmail: "user@example.com",
            reason: "Spam",
            status: "actioned",
            reviewNotes: "Oculto",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        },
      });
    axiosMock.get.mockResolvedValue({
      data: {
        reports: [
          {
            id: "report-1",
            targetType: "publication",
            targetId: "pub-1",
            reporterEmail: "user@example.com",
            reason: "Spam",
            status: "pending",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        nextToken: "next",
      },
    });

    const created = await api.reports.create({
      targetType: "publication",
      targetId: "pub-1",
      reason: "Spam",
    });
    const listed = await api.admin.listReports("pending", 10, "next");
    const reviewed = await api.admin.reviewReport("report-1", "actioned", "Oculto");

    expect(created).toMatchObject({
      id: "report-1",
      status: "pending",
    });
    expect(listed).toMatchObject({
      hasMore: true,
      nextToken: "next",
    });
    expect(listed.reports[0].targetId).toBe("pub-1");
    expect(reviewed).toMatchObject({
      id: "report-1",
      status: "actioned",
      reviewNotes: "Oculto",
    });
    expect(axiosMock.post).toHaveBeenNthCalledWith(2, expect.any(String), {
      id: "report-1",
      status: "actioned",
      notes: "Oculto",
    });
    expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
      params: {
        status: "pending",
        limit: 10,
        nextToken: "next",
      },
    });
  });

  it("maps creator dashboard aggregate metrics", async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        dashboard: {
          creator: {
            email: "creator@example.com",
            username: "Creador",
            followersCount: "7",
            ratingAvg: "4.5",
            ratingCount: "2",
          },
          totals: {
            publications: "2",
            views: "14",
            likes: "4",
            comments: "3",
            shares: "1",
            saved: "6",
            ratingAvg: "4.33",
            ratingCount: "3",
          },
          topPublications: {
            byViews: [
              { id: "pub-1", title: "Uno", categoryId: "tech", createdAt: "2026-01-01", viewsCount: "10" },
            ],
            byRating: [
              { id: "pub-1", title: "Uno", categoryId: "tech", createdAt: "2026-01-01", ratingAvg: "5" },
            ],
            bySaved: [
              { id: "pub-2", title: "Dos", categoryId: "art", createdAt: "2026-01-02", savedCount: "4" },
            ],
          },
        },
      },
    });

    const dashboard = await api.creatorDashboard.get();

    expect(dashboard.creator).toMatchObject({
      email: "creator@example.com",
      followersCount: 7,
      ratingAvg: 4.5,
    });
    expect(dashboard.totals).toMatchObject({
      publications: 2,
      views: 14,
      ratingAvg: 4.33,
    });
    expect(dashboard.topPublications.byViews[0]).toMatchObject({
      id: "pub-1",
      viewsCount: 10,
    });
  });

  it("records a publication view through backend contract", async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        message: "Vista registrada",
        counted: true,
        viewsCount: "11",
      },
    });

    const response = await api.publications.recordView("pub-1");

    expect(response).toMatchObject({
      counted: true,
      viewsCount: 11,
    });
    expect(axiosMock.post).toHaveBeenCalledWith(expect.stringContaining("/publications/view"), {
      publicationId: "pub-1",
    });
  });

  it("reads messages feature settings", async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        messages: {
          messagesEnabled: true,
          updatedAt: "2026-01-01T00:00:00.000Z",
          updatedBy: "admin@test.com",
        },
      },
    });

    const settings = await api.messages.getSettings();

    expect(settings).toMatchObject({
      messagesEnabled: true,
      updatedBy: "admin@test.com",
    });
    expect(axiosMock.get).toHaveBeenCalledWith(expect.stringContaining("/messages/settings"));
  });

  it("updates messages feature settings through admin contract", async () => {
    axiosMock.put.mockResolvedValue({
      data: {
        messages: {
          messagesEnabled: false,
        },
      },
    });

    const settings = await api.admin.updateMessagesSettings(false);

    expect(settings.messagesEnabled).toBe(false);
    expect(axiosMock.put).toHaveBeenCalledWith(expect.stringContaining("/admin/messages/settings"), {
      messagesEnabled: false,
    });
  });

  it("sends backend media kind even when called with legacy upload context", async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        uploadUrl: "https://upload.example.com",
        fileUrl: "https://cdn.example.com/avatar.png",
      },
    });

    await api.media.getPresignedUrl("avatar.png", "image/png", "profile");

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining("/media/presigned-url"),
      expect.objectContaining({
        fileName: "avatar.png",
        fileType: "image/png",
        type: "image",
        context: "profile",
      })
    );
  });
});
