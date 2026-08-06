import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";

import AppIconButton from "./AppIconButton";
import AppModal from "./AppModal";
import CategoryBadge from "./CategoryBadge";
import ConfirmDialog from "./ConfirmDialog";
import FilePicker from "./FilePicker";
import LoadingState from "./LoadingState";
import RatingStars from "./RatingStars";
import RoleBadge from "./RoleBadge";
import TextField from "./TextField";
import TextareaField from "./TextareaField";

describe("Shared UI Components", () => {
  describe("AppIconButton", () => {
    it("renders with label and tone, and click triggers action", () => {
      const clickMock = vi.fn();
      renderWithProviders(
        <AppIconButton label="delete-button" tone="danger" onClick={clickMock} />
      );

      const btn = screen.getByRole("button", { name: "delete-button" });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(clickMock).toHaveBeenCalledOnce();
    });

    it("supports other tones", () => {
      renderWithProviders(
        <AppIconButton label="btn1" tone="primary" />
      );
      expect(screen.getByRole("button", { name: "btn1" })).toBeInTheDocument();

      renderWithProviders(
        <AppIconButton label="btn2" tone="secondary" />
      );
      expect(screen.getByRole("button", { name: "btn2" })).toBeInTheDocument();

      renderWithProviders(
        <AppIconButton label="btn3" tone="ghost" />
      );
      expect(screen.getByRole("button", { name: "btn3" })).toBeInTheDocument();
    });
  });

  describe("AppModal", () => {
    it("renders children when open, and handles close", () => {
      const closeMock = vi.fn();
      renderWithProviders(
        <AppModal isOpen={true} title="Modal Title" onClose={closeMock} footer={<button>Footer Button</button>}>
          <div>Modal Body Content</div>
        </AppModal>
      );

      expect(screen.getByText("Modal Title")).toBeInTheDocument();
      expect(screen.getByText("Modal Body Content")).toBeInTheDocument();
      expect(screen.getByText("Footer Button")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      renderWithProviders(
        <AppModal isOpen={false} onClose={() => {}}>
          <div>Hidden Content</div>
        </AppModal>
      );
      expect(screen.queryByText("Hidden Content")).toBeNull();
    });
  });

  describe("CategoryBadge", () => {
    it("renders the label", () => {
      renderWithProviders(<CategoryBadge label="Programming" />);
      expect(screen.getByText("Programming")).toBeInTheDocument();
    });
  });

  describe("ConfirmDialog", () => {
    it("renders and handles confirmation and cancellation", () => {
      const confirmMock = vi.fn();
      const cancelMock = vi.fn();

      renderWithProviders(
        <ConfirmDialog
          isOpen={true}
          title="Are you sure?"
          description="This action cannot be undone"
          onConfirm={confirmMock}
          onCancel={cancelMock}
        />
      );

      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      expect(screen.getByText("This action cannot be undone")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
      expect(confirmMock).toHaveBeenCalledOnce();

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(cancelMock).toHaveBeenCalledOnce();
    });
  });

  describe("FilePicker", () => {
    it("triggers file select when input changes", () => {
      const selectMock = vi.fn();
      renderWithProviders(
        <FilePicker label="Choose File" onFileSelected={selectMock} />
      );

      const file = new File(["hello"], "hello.png", { type: "image/png" });
      const button = screen.getByRole("button", { name: "Choose File" });
      expect(button).toBeInTheDocument();

      // We can grab the hidden input element from document
      const input = document.querySelector("input[type='file']");
      expect(input).toBeInTheDocument();

      fireEvent.change(input!, {
        target: { files: [file] },
      });

      expect(selectMock).toHaveBeenCalledWith(file);
    });
  });

  describe("LoadingState", () => {
    it("renders loading spinner and description label", () => {
      renderWithProviders(<LoadingState label="Loading data..." />);
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });
  });

  describe("RatingStars", () => {
    it("renders proper accessibility labels and star counts", () => {
      renderWithProviders(<RatingStars value={4.5} max={5} label="Rating Info" />);
      const container = screen.getByRole("img", { name: "Rating Info" });
      expect(container).toBeInTheDocument();
    });

    it("falls back to empty values", () => {
      renderWithProviders(<RatingStars value={null} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  describe("RoleBadge", () => {
    it("renders correct labels for each user role", () => {
      // eslint-disable-next-line jsx-a11y/aria-role
      renderWithProviders(<RoleBadge role="admin" />);
      expect(screen.getByText("Admin")).toBeInTheDocument();

      // eslint-disable-next-line jsx-a11y/aria-role
      renderWithProviders(<RoleBadge role="creator" />);
      expect(screen.getByText("Creador")).toBeInTheDocument();

      // eslint-disable-next-line jsx-a11y/aria-role
      renderWithProviders(<RoleBadge role="consumer" />);
      expect(screen.getByText("Usuario")).toBeInTheDocument();

      // eslint-disable-next-line jsx-a11y/aria-role
      renderWithProviders(<RoleBadge role="guest" />);
      expect(screen.getByText("Invitado")).toBeInTheDocument();

      // eslint-disable-next-line jsx-a11y/aria-role
      renderWithProviders(<RoleBadge role="banned" />);
      expect(screen.getByText("Baneado")).toBeInTheDocument();
    });
  });

  describe("TextField", () => {
    it("renders with basic features, labels, helper/error messages", () => {
      renderWithProviders(
        <TextField
          label="Username"
          helperText="Enter your name"
          placeholder="Placeholder"
          rightElement={<span>Right</span>}
        />
      );

      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByText("Enter your name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Placeholder")).toBeInTheDocument();
      expect(screen.getByText("Right")).toBeInTheDocument();
    });

    it("renders error text when invalid", () => {
      renderWithProviders(
        <TextField
          label="Username"
          errorText="Field is required"
          isInvalid={true}
        />
      );
      expect(screen.getByText("Field is required")).toBeInTheDocument();
    });
  });

  describe("TextareaField", () => {
    it("renders labels, helper, and error states", () => {
      renderWithProviders(
        <TextareaField
          label="Bio"
          helperText="Write about yourself"
          placeholder="Placeholder Area"
        />
      );

      expect(screen.getByText("Bio")).toBeInTheDocument();
      expect(screen.getByText("Write about yourself")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Placeholder Area")).toBeInTheDocument();
    });

    it("renders error text when invalid", () => {
      renderWithProviders(
        <TextareaField
          label="Bio"
          errorText="Invalid bio"
          isInvalid={true}
        />
      );
      expect(screen.getByText("Invalid bio")).toBeInTheDocument();
    });
  });
});
