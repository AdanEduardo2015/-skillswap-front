import { useState } from "react";
import { Box, Flex, Text, chakra } from "@chakra-ui/react";
import { FaPlus, FaTimes } from "react-icons/fa";
import { TextareaField, TextField, AppButton } from "../../shared/ui";
import type { Category } from "../../types";
import {
  PUBLICATION_CONTENT_MAX_LENGTH,
  PUBLICATION_MAX_TAGS,
  PUBLICATION_MAX_TAG_LENGTH,
  PUBLICATION_TITLE_MAX_LENGTH,
  type PublicationFormErrors,
  type PublicationFormValues,
} from "./publicationForm";

interface PublicationFormFieldsProps {
  values: PublicationFormValues;
  errors: PublicationFormErrors;
  categories: Category[];
  isLoadingCategories?: boolean;
  onChange: (values: Partial<PublicationFormValues>) => void;
}

const selectStyles = {
  width: "100%",
  minHeight: "44px",
  background: "var(--input-bg)",
  color: "var(--input-text)",
  border: "solid 0.05rem var(--input-border)",
  borderRadius: "12px",
  padding: "0 12px",
};

export default function PublicationFormFields({
  values,
  errors,
  categories,
  isLoadingCategories = false,
  onChange,
}: PublicationFormFieldsProps) {
  const [tagInput, setTagInput] = useState("");
  const [localTagError, setLocalTagError] = useState<string | null>(null);

  const categoryMessageId = errors.categoryId ? "publication-category-error" : undefined;

  const addTag = (rawText: string) => {
    setLocalTagError(null);
    const cleaned = rawText.trim().replace(/^#+/, "");

    if (!cleaned) {
      setTagInput("");
      return;
    }

    if (cleaned.length > PUBLICATION_MAX_TAG_LENGTH) {
      setLocalTagError(`La etiqueta no puede superar los ${PUBLICATION_MAX_TAG_LENGTH} caracteres.`);
      return;
    }

    if (values.tags.length >= PUBLICATION_MAX_TAGS) {
      setLocalTagError(`Solo se permiten hasta ${PUBLICATION_MAX_TAGS} etiquetas.`);
      return;
    }

    const tagLower = cleaned.toLowerCase();
    const isDuplicate = values.tags.some((t) => t.toLowerCase() === tagLower);

    if (isDuplicate) {
      setLocalTagError("Esta etiqueta ya fue agregada.");
      setTagInput("");
      return;
    }

    onChange({ tags: [...values.tags, cleaned] });
    setTagInput("");
  };

  const removeTag = (indexToRemove: number) => {
    setLocalTagError(null);
    const newTags = values.tags.filter((_, idx) => idx !== indexToRemove);
    onChange({ tags: newTags });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && values.tags.length > 0) {
      removeTag(values.tags.length - 1);
    }
  };

  return (
    <>
      <TextField
        label="Titulo"
        value={values.title}
        maxLength={PUBLICATION_TITLE_MAX_LENGTH}
        errorText={errors.title}
        helperText={`${values.title.length}/${PUBLICATION_TITLE_MAX_LENGTH}`}
        onChange={(event) => onChange({ title: event.target.value })}
      />

      <TextareaField
        label="Descripcion educativa"
        value={values.content}
        maxLength={PUBLICATION_CONTENT_MAX_LENGTH}
        minH="120px"
        resize="vertical"
        errorText={errors.content}
        helperText={`${values.content.length}/${PUBLICATION_CONTENT_MAX_LENGTH}`}
        placeholder="Explica el tema, pasos, contexto o aprendizaje que compartes."
        onChange={(event) => onChange({ content: event.target.value })}
      />

      <Box mb={4}>
        <chakra.label
          htmlFor="publication-category"
          color={errors.categoryId ? "red.500" : "inherit"}
          mb={2}
          display="block"
          fontWeight="600"
          fontSize="sm"
        >
          Categoría <chakra.span color="red.500">*</chakra.span>
        </chakra.label>
        <select
          id="publication-category"
          style={selectStyles}
          value={values.categoryId}
          disabled={isLoadingCategories}
          aria-invalid={Boolean(errors.categoryId) || undefined}
          aria-describedby={categoryMessageId}
          aria-busy={isLoadingCategories || undefined}
          onChange={(event) => onChange({ categoryId: event.currentTarget.value })}
        >
          <option value="">Selecciona una categoría (Obligatorio)</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <Text id={categoryMessageId} color="red.500" fontSize="sm" mt={1.5}>
            {errors.categoryId}
          </Text>
        )}
      </Box>

      {/* Interactive Tag Chips Input */}
      <Box mb={4}>
        <Flex align="center" justify="space-between" mb={2}>
          <chakra.label htmlFor="publication-tag-input" display="block" fontWeight="600" fontSize="sm">
            Etiquetas
          </chakra.label>
          <Text fontSize="xs" color="var(--text-muted)">
            {values.tags.length}/{PUBLICATION_MAX_TAGS} etiquetas
          </Text>
        </Flex>

        {/* Display Tag Chips */}
        {values.tags.length > 0 && (
          <Flex gap={2} wrap="wrap" mb={2.5}>
            {values.tags.map((tag, idx) => (
              <Flex
                key={`${tag}-${idx}`}
                align="center"
                gap={1.5}
                bg="var(--card-border)"
                color="var(--text-color)"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
                border="1px solid var(--modal-border)"
                boxShadow="xs"
              >
                <Text color="var(--nav-active)">#{tag}</Text>
                <chakra.button
                  type="button"
                  onClick={() => removeTag(idx)}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  bg="transparent"
                  color="var(--text-muted)"
                  _hover={{ color: "red.400" }}
                  aria-label={`Eliminar etiqueta ${tag}`}
                  cursor="pointer"
                >
                  <FaTimes size={10} />
                </chakra.button>
              </Flex>
            ))}
          </Flex>
        )}

        {/* Input Controls */}
        <Flex gap={2} align="center">
          <chakra.input
            id="publication-tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => {
              if (tagInput.trim()) {
                addTag(tagInput);
              }
            }}
            placeholder={
              values.tags.length >= PUBLICATION_MAX_TAGS
                ? "Límite de etiquetas alcanzado"
                : "Añade etiqueta (ej: typescript, react)"
            }
            disabled={values.tags.length >= PUBLICATION_MAX_TAGS}
            flex="1"
            h="44px"
            px={3}
            bg="var(--input-bg)"
            color="var(--input-text)"
            border="solid 0.05rem var(--input-border)"
            borderRadius="12px"
            fontSize="sm"
            _focus={{ outline: "none", borderColor: "brand.500" }}
          />
          <AppButton
            type="button"
            tone="secondary"
            disabled={!tagInput.trim() || values.tags.length >= PUBLICATION_MAX_TAGS}
            onClick={() => addTag(tagInput)}
            h="44px"
            px={4}
            borderRadius="12px"
          >
            <Flex align="center" gap={1.5} fontSize="xs">
              <FaPlus size={12} />
              <Text display={{ base: "none", sm: "inline" }}>Agregar</Text>
            </Flex>
          </AppButton>
        </Flex>

        {/* Error or Helper text */}
        {(localTagError || errors.tags) ? (
          <Text color="red.500" fontSize="xs" mt={1.5}>
            {localTagError || errors.tags}
          </Text>
        ) : (
          <Text fontSize="xs" color="var(--text-muted)" mt={1.5}>
            Presiona <chakra.kbd px={1.5} py={0.5} borderRadius="md" bg="transparent" border="1px solid var(--text-color)" color="var(--text-color)" fontSize="10px">Enter</chakra.kbd>, <chakra.kbd px={1.5} py={0.5} borderRadius="md" bg="transparent" border="1px solid var(--text-color)" color="var(--text-color)" fontSize="10px">,</chakra.kbd> o espacio para agregar cada etiqueta.
          </Text>
        )}
      </Box>
    </>
  );
}
