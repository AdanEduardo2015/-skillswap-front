import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Flex, Heading, Separator, Spinner, Text, VStack, chakra } from "@chakra-ui/react";
import { FaBan, FaCalendarAlt, FaCheck, FaExclamationTriangle, FaGavel, FaSync, FaTimes, FaUnlock, FaUserSlash } from "react-icons/fa";
import { api } from "../../services/api";
import type { Sanction, SanctionStatus, SanctionType } from "../../types";
import { usePolling } from "../../hooks/usePolling";
import { AppButton, EmptyState, TextareaField, TextField } from "../../shared/ui";

const statusOptions: Array<{ value: SanctionStatus; label: string; colorPalette: string }> = [
  { value: "active", label: "Activas", colorPalette: "red" },
  { value: "lifted", label: "Levantadas", colorPalette: "green" },
  { value: "expired", label: "Expiradas", colorPalette: "gray" },
];

const typeOptions: Array<{ value: SanctionType; label: string }> = [
  { value: "warning", label: "Advertencia" },
  { value: "temporary_ban", label: "Baneo temporal" },
  { value: "permanent_ban", label: "Baneo permanente" },
  { value: "content_restriction", label: "Restriccion de contenido" },
];

const typeLabels: Record<SanctionType, string> = {
  warning: "Advertencia",
  temporary_ban: "Baneo temporal",
  permanent_ban: "Baneo permanente",
  content_restriction: "Restriccion de contenido",
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

const emptyForm = {
  userEmail: "",
  type: "permanent_ban" as SanctionType,
  description: "",
  endsAt: "",
  publicationId: "",
};

export default function AdminSanctions() {
  const [status, setStatus] = useState<SanctionStatus>("active");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isFeedbackError, setIsFeedbackError] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  const selectedStatus = useMemo(
    () => statusOptions.find((option) => option.value === status) ?? statusOptions[0],
    [status]
  );

  const loadSanctions = async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
      setFeedback("");
      setIsFeedbackError(false);
    }

    try {
      const result = await api.admin.listSanctions(status, 20, null, userEmailFilter.trim() || undefined);
      setSanctions(result.sanctions || []);
      setNextToken(result.nextToken);
    } catch {
      setSanctions([]);
      setNextToken(null);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSanctions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmailFilter, reloadVersion]);

  usePolling(() => {
    void loadSanctions(false);
  }, 10000, [status, userEmailFilter]);

  const updateForm = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFeedback("");
  };

  const loadMore = async () => {
    if (!nextToken) return;

    try {
      const result = await api.admin.listSanctions(
        status,
        20,
        nextToken,
        userEmailFilter.trim() || undefined
      );
      setSanctions((current) => [...current, ...result.sanctions]);
      setNextToken(result.nextToken);
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedback(error instanceof Error ? error.message : "No se pudieron cargar mas sanciones.");
    }
  };

  const createSanction = async () => {
    if (!formValues.userEmail.trim()) {
      setIsFeedbackError(true);
      setFeedback("El email del usuario es requerido.");
      return;
    }

    if (formValues.type === "content_restriction" && !formValues.publicationId.trim()) {
      setIsFeedbackError(true);
      setFeedback("El ID de la publicación / video es requerido para restricciones de contenido.");
      return;
    }

    setIsSaving(true);
    setFeedback("");
    setIsFeedbackError(false);

    try {
      const result = await api.admin.createSanction({
        userEmail: formValues.userEmail.trim(),
        type: formValues.type,
        description: formValues.description.trim(),
        endsAt: formValues.type === "temporary_ban" ? formValues.endsAt.trim() || null : null,
        publicationId: formValues.type === "content_restriction" ? formValues.publicationId.trim() : null,
      });
      setSanctions((current) =>
        result.sanction.status === status ? [result.sanction, ...current] : current
      );
      setFormValues(emptyForm);
      setFeedback("Sancion creada.");
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedback(error instanceof Error ? error.message : "No se pudo crear la sancion.");
    } finally {
      setIsSaving(false);
    }
  };

  const liftSanction = async (sanction: Sanction) => {
    setProcessingId(sanction.id);
    setFeedback("");
    setIsFeedbackError(false);

    try {
      const updated = await api.admin.liftSanction(sanction.id);
      setSanctions((current) => current.filter((item) => item.id !== updated.id));
      setFeedback("Sancion levantada.");
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedback(error instanceof Error ? error.message : "No se pudo levantar la sancion.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={6} color="var(--text-color)">
      <Flex align="center" gap={3} mb={2}>
        <FaGavel size={26} />
        <Heading as="h1" size="4xl">
          Sanciones
        </Heading>
      </Flex>
      <Text color="var(--text-muted)" mb={6}>
        Registra restricciones administrativas y revisa el historial auditable de usuarios.
      </Text>

      <Flex gap={6} direction={{ base: "column", xl: "row" }} align="flex-start">
        <Box
          as="section"
          w={{ base: "100%", xl: "380px" }}
          border="1px solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          p={4}
          bg="var(--surface-bg)"
        >
          <Heading as="h2" size="lg" mb={4}>
            Nueva sancion
          </Heading>

          <TextField
            label="Email del usuario"
            value={formValues.userEmail}
            type="email"
            onChange={(event) => updateForm("userEmail", event.target.value)}
          />

          <Box mb={4}>
            <chakra.label htmlFor="sanction-type" display="block" mb={2}>
              Tipo
            </chakra.label>
            <chakra.select
              id="sanction-type"
              value={formValues.type}
              onChange={(event) => updateForm("type", event.target.value as SanctionType)}
              bg="var(--input-bg)"
              color="var(--input-text)"
              border="solid 0.05rem"
              borderColor="var(--input-border)"
              borderRadius="control"
              minH="touch"
              px={3}
              w="100%"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </chakra.select>
          </Box>

          <TextareaField
            label="Descripcion"
            value={formValues.description}
            maxLength={1200}
            minH="7rem"
            onChange={(event) => updateForm("description", event.target.value)}
          />

          {formValues.type === "temporary_ban" && (
            <TextField
              label="Fin de sancion"
              helperText="Opcional para sanciones temporales."
              value={formValues.endsAt}
              type="datetime-local"
              onChange={(event) => updateForm("endsAt", event.target.value)}
            />
          )}

          {formValues.type === "content_restriction" && (
            <Box mb={4}>
              <TextField
                label="ID de la publicación / video"
                value={formValues.publicationId}
                placeholder="Ej: d83a8b27-463d..."
                onChange={(event) => updateForm("publicationId", event.target.value)}
                containerProps={{ mb: 0 }}
              />
              {formValues.publicationId.trim() && (
                <SanctionVideoPreview publicationId={formValues.publicationId.trim()} />
              )}
            </Box>
          )}

          <AppButton type="button" w="100%" onClick={() => void createSanction()} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Crear sancion"}
          </AppButton>
        </Box>

        <Box as="section" flex="1" w="100%">
          <Flex
            gap={4}
            align={{ base: "stretch", md: "flex-end" }}
            direction={{ base: "column", md: "row" }}
            mb={5}
          >
            <Box w={{ base: "100%", md: "220px" }}>
              <chakra.label htmlFor="sanction-status" display="block" mb={2}>
                Estado
              </chakra.label>
              <chakra.select
                id="sanction-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as SanctionStatus)}
                bg="var(--input-bg)"
                color="var(--input-text)"
                border="solid 0.05rem"
                borderColor="var(--input-border)"
                borderRadius="control"
                minH="touch"
                px={3}
                w="100%"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </chakra.select>
            </Box>

            <TextField
              label="Filtrar por usuario"
              value={userEmailFilter}
              type="email"
              containerProps={{ mb: 0, w: { base: "100%", md: "300px" } }}
              onChange={(event) => setUserEmailFilter(event.target.value)}
            />

            <AppButton
              type="button"
              tone="ghost"
              onClick={() => setReloadVersion((current) => current + 1)}
              disabled={isLoading}
            >
              <Flex align="center" gap={2}>
                <FaSync />
                <Text>Recargar</Text>
              </Flex>
            </AppButton>
          </Flex>

          <Flex align="center" gap={2} mb={4}>
            <Badge borderRadius="panel" colorPalette={selectedStatus.colorPalette}>
              {selectedStatus.label}
            </Badge>
            <Text color="var(--text-muted)" fontSize="sm">
              {sanctions.length} resultados
            </Text>
          </Flex>

          {feedback && (
            <Text mb={4} color={isFeedbackError ? "red.400" : "green.300"}>
              {feedback}
            </Text>
          )}

          {isLoading ? (
            <Flex justify="center" py={12}>
              <Spinner color="var(--text-color)" />
            </Flex>
          ) : sanctions.length === 0 ? (
            <EmptyState title={`No hay sanciones ${selectedStatus.label.toLowerCase()}.`} minH="35vh" />
          ) : (
            <VStack align="stretch" gap={0} borderTop="1px solid" borderColor="var(--card-border)">
              {sanctions.map((sanction) => (
                <SanctionRow
                  key={sanction.id}
                  sanction={sanction}
                  isProcessing={processingId === sanction.id}
                  onLift={() => void liftSanction(sanction)}
                />
              ))}
            </VStack>
          )}

          {nextToken && !isLoading && (
            <Flex justify="center" mt={6}>
              <AppButton type="button" tone="ghost" onClick={() => void loadMore()}>
                Cargar mas
              </AppButton>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function SanctionRow({
  sanction,
  isProcessing,
  onLift,
}: {
  sanction: Sanction;
  isProcessing: boolean;
  onLift: () => void;
}) {
  const canLift = sanction.status === "active";

  return (
    <Box py={5}>
      <Flex justify="space-between" gap={4} direction={{ base: "column", lg: "row" }}>
        <Box flex="1">
          <Flex gap={2} align="center" wrap="wrap" mb={2}>
            <Heading as="h2" size="md">
              {typeLabels[sanction.type] ?? sanction.type}
            </Heading>
            <Badge borderRadius="panel" colorPalette={sanction.status === "active" ? "red" : "gray"}>
              {sanction.status}
            </Badge>
          </Flex>

          <Text color="var(--text-muted)" fontSize="sm" mb={2}>
            Usuario: {sanction.userEmail} - Creada: {formatDate(sanction.createdAt)}
          </Text>
          <Text color="var(--text-muted)" fontSize="sm" mb={2}>
            Inicio: {formatDate(sanction.startsAt)} - Fin: {formatDate(sanction.endsAt)}
          </Text>

          {sanction.publicationId && (
            <Box mb={2}>
              <Flex align="center" gap={2} wrap="wrap">
                <Text color="var(--text-muted)" fontSize="sm">
                  Publicación / Video ID: {sanction.publicationId}
                </Text>
                {sanction.type === "content_restriction" && (
                  <SanctionVideoPreview publicationId={sanction.publicationId} inline />
                )}
              </Flex>
            </Box>
          )}

          {sanction.description && <Text whiteSpace="pre-wrap">{sanction.description}</Text>}

          {sanction.liftedAt && (
            <Text color="var(--text-muted)" fontSize="sm" mt={2}>
              Levantada por {sanction.liftedBy || "admin"} el {formatDate(sanction.liftedAt)}
            </Text>
          )}
        </Box>

        {canLift && (
          <Flex justify={{ base: "flex-start", lg: "flex-end" }}>
            <AppButton type="button" tone="secondary" onClick={onLift} disabled={isProcessing}>
              <Flex align="center" gap={2}>
                <FaUnlock />
                <Text>{isProcessing ? "Procesando..." : "Levantar"}</Text>
              </Flex>
            </AppButton>
          </Flex>
        )}
      </Flex>
      <Separator borderColor="var(--card-border)" mt={5} />
    </Box>
  );
}

function SanctionVideoPreview({ publicationId, inline = false }: { publicationId: string, inline?: boolean }) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadVideo = async () => {
    if (showVideo) {
       setShowVideo(false);
       return;
    }
    setIsLoading(true);
    setError("");
    try {
      const pub = await api.publications.get(publicationId);
      if (pub.videoUrl) {
         setVideoUrl(pub.videoUrl);
         setShowVideo(true);
      } else {
         setError("Esta publicación no tiene video.");
      }
    } catch(err) {
      setError("Publicación no encontrada.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box mt={inline ? 0 : 2} mb={inline ? 0 : 4} w="100%">
       <Flex align="center" gap={2}>
         <chakra.button
           type="button"
           onClick={() => void loadVideo()}
           disabled={isLoading}
           color="blue.400"
           textDecoration="underline"
           fontSize="sm"
           cursor="pointer"
           _hover={{ color: "blue.300" }}
           bg="transparent"
           border="none"
         >
           {showVideo ? "Ocultar video" : "Ver video"}
         </chakra.button>
         {isLoading && <Spinner size="xs" />}
       </Flex>
       {error && <Text color="red.400" fontSize="sm" mt={1}>{error}</Text>}
       {showVideo && videoUrl && (
         <Box mt={2} maxW="320px" borderRadius="md" overflow="hidden" bg="black">
           <video src={videoUrl} controls style={{ width: '100%', display: 'block' }} />
         </Box>
       )}
    </Box>
  );
}
