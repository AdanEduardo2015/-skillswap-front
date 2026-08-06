import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { api } from "../../services/api";
import type { Category, Publication } from "../../types";
import { AppButton } from "../../shared/ui";
import PublicationCard from "../PublicationCard";
import ConfirmModal from "../modals/ConfirmModal";
import ImageModal from "../modals/ImageModal";

export default function AdminPublications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review modal state
  const [actionPublication, setActionPublication] = useState<Publication | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pubsRes = await api.admin.listPublications(statusFilter);
      const catsRes = await api.categories.list(true);
      setPublications(pubsRes.items || []);
      setCategories(catsRes || []);
    } catch (err: any) {
      showToast(err.message || "Error al cargar las publicaciones");
      setPublications([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenReview = (pub: Publication, actionType: "approved" | "rejected") => {
    setActionPublication(pub);
    setReviewAction(actionType);
    setSelectedCategoryId(pub.categoryId || "");
    setRejectionReason("");
  };

  const [deletePublicationTarget, setDeletePublicationTarget] = useState<Publication | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleOpenDelete = (pub: Publication) => {
    setDeletePublicationTarget(pub);
  };

  const handleConfirmDelete = async () => {
    if (!deletePublicationTarget) return;
    setIsDeleting(true);
    try {
      await api.publications.delete(deletePublicationTarget.id);
      showToast("Publicación eliminada exitosamente.");
      setDeletePublicationTarget(null);
      void loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar la publicación.";
      showToast(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!actionPublication || !reviewAction) return;

    if (reviewAction === "rejected" && !rejectionReason.trim()) {
      showToast("Debes ingresar un motivo para el rechazo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.admin.reviewPublication({
        id: actionPublication.id,
        approvalStatus: reviewAction,
        rejectionReason: reviewAction === "rejected" ? rejectionReason.trim() : undefined,
        categoryId: selectedCategoryId || undefined,
      });

      showToast(
        reviewAction === "approved"
          ? "Publicación aprobada exitosamente."
          : "Publicación rechazada exitosamente."
      );
      setActionPublication(null);
      setReviewAction(null);
      void loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al procesar la revisión.";
      showToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex justify="center" minH="100vh" py={4}>
      <VStack w={["95%", "85%"]} maxW="container.lg" gap={6} align="stretch">
        {toastMessage && (
          <Box
            position="fixed"
            bottom="90px"
            left="50%"
            transform="translateX(-50%)"
            bg="var(--toast-bg)"
            color="var(--toast-text)"
            px={5}
            py={3}
            borderRadius="xl"
            fontWeight="bold"
            fontSize="sm"
            zIndex={9999}
            boxShadow="var(--modal-shadow)"
          >
            {toastMessage}
          </Box>
        )}

        <Heading as="h2" size="xl" color="white" textAlign="center">
          Moderación de Publicaciones y Videos
        </Heading>

        {/* Filter Bar */}
        <Flex justify="center" wrap="wrap" gap={3}>
          {(["pending", "approved", "rejected", "all"] as const).map((filterKey) => (
            <AppButton
              key={filterKey}
              size="sm"
              variant={statusFilter === filterKey ? "solid" : "outline"}
              onClick={() => setStatusFilter(filterKey)}
            >
              {filterKey === "pending" && "Pendientes ⏳"}
              {filterKey === "approved" && "Aprobadas ✅"}
              {filterKey === "rejected" && "Rechazadas ❌"}
              {filterKey === "all" && "Todas 📂"}
            </AppButton>
          ))}
        </Flex>

        {isLoading ? (
          <Text color="gray.400" textAlign="center" py={8}>
            Cargando publicaciones para moderación...
          </Text>
        ) : publications.length === 0 ? (
          <Box bg="var(--card-bg)" p={8} borderRadius="panel" textAlign="center">
            <Text color="gray.300" fontSize="lg" fontWeight="bold">
              No hay publicaciones en esta categoría de moderación.
            </Text>
          </Box>
        ) : (
          <VStack gap={6} align="stretch">
            {publications.map((pub) => (
              <Box
                key={pub.id}
                bg="var(--card-bg)"
                border="1px solid var(--card-border)"
                borderRadius="panel"
                p={4}
              >
                <PublicationCard post={pub} onImageClick={setSelectedImage} isPreview={true} />

                {/* Moderation Controls Panel */}
                <Box mt={4} pt={4} borderTop="1px solid var(--card-border)">
                  <Flex wrap="wrap" align="center" justify="space-between" gap={4}>
                    <Box flex="1" minW="220px">
                      <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>
                        Categoría vinculada:
                      </Text>
                      <NativeSelect.Root size="sm" w="100%">
                        <NativeSelect.Field
                          value={pub.categoryId || ""}
                          onChange={(e) => {
                            const newCatId = e.currentTarget.value;
                            setPublications((prev) =>
                              prev.map((p) => (p.id === pub.id ? { ...p, categoryId: newCatId } : p))
                            );
                          }}
                          bg="var(--input-bg)"
                          color="var(--text-color)"
                          borderColor="var(--input-border)"
                          css={{
                            "& option": {
                              backgroundColor: "#ffffff",
                              color: "#1a202c",
                            },
                            "&:focus": {
                              borderColor: "var(--color-primary, #63b3ed)",
                              boxShadow: "0 0 0 1px var(--color-primary, #63b3ed)",
                            }
                          }}
                        >
                          <option value="">Selecciona una categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} {!cat.isActive ? "(Inactiva)" : ""}
                            </option>
                          ))}
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </Box>

                    <Flex gap={3} align="center">
                      <AppButton
                        size="sm"
                        bg="green.600"
                        color="white"
                        _hover={{ bg: "green.700" }}
                        onClick={() => handleOpenReview(pub, "approved")}
                      >
                        Aprobar ✅
                      </AppButton>
                      <AppButton
                        size="sm"
                        bg="red.600"
                        color="white"
                        _hover={{ bg: "red.700" }}
                        onClick={() => handleOpenReview(pub, "rejected")}
                      >
                        Rechazar ❌
                      </AppButton>
                      <AppButton
                        size="sm"
                        bg="gray.600"
                        color="white"
                        _hover={{ bg: "gray.700" }}
                        onClick={() => handleOpenDelete(pub)}
                      >
                        Eliminar 🗑️
                      </AppButton>
                    </Flex>
                  </Flex>
                </Box>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>

      {/* Reject/Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={actionPublication !== null}
        title={
          reviewAction === "approved"
            ? "¿Deseas aprobar esta publicación?"
            : "Rechazar publicación"
        }
        isLoading={isSubmitting}
        onConfirm={handleConfirmReview}
        onCancel={() => {
          setActionPublication(null);
          setReviewAction(null);
        }}
      >
        {reviewAction === "rejected" && (
          <Box mt={3} w="100%">
            <Text fontSize="sm" color="gray.300" mb={2}>
              Ingresa la explicación del rechazo para el creador:
            </Text>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej. El contenido no cumple con los lineamientos de la comunidad debido a..."
              bg="var(--input-bg)"
              color="var(--text-color)"
              borderColor="var(--input-border)"
              rows={4}
            />
          </Box>
        )}
      </ConfirmModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletePublicationTarget !== null}
        title="¿Deseas eliminar definitivamente esta publicación/video?"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePublicationTarget(null)}
      >
        <Box mt={3} w="100%">
          <Text fontSize="sm" color="red.300">
            Esta acción eliminará la publicación del sistema y no se puede deshacer.
          </Text>
        </Box>
      </ConfirmModal>

      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </Flex>
  );
}
