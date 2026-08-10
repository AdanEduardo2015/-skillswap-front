import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Flex, Heading, Separator, Spinner, Text, VStack, chakra } from "@chakra-ui/react";
import { FaBalanceScale, FaCheck, FaQuestionCircle, FaSync, FaTimes } from "react-icons/fa";
import { api } from "../../services/api";
import type { Appeal, AppealStatus } from "../../types";
import { usePolling } from "../../hooks/usePolling";
import { AppButton, EmptyState, TextareaField } from "../../shared/ui";

const statusFilterOptions: Array<{ value: string; label: string; colorPalette: string }> = [
  { value: "all", label: "Todas", colorPalette: "gray" },
  { value: "pending", label: "Pendientes", colorPalette: "blue" },
  { value: "in_review", label: "En revisión / Más info", colorPalette: "yellow" },
  { value: "accepted", label: "Aceptadas (Retiradas)", colorPalette: "green" },
  { value: "rejected", label: "Rechazadas (Mantenidas)", colorPalette: "red" },
];

const appealStatusLabels: Record<AppealStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  accepted: "Aceptada (Sanción levantada)",
  rejected: "Rechazada (Sanción mantenida)",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AdminAppeals() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isFeedbackError, setIsFeedbackError] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  // Resolution Modal State
  const [activeAppeal, setActiveAppeal] = useState<Appeal | null>(null);
  const [actionType, setActionType] = useState<"keep_sanction" | "request_info" | null>(null);
  const [decisionReason, setDecisionReason] = useState("");

  const selectedStatusOption = useMemo(
    () => statusFilterOptions.find((option) => option.value === statusFilter) ?? statusFilterOptions[0],
    [statusFilter]
  );

  const enrichAppealsWithPublications = async (items: Appeal[]): Promise<Appeal[]> => {
    return Promise.all(
      items.map(async (appeal) => {
        if (appeal.publicationId && (!appeal.publicationVideoUrl || !appeal.publicationTitle)) {
          try {
            const pub = await api.publications.get(appeal.publicationId);
            if (pub) {
              return {
                ...appeal,
                publicationTitle: appeal.publicationTitle || pub.title || undefined,
                publicationContent: appeal.publicationContent || pub.content || undefined,
                publicationVideoUrl: pub.videoUrl || appeal.publicationVideoUrl || undefined,
                publicationFormat: appeal.publicationFormat || pub.format || undefined,
              };
            }
          } catch {
            // Keep original appeal values if publication cannot be fetched
          }
        }
        return appeal;
      })
    );
  };

  const loadAppeals = async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
      setFeedback("");
      setIsFeedbackError(false);
    }

    try {
      const result = await api.admin.listAppeals(statusFilter, 20, null);
      const enriched = await enrichAppealsWithPublications(result.appeals || []);
      setAppeals(enriched);
      setNextToken(result.nextToken);
    } catch {
      setAppeals([]);
      setNextToken(null);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAppeals(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, reloadVersion]);

  usePolling(() => {
    void loadAppeals(false);
  }, 10000, [statusFilter]);

  const loadMore = async () => {
    if (!nextToken) return;
    try {
      const result = await api.admin.listAppeals(statusFilter, 20, nextToken);
      const enriched = await enrichAppealsWithPublications(result.appeals);
      setAppeals((current) => [...current, ...enriched]);
      setNextToken(result.nextToken);
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedback(error instanceof Error ? error.message : "No se pudieron cargar más apelaciones.");
    }
  };

  const handleLiftSanctionDirect = async (appeal: Appeal) => {
    setProcessingId(appeal.id);
    setFeedback("");
    setIsFeedbackError(false);

    try {
      const res = await api.admin.resolveAppeal(appeal.id, "lift_sanction", "Sanción retirada automáticamente por apelación aceptada.");
      setAppeals((current) =>
        current.map((item) => (item.id === appeal.id ? res.appeal : item))
      );
      setFeedback("Sanción retirada exitosamente y apelación aceptada.");
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedback(error instanceof Error ? error.message : "No se pudo retirar la sanción.");
    } finally {
      setProcessingId(null);
    }
  };

  const openActionModal = (appeal: Appeal, action: "keep_sanction" | "request_info") => {
    setActiveAppeal(appeal);
    setActionType(action);
    setDecisionReason("");
  };

  const submitResolveAction = async () => {
    if (!activeAppeal || !actionType) return;

    if (actionType === "keep_sanction" && !decisionReason.trim()) {
      setIsFeedbackError(true);
      setFeedback("El motivo de la decisión es obligatorio para mantener la sanción.");
      return;
    }

    setProcessingId(activeAppeal.id);
    setFeedback("");
    setIsFeedbackError(false);

    try {
      const res = await api.admin.resolveAppeal(
        activeAppeal.id,
        actionType,
        decisionReason.trim() || undefined
      );

      setAppeals((current) =>
        current.map((item) => (item.id === activeAppeal.id ? res.appeal : item))
      );

      setFeedback(
        actionType === "keep_sanction"
          ? "Sanción mantenida y respuesta enviada al usuario."
          : "Se ha solicitado más información al usuario."
      );
      setActiveAppeal(null);
      setActionType(null);
      setDecisionReason("");
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedback(error instanceof Error ? error.message : "Error al procesar la apelación.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={6} color="var(--text-color)">
      <Flex align="center" gap={3} mb={2}>
        <FaBalanceScale size={28} color="var(--text-color)" />
        <Heading as="h1" size="4xl">
          Apelaciones
        </Heading>
      </Flex>
      <Text color="var(--text-muted)" mb={6}>
        Módulo de administración para revisar, gestionar y resolver solicitudes de apelación de sanciones.
      </Text>

      {/* Filter and Reload Header */}
      <Flex
        gap={4}
        align={{ base: "stretch", md: "flex-end" }}
        direction={{ base: "column", md: "row" }}
        mb={5}
      >
        <Box w={{ base: "100%", md: "260px" }}>
          <chakra.label htmlFor="appeal-status-filter" display="block" mb={2} fontWeight="bold">
            Filtrar por estado
          </chakra.label>
          <chakra.select
            id="appeal-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            bg="var(--input-bg)"
            color="var(--input-text)"
            border="solid 0.05rem"
            borderColor="var(--input-border)"
            borderRadius="control"
            minH="touch"
            px={3}
            w="100%"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </chakra.select>
        </Box>

        <AppButton
          type="button"
          tone="ghost"
          onClick={() => setReloadVersion((curr) => curr + 1)}
          disabled={isLoading}
        >
          <Flex align="center" gap={2}>
            <FaSync />
            <Text>Recargar</Text>
          </Flex>
        </AppButton>
      </Flex>

      <Flex align="center" gap={2} mb={4}>
        <Badge borderRadius="panel" colorPalette={selectedStatusOption.colorPalette}>
          {selectedStatusOption.label}
        </Badge>
        <Text color="var(--text-muted)" fontSize="sm">
          {appeals.length} resultados
        </Text>
      </Flex>

      {feedback && (
        <Box
          mb={4}
          p={3}
          borderRadius="panel"
          bg="var(--surface-muted)"
          color="var(--text-color)"
          border={isFeedbackError ? "2px solid var(--text-color)" : "1px solid var(--card-border)"}
        >
          <Text fontWeight="medium">{feedback}</Text>
        </Box>
      )}

      {/* Appeals List */}
      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="var(--text-color)" size="xl" />
        </Flex>
      ) : appeals.length === 0 ? (
        <EmptyState title={`No hay apelaciones en la categoría "${selectedStatusOption.label}".`} minH="35vh" />
      ) : (
        <VStack align="stretch" gap={4}>
          {appeals.map((appeal) => (
            <AppealCardItem
              key={appeal.id}
              appeal={appeal}
              isProcessing={processingId === appeal.id}
              onLiftSanction={() => void handleLiftSanctionDirect(appeal)}
              onKeepSanction={() => openActionModal(appeal, "keep_sanction")}
              onRequestInfo={() => openActionModal(appeal, "request_info")}
            />
          ))}
        </VStack>
      )}

      {nextToken && !isLoading && (
        <Flex justify="center" mt={6}>
          <AppButton type="button" tone="ghost" onClick={() => void loadMore()}>
            Cargar más
          </AppButton>
        </Flex>
      )}

      {/* Modal for Decision Reason when Keeping Sanction or Requesting Info */}
      {activeAppeal && actionType && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0,0,0,0.7)"
          zIndex="modal"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            bg="var(--surface-bg, #1a202c)"
            border="1px solid var(--card-border)"
            borderRadius="panel"
            maxW="500px"
            w="100%"
            p={6}
            boxShadow="xl"
          >
            <Heading as="h3" size="lg" mb={3} color="var(--text-color)">
              {actionType === "keep_sanction" ? "Mantener sanción" : "Solicitar más información"}
            </Heading>
            <Text fontSize="sm" color="var(--text-muted)" mb={4}>
              {actionType === "keep_sanction"
                ? "Explica al usuario el motivo por el cual la sanción se mantiene vigente. Esta respuesta será visible para el usuario."
                : "Indica qué información o evidencia adicional requiere el usuario presentar."}
            </Text>

            <TextareaField
              label={actionType === "keep_sanction" ? "Motivo de la decisión *" : "Nota / Detalles para el usuario"}
              placeholder={
                actionType === "keep_sanction"
                  ? "Ej: Tras revisar las evidencias presentadas, se determinó que la publicación incumple los términos de comunidad..."
                  : "Ej: Por favor adjunta una captura de pantalla completa o documento PDF justificativo."
              }
              value={decisionReason}
              minH="6rem"
              onChange={(e) => setDecisionReason(e.target.value)}
            />

            <Flex justify="flex-end" gap={3} mt={4}>
              <AppButton type="button" tone="ghost" onClick={() => setActiveAppeal(null)}>
                Cancelar
              </AppButton>
              <AppButton
                type="button"
                tone={actionType === "keep_sanction" ? "primary" : "secondary"}
                onClick={() => void submitResolveAction()}
                disabled={processingId === activeAppeal.id}
              >
                {processingId === activeAppeal.id
                  ? "Guardando..."
                  : actionType === "keep_sanction"
                  ? "Confirmar mantener sanción"
                  : "Enviar solicitud de info"}
              </AppButton>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function AppealCardItem({
  appeal,
  isProcessing,
  onLiftSanction,
  onKeepSanction,
  onRequestInfo,
}: {
  appeal: Appeal;
  isProcessing: boolean;
  onLiftSanction: () => void;
  onKeepSanction: () => void;
  onRequestInfo: () => void;
}) {
  const isResolved = appeal.status === "accepted" || appeal.status === "rejected";

  return (
    <Box
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="panel"
      p={5}
      bg="var(--surface-bg)"
      color="var(--text-color)"
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={3}>
        <Flex align="center" gap={2}>
          <Heading as="h3" size="md">
            Apelación por {appeal.userName || appeal.userEmail}
          </Heading>
        </Flex>
        <Badge
          borderRadius="panel"
          px={3}
          py={1}
          colorPalette={
            appeal.status === "pending"
              ? "blue"
              : appeal.status === "in_review"
              ? "yellow"
              : appeal.status === "accepted"
              ? "green"
              : "red"
          }
        >
          {appealStatusLabels[appeal.status] || appeal.status}
        </Badge>
      </Flex>

      <Separator borderColor="var(--card-border)" mb={3} />

      {/* Structured Details */}
      <VStack align="stretch" gap={2} fontSize="sm" mb={4}>
        <Flex gap={2} wrap="wrap">
          <Text fontWeight="bold" color="var(--text-muted)" w="160px">
            Usuario / Correo:
          </Text>
          <Text fontWeight="medium">{appeal.userEmail}</Text>
        </Flex>

        <Flex gap={2} wrap="wrap">
          <Text fontWeight="bold" color="var(--text-muted)" w="160px">
            Fecha de sanción:
          </Text>
          <Text>{formatDate(appeal.sanctionCreatedAt)}</Text>
        </Flex>

        <Flex gap={2} wrap="wrap">
          <Text fontWeight="bold" color="var(--text-muted)" w="160px">
            Fecha de apelación:
          </Text>
          <Text>{formatDate(appeal.createdAt)}</Text>
        </Flex>

        <Flex gap={2} wrap="wrap">
          <Text fontWeight="bold" color="var(--text-muted)" w="160px">
            Motivo de la sanción:
          </Text>
          <Text fontWeight="semibold" color="var(--text-color)">
            {appeal.sanctionReason}
          </Text>
        </Flex>

        <Box border="1px solid var(--card-border)" borderRadius="control" bg="var(--surface-muted)" p={3.5} mt={1} w="100%">
          <Flex gap={2} wrap="wrap" align="center" mb={appeal.publicationVideoUrl || appeal.publicationContent ? 2 : 0}>
            <Text fontWeight="bold" color="var(--text-muted)" w="160px">
              Publicación sancionada:
            </Text>
            <Text color="var(--text-color)" fontWeight="600">
              {appeal.publicationTitle
                ? `"${appeal.publicationTitle}" (${appeal.publicationId})`
                : appeal.publicationId
                ? `ID: ${appeal.publicationId}`
                : "N/A - Sanción a nivel de cuenta"}
            </Text>
          </Flex>

          {/* Video Sancionado para Revisión */}
          {appeal.publicationVideoUrl ? (
            <Box mt={2} borderRadius="control" overflow="hidden" bg="#000" maxW="460px">
              <Text fontSize="xs" fontWeight="bold" color="var(--brand-primary)" px={3} pt={2} pb={1} textTransform="uppercase">
                Video sancionado para revisión ({appeal.publicationFormat || "Video"}):
              </Text>
              <chakra.video
                src={appeal.publicationVideoUrl}
                controls
                preload="metadata"
                crossOrigin="anonymous"
                w="100%"
                maxH="260px"
                style={{ objectFit: "contain" }}
              />
            </Box>
          ) : appeal.publicationContent ? (
            <Box mt={2} p={2.5} bg="var(--input-bg)" borderRadius="control">
              <Text fontSize="xs" fontWeight="bold" color="var(--brand-primary)" mb={1} textTransform="uppercase">
                Contenido ({appeal.publicationFormat || "Publicación"}):
              </Text>
              <Text fontSize="xs" color="var(--text-color)" whiteSpace="pre-wrap" maxH="120px" overflowY="auto">
                {appeal.publicationContent}
              </Text>
            </Box>
          ) : null}
        </Box>

        <Box bg="var(--input-bg)" border="1px solid var(--input-border)" borderRadius="control" p={3} mt={2}>
          <Text fontWeight="bold" color="var(--text-muted)" mb={1} fontSize="xs" textTransform="uppercase">
            Explicación del usuario:
          </Text>
          <Text whiteSpace="pre-wrap" color="var(--text-color)">
            {appeal.userExplanation}
          </Text>
        </Box>

        {/* Decision reason if resolved */}
        {appeal.decisionReason && (
          <Box bg="rgba(0,0,0,0.2)" borderLeft="3px solid var(--brand-primary)" p={3} borderRadius="control" mt={2}>
            <Text fontWeight="bold" fontSize="xs" color="var(--text-muted)" mb={1}>
              Motivo de la decisión (por {appeal.reviewedBy || "admin"} el {formatDate(appeal.reviewedAt)}):
            </Text>
            <Text fontSize="sm" color="var(--text-color)">
              {appeal.decisionReason}
            </Text>
          </Box>
        )}
      </VStack>

      {/* Admin Action Buttons */}
      {!isResolved && (
        <Flex justify="flex-end" gap={3} wrap="wrap" mt={4} pt={3} borderTop="1px solid var(--card-border)">
          <AppButton
            type="button"
            tone="ghost"
            onClick={onRequestInfo}
            disabled={isProcessing}
          >
            <Flex align="center" gap={2}>
              <FaQuestionCircle />
              <Text>Solicitar más información</Text>
            </Flex>
          </AppButton>

          <AppButton
            type="button"
            tone="ghost"
            onClick={onKeepSanction}
            disabled={isProcessing}
          >
            <Flex align="center" gap={2} color="inherit">
              <FaTimes />
              <Text color="inherit">Mantener sanción</Text>
            </Flex>
          </AppButton>

          <AppButton
            type="button"
            tone="primary"
            onClick={onLiftSanction}
            disabled={isProcessing}
          >
            <Flex align="center" gap={2}>
              <FaCheck />
              <Text>{isProcessing ? "Procesando..." : "Retirar sanción"}</Text>
            </Flex>
          </AppButton>
        </Flex>
      )}
    </Box>
  );
}
