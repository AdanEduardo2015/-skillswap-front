import type { PublicationFilters } from "../../types";

export interface SearchFormValues {
  q: string;
  categoryId: string;
}

export const createEmptySearchFormValues = (): SearchFormValues => ({
  q: "",
  categoryId: "",
});

const clean = (value: string) => value.trim();

export const buildSearchFilters = (values: SearchFormValues): PublicationFilters => {
  const filters: PublicationFilters = {};
  const q = clean(values.q);
  const categoryId = clean(values.categoryId);

  if (q) filters.q = q;
  if (categoryId) filters.categoryId = categoryId;

  return filters;
};

export const hasSearchCriteria = (values: SearchFormValues): boolean => {
  const filters = buildSearchFilters(values);
  return Boolean(filters.q || filters.categoryId);
};

export const describeSearchFilters = (
  values: SearchFormValues,
  categoryNameById: Record<string, string>
): string[] => {
  const descriptions: string[] = [];

  if (values.q.trim()) descriptions.push(`Texto: ${values.q.trim()}`);
  if (values.categoryId)
    descriptions.push(`Categoria: ${categoryNameById[values.categoryId] ?? values.categoryId}`);

  return descriptions;
};
