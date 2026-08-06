import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Badge, Box, Flex, Heading, Text } from "@chakra-ui/react";
import InfiniteScroll from "react-infinite-scroll-component";
import { api } from "../services/api";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import { SkeletonFeed } from "./Skeletons";
import type { Publication } from "../types";
import { AppButton, EmptyState, TextField } from "../shared/ui";
import { usePublicationCategories } from "../features/publications/usePublicationCategories";
import {
  buildSearchFilters,
  createEmptySearchFormValues,
  describeSearchFilters,
  hasSearchCriteria,
  type SearchFormValues,
} from "../features/search/searchFilters";

const selectStyles = {
  width: "100%",
  minHeight: "44px",
  background: "var(--input-bg)",
  color: "var(--input-text)",
  border: "solid 0.05rem var(--input-border)",
  borderRadius: "12px",
  padding: "0 12px",
};

function Search() {
  const { categories, isLoadingCategories } = usePublicationCategories();
  const [filters, setFilters] = useState<SearchFormValues>(createEmptySearchFormValues);
  const [results, setResults] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const activeFilterDescriptions = useMemo(
    () => describeSearchFilters(filters, categoryNameById),
    [categoryNameById, filters]
  );

  const updateFilters = (values: Partial<SearchFormValues>) => {
    setFilters((current) => ({ ...current, ...values }));
    setFeedbackMessage("");
  };

  const loadSearch = async (token: string | null = null) => {
    if (!hasSearchCriteria(filters)) {
      setFeedbackMessage("Agrega texto o al menos un filtro para buscar.");
      setHasSearched(false);
      setResults([]);
      setHasMore(false);
      setNextToken(null);
      return;
    }

    setHasSearched(true);
    setIsLoading(token === null);
    setFeedbackMessage("");

    try {
      const response = await api.search.list(buildSearchFilters(filters), 20, token);
      setResults((current) => (token === null ? response.items : [...current, ...response.items]));
      setHasMore(response.hasMore);
      setNextToken(response.nextToken ?? null);
    } catch {
      if (token === null) setResults([]);
      setHasMore(false);
      setNextToken(null);
      setFeedbackMessage("No se pudo completar la busqueda.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    void loadSearch(null);
  };

  const handleClear = () => {
    setFilters(createEmptySearchFormValues());
    setResults([]);
    setHasSearched(false);
    setFeedbackMessage("");
    setHasMore(false);
    setNextToken(null);
  };

  const fetchMoreData = () => {
    void loadSearch(nextToken);
  };

  return (
    <Box minH="100vh">
      <Heading as="h1" size="4xl" color="var(--text-color)" mb={4} textAlign="center">
        Buscador
      </Heading>

      <form style={{ width: "100%" }} onSubmit={handleSearch}>
        <Box
          as="section"
          w={["90%", "75%"]}
          mx="auto"
          mb={5}
          border="1px solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          bg="var(--surface-bg)"
          p={4}
        >
          <TextField
            label="Texto"
            type="text"
            value={filters.q}
            placeholder="Busca por titulo, descripcion o contenido"
            onChange={(event) => updateFilters({ q: event.target.value })}
          />

          <Flex gap={4} direction={{ base: "column", md: "row" }} mb={4}>
            <FilterSelect
              label="Categoria"
              value={filters.categoryId}
              disabled={isLoadingCategories}
              onChange={(value) => updateFilters({ categoryId: value })}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FilterSelect>
          </Flex>

          <Flex gap={4} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "flex-end" }}>
            <Flex gap={3} justify="flex-end" flex={{ base: "initial", md: "1" }}>
              <AppButton type="button" tone="ghost" onClick={handleClear}>
                Limpiar
              </AppButton>
              <AppButton type="submit" minW="8rem">
                Buscar
              </AppButton>
            </Flex>
          </Flex>

          {feedbackMessage && (
            <Text color="red.400" fontSize="sm" mt={3}>
              {feedbackMessage}
            </Text>
          )}

          {activeFilterDescriptions.length > 0 && (
            <Flex gap={2} wrap="wrap" mt={4}>
              {activeFilterDescriptions.map((description) => (
                <Badge key={description} borderRadius="panel" colorPalette="teal" px={2} py={1}>
                  {description}
                </Badge>
              ))}
            </Flex>
          )}
        </Box>
      </form>

      <Box w={["90%", "75%"]} mx="auto" mt={4}>
        {isLoading ? (
          <SkeletonFeed count={3} />
        ) : (
          <>
            {results.length > 0 && (
              <InfiniteScroll
                dataLength={results.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={
                  <Box mt={4}>
                    <SkeletonFeed count={1} />
                  </Box>
                }
                endMessage={
                  <Text color="gray.500" textAlign="center" mt={6} mb={4} fontSize="sm">
                    No hay mas resultados por cargar
                  </Text>
                }
                style={{ overflow: "hidden" }}
              >
                {results.map((post) => (
                  <PublicationCard key={post.id} post={post} onImageClick={setSelectedImage} />
                ))}
              </InfiniteScroll>
            )}

            {hasSearched && results.length === 0 && (
              <EmptyState title="No se encontraron publicaciones." minH="30vh" />
            )}
          </>
        )}
      </Box>

      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </Box>
  );
}

function FilterSelect({
  label,
  value,
  disabled,
  children,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  children: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <Box flex="1">
      <Text color="var(--text-color)" mb={2}>
        {label}
      </Text>
      <select
        style={selectStyles}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
    </Box>
  );
}

export default Search;
