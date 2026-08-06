import { describe, expect, it } from "vitest";
import {
  buildCategoryPayload,
  categoryToFormValues,
  createEmptyCategoryFormValues,
  hasCategoryFormErrors,
  validateCategoryForm,
} from "./categoryForm";

describe("admin category form", () => {
  it("validates required name", () => {
    const errors = validateCategoryForm({
      ...createEmptyCategoryFormValues(),
      name: "",
    });

    expect(errors.name).toBeTruthy();
    expect(hasCategoryFormErrors(errors)).toBe(true);
  });

  it("validates name and description maximum length constraints", () => {
    const longNameErrors = validateCategoryForm({
      ...createEmptyCategoryFormValues(),
      name: "a".repeat(81),
    });
    expect(longNameErrors.name).toContain("80 caracteres");

    const longDescErrors = validateCategoryForm({
      ...createEmptyCategoryFormValues(),
      name: "test",
      description: "a".repeat(501),
    });
    expect(longDescErrors.description).toContain("500 caracteres");
  });

  it("builds backend payload with trimmed values", () => {
    expect(
      buildCategoryPayload({
        id: " tecnologia ",
        name: " Tecnologia ",
        description: " Recursos tecnicos ",
        isActive: false,
      })
    ).toEqual({
      id: "tecnologia",
      name: "Tecnologia",
      description: "Recursos tecnicos",
      isActive: false,
    });

    // Empty ID fallback to undefined
    expect(
      buildCategoryPayload({
        id: "",
        name: "Test",
        description: "Desc",
        isActive: true,
      })
    ).toEqual({
      id: undefined,
      name: "Test",
      description: "Desc",
      isActive: true,
    });
  });

  it("maps categories into editable form values", () => {
    expect(
      categoryToFormValues({
        id: "idiomas",
        name: "Idiomas",
        isActive: true,
      })
    ).toMatchObject({
      id: "idiomas",
      name: "Idiomas",
      description: "",
      isActive: true,
    });
  });
});
