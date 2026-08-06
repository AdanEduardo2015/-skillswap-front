import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState";
import { renderWithProviders } from "../../test/render";

describe("EmptyState", () => {
  it("renders title, description and optional action", () => {
    renderWithProviders(
      <EmptyState
        title="Sin resultados"
        description="Ajusta tu busqueda e intenta de nuevo."
        action={<button type="button">Reintentar</button>}
      />
    );

    expect(screen.getByRole("heading", { name: "Sin resultados" })).toBeInTheDocument();
    expect(screen.getByText("Ajusta tu busqueda e intenta de nuevo.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
