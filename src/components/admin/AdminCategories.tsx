import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Flex, Heading, Separator, Spinner, Text, VStack, chakra } from "@chakra-ui/react";
import { api } from "../../services/api";
import type { Category } from "../../types";
import { FALLBACK_PUBLICATION_CATEGORIES } from "../../features/publications/publicationForm";
import { AppButton, EmptyState, TextareaField, TextField } from "../../shared/ui";
import {
  buildCategoryPayload,
  categoryToFormValues,
  createEmptyCategoryFormValues,
  hasCategoryFormErrors,
  validateCategoryForm,
  type CategoryFormErrors,
  type CategoryFormValues,
} from "../../features/admin/categories/categoryForm";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formValues, setFormValues] = useState<CategoryFormValues>(createEmptyCategoryFormValues);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name)),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedCategories;
    return sortedCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [sortedCategories, searchQuery]);

  const loadCategories = async () => {
    setIsLoading(true);
    setFeedbackMessage("");

    try {
      const [catsResult, pubsResult] = await Promise.allSettled([
        api.categories.list(true),
        api.publications.list(100),
      ]);

      const apiCatMap = new Map<string, Category>();
      if (catsResult.status === "fulfilled") {
        catsResult.value.forEach((cat) => apiCatMap.set(cat.id, cat));
      }

      const combinedCategories: Category[] = [];
      const seenIds = new Set<string>();

      FALLBACK_PUBLICATION_CATEGORIES.forEach((fbCat) => {
        seenIds.add(fbCat.id);
        const apiVer = apiCatMap.get(fbCat.id);
        combinedCategories.push(
          apiVer
            ? { ...fbCat, ...apiVer, description: apiVer.description || fbCat.description }
            : fbCat
        );
      });

      if (catsResult.status === "fulfilled") {
        catsResult.value.forEach((apiCat) => {
          if (!seenIds.has(apiCat.id)) {
            combinedCategories.push(apiCat);
          }
        });
      }

      if (pubsResult.status === "fulfilled") {
        const countsMap = new Map<string, number>();
        pubsResult.value.items.forEach((pub) => {
          if (pub.categoryId) {
            countsMap.set(pub.categoryId, (countsMap.get(pub.categoryId) || 0) + 1);
          }
        });
        combinedCategories.forEach((cat) => {
          cat.publicationsCount = countsMap.get(cat.id) || 0;
        });
      }

      setCategories(combinedCategories);
    } catch (error: unknown) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudieron cargar las categorías.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const resetForm = () => {
    setFormValues(createEmptyCategoryFormValues());
    setErrors({});
    setEditingCategoryId(null);
  };

  const startEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setFormValues(categoryToFormValues(category));
    setErrors({});
  };

  const handleToggleActive = async (category: Category) => {
    const nextActiveState = !(category.isActive ?? true);
    setFeedbackMessage("");

    try {
      let updated: Category;
      try {
        updated = await api.admin.updateCategory(category.id, {
          name: category.name,
          description: category.description,
          isActive: nextActiveState,
        });
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        const isNotFound =
          errMessage.includes("404") ||
          errMessage.toLowerCase().includes("no encontrada") ||
          errMessage.toLowerCase().includes("not found");

        if (isNotFound) {
          updated = await api.admin.createCategory({
            id: category.id,
            name: category.name,
            description: category.description,
            isActive: nextActiveState,
          });
        } else {
          throw err;
        }
      }

      setCategories((current) =>
        current.map((item) => (item.id === category.id ? { ...item, ...updated, isActive: nextActiveState } : item))
      );
      setFeedbackMessage(
        `Categoría "${category.name}" ${nextActiveState ? "activada" : "desactivada"}.`
      );
    } catch (error: unknown) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo cambiar el estado de la categoría.");
    }
  };

  const handleSave = async () => {
    const validationErrors = validateCategoryForm(formValues);
    setErrors(validationErrors);

    if (hasCategoryFormErrors(validationErrors)) return;

    setIsSaving(true);
    setFeedbackMessage("");

    try {
      const payload = buildCategoryPayload(formValues);
      let savedCategory: Category;

      if (editingCategoryId) {
        try {
          savedCategory = await api.admin.updateCategory(editingCategoryId, payload);
        } catch (err: unknown) {
          const errMessage = err instanceof Error ? err.message : String(err);
          const isNotFound =
            errMessage.includes("404") ||
            errMessage.toLowerCase().includes("no encontrada") ||
            errMessage.toLowerCase().includes("not found");

          if (isNotFound) {
            savedCategory = await api.admin.createCategory({
              ...payload,
              id: editingCategoryId,
            });
          } else {
            throw err;
          }
        }
      } else {
        savedCategory = await api.admin.createCategory(payload);
      }

      setCategories((current) => {
        const exists = current.some((category) => category.id === savedCategory.id);
        if (exists) {
          return current.map((category) => (category.id === savedCategory.id ? { ...category, ...savedCategory } : category));
        }
        return [...current, savedCategory];
      });
      setFeedbackMessage(editingCategoryId ? "Categoría actualizada." : "Categoría creada.");
      resetForm();
    } catch (error: unknown) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo guardar la categoría.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={6} color="var(--text-color)">
      <Heading as="h1" size="4xl" mb={2}>
        Categorias
      </Heading>
      <Text color="var(--text-muted)" mb={6}>
        Administra las categorías de habilidades de SkillSwap (Creación, edición y estado activo/inactivo).
      </Text>

      <Flex direction={{ base: "column", lg: "row" }} gap={6} align="flex-start">
        <Box
          as="section"
          w={{ base: "100%", lg: "360px" }}
          p={5}
          border="1px solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          bg="var(--card-bg)"
        >
          <Heading as="h2" size="lg" mb={4}>
            {editingCategoryId ? "Editar categoría" : "Nueva categoría"}
          </Heading>

          <VStack align="stretch" gap={4}>
            <TextField
              label="Nombre *"
              value={formValues.name}
              errorText={errors.name}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />

            <TextareaField
              label="Descripción"
              value={formValues.description}
              errorText={errors.description}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            <chakra.label display="flex" alignItems="center" gap={2} cursor="pointer" fontSize="sm" color="var(--text-color)">
              <input
                type="checkbox"
                checked={formValues.isActive}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Categoría activa
            </chakra.label>
          </VStack>

          <Flex gap={3} mt={6}>
            {editingCategoryId && (
              <AppButton tone="ghost" type="button" onClick={resetForm} disabled={isSaving}>
                Cancelar
              </AppButton>
            )}
            <AppButton type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? (
                <Spinner size="sm" />
              ) : editingCategoryId ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </AppButton>
          </Flex>

          {feedbackMessage && (
            <Text mt={4} color={feedbackMessage.includes("No se") ? "red.400" : "green.300"}>
              {feedbackMessage}
            </Text>
          )}
        </Box>

        <Box as="section" flex="1" w="100%">
          <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
            <Heading as="h2" size="lg">
              Listado
            </Heading>
            <AppButton tone="ghost" onClick={() => void loadCategories()} disabled={isLoading}>
              Recargar
            </AppButton>
          </Flex>

          <Box mb={4}>
            <TextField
              placeholder="🔍 Buscar categoría por nombre o ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </Box>

          {isLoading ? (
            <Flex justify="center" py={12}>
              <Spinner color="var(--text-color)" />
            </Flex>
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No se encontraron categorías." : "No hay categorías registradas."}
              description={searchQuery ? `No hay resultados para "${searchQuery}"` : undefined}
              minH="30vh"
            />
          ) : (
            <VStack align="stretch" gap={0} borderTop="1px solid" borderColor="var(--card-border)">
              {filteredCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  isEditing={editingCategoryId === category.id}
                  onEdit={() => startEdit(category)}
                  onToggleActive={() => void handleToggleActive(category)}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function CategoryRow({
  category,
  isEditing,
  onEdit,
  onToggleActive,
}: {
  category: Category;
  isEditing: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const isInactive = category.isActive === false;

  return (
    <Box py={4} opacity={isInactive ? 0.6 : 1} transition="opacity 0.2s ease">
      <Flex
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={4}
        direction={{ base: "column", md: "row" }}
      >
        <Box flex="1">
          <Flex gap={2} align="center" wrap="wrap" mb={1}>
            <Heading as="h3" size="md">
              {category.name}
            </Heading>
            <Badge borderRadius="panel" colorPalette={isInactive ? "red" : "green"}>
              {isInactive ? "Inactiva" : "Activa"}
            </Badge>
            <Badge borderRadius="panel" colorPalette="purple">
              {category.publicationsCount ?? 0} publicaciones
            </Badge>
            {isEditing && (
              <Badge borderRadius="panel" colorPalette="blue">
                Editando
              </Badge>
            )}
          </Flex>
          <Text color="var(--text-muted)" fontSize="sm" mb={1}>
            ID: {category.id}
          </Text>
          {category.description && (
            <Text color="var(--text-color)" fontSize="sm" whiteSpace="pre-wrap">
              {category.description}
            </Text>
          )}
        </Box>

        <Flex gap={2} align="center" justify={{ base: "flex-start", md: "flex-end" }} wrap="wrap">
          <AppButton type="button" tone="secondary" onClick={onEdit}>
            Editar
          </AppButton>
          <AppButton
            type="button"
            tone={isInactive ? "primary" : "danger"}
            onClick={onToggleActive}
          >
            {isInactive ? "Activar" : "Desactivar"}
          </AppButton>
        </Flex>
      </Flex>
      <Separator borderColor="var(--card-border)" mt={4} />
    </Box>
  );
}
