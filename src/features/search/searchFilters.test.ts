import { describe, expect, it } from "vitest";
import {
  buildSearchFilters,
  createEmptySearchFormValues,
  describeSearchFilters,
  hasSearchCriteria,
} from "./searchFilters";

describe("advanced search filters", () => {
  it("builds backend filters from form values", () => {
    const filters = buildSearchFilters({
      q: " typescript ",
      categoryId: "programacion",
    });

    expect(filters).toEqual({
      q: "typescript",
      categoryId: "programacion",
    });
  });

  it("requires text or category as search criterion", () => {
    expect(hasSearchCriteria(createEmptySearchFormValues())).toBe(false);
    expect(hasSearchCriteria({ ...createEmptySearchFormValues(), q: "react" })).toBe(true);
    expect(hasSearchCriteria({ ...createEmptySearchFormValues(), categoryId: "tecnologia" })).toBe(true);
  });

  it("describes active filters for the UI", () => {
    const descriptions = describeSearchFilters(
      {
        ...createEmptySearchFormValues(),
        categoryId: "tecnologia",
      },
      { tecnologia: "Tecnologia" }
    );

    expect(descriptions).toContain("Categoria: Tecnologia");
    expect(descriptions).toHaveLength(1);
  });
});
