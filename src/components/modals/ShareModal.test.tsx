import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import ShareModal from "./ShareModal";
import type { Publication } from "../../types";

const mockPost: Publication = {
  id: "post-123",
  title: "Aprende React 19 y TypeScript",
  content: "Guía completa para desarrollo frontend profesional.",
  creatorEmail: "autor@example.com",
  user: {
    email: "autor@example.com",
    username: "Juan Creador",
    role: "creator",
  },
  sharesCount: 5,
  likesCount: 12,
  dislikesCount: 1,
  commentsCount: 3,
  createdAt: "2026-07-28T00:00:00Z",
};

describe("ShareModal", () => {
  it("renders header, post preview, and only Copiar enlace button when open", () => {
    const handleClose = vi.fn();
    const handleShare = vi.fn();

    renderWithProviders(
      <ShareModal
        isOpen={true}
        onClose={handleClose}
        post={mockPost}
        onShare={handleShare}
      />
    );

    expect(screen.getByRole("heading", { name: "Compartir" })).toBeInTheDocument();
    expect(screen.getByText("Aprende React 19 y TypeScript")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar enlace" })).toBeInTheDocument();

    // Verify removed features are not present
    expect(screen.queryByPlaceholderText("Haz un comentario sobre esto...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compartir ahora" })).not.toBeInTheDocument();
    expect(screen.queryByText("Compartir en")).not.toBeInTheDocument();
  });

  it("calls onShare, shows toast, and closes modal when clicking Copiar enlace", async () => {
    const handleClose = vi.fn();
    const handleShare = vi.fn().mockResolvedValue(undefined);
    const handleToast = vi.fn();

    renderWithProviders(
      <ShareModal
        isOpen={true}
        onClose={handleClose}
        post={mockPost}
        onShare={handleShare}
        onShowToast={handleToast}
      />
    );

    const copyBtn = screen.getByRole("button", { name: "Copiar enlace" });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(handleShare).toHaveBeenCalledOnce();
      expect(handleClose).toHaveBeenCalledOnce();
      expect(handleToast).toHaveBeenCalledWith("✅ Enlace copiado al portapapeles");
    });
  });

  it("calls onClose when close button X is clicked", () => {
    const handleClose = vi.fn();
    const handleShare = vi.fn();

    renderWithProviders(
      <ShareModal
        isOpen={true}
        onClose={handleClose}
        post={mockPost}
        onShare={handleShare}
      />
    );

    const closeBtn = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledOnce();
  });
});
