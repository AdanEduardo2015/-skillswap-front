import type { Category } from "../../../types";

export const CATEGORY_NAME_MAX_LENGTH = 80;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 500;

export interface CategoryFormValues {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

export const createEmptyCategoryFormValues = (): CategoryFormValues => ({
  id: "",
  name: "",
  description: "",
  isActive: true,
});

export const categoryToFormValues = (category: Category): CategoryFormValues => ({
  id: category.id,
  name: category.name,
  description: category.description ?? "",
  isActive: category.isActive !== false,
});

export const validateCategoryForm = (values: CategoryFormValues): CategoryFormErrors => {
  const errors: CategoryFormErrors = {};
  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) {
    errors.name = "Agrega un nombre para la categoría.";
  } else if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    errors.name = `El nombre no puede superar ${CATEGORY_NAME_MAX_LENGTH} caracteres.`;
  }

  if (description.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripción no puede superar ${CATEGORY_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  return errors;
};

export const hasCategoryFormErrors = (errors: CategoryFormErrors): boolean =>
  Object.values(errors).some(Boolean);

export const buildCategoryPayload = (values: CategoryFormValues): Partial<Category> => ({
  id: values.id.trim() || undefined,
  name: values.name.trim(),
  description: values.description.trim(),
  isActive: values.isActive,
});
