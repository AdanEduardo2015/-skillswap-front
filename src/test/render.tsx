import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import AppProviders from "../app/AppProviders";

interface RenderWithProvidersOptions {
  route?: string;
}

export const renderWithProviders = (ui: ReactElement, { route = "/" }: RenderWithProvidersOptions = {}) =>
  render(
    <AppProviders>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProviders>
  );
