import { useState, useEffect } from "react";
import { Box, Flex, Heading, Spinner, Text, VStack, chakra } from "@chakra-ui/react";
import { FaExclamationTriangle, FaFilm, FaFileAlt } from "react-icons/fa";
import { api } from "../../services/api";
import type { Appeal, Publication, Sanction } from "../../types";
import { AppButton, AppModal, TextareaField } from "../../shared/ui";

interface AppealModalProps {
  isOpen: boolean;
  sanction: Sanction | null;
  onClose: () => void;
  onSuccess: (appeal: Appeal) => void;
}

const sanctionTypeLabels: Record<string, string> = {
  warning: "Advertencia de Cuenta",
  temporary_ban: "Baneo Temporal de Cuenta",
  permanent_ban: "Baneo Permanente de Cuenta",
  content_restriction: "Restricción de Contenido (Publicación / Video)",
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "Sin fecha";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AppealModal({ isOpen, sanction, onClose, onSuccess }: AppealModalProps) {
  const [explanation, setExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [sanctionedPub, setSanctionedPub] = useState<Publication | null>(null);
  const [isLoadingPub, setIsLoadingPub] = useState(false);

  useEffect(() => {
    if (isOpen && sanction) {
      setExplanation("");
      setIsSubmitting(false);
      setErrorMsg("");
      setSanctionedPub(null);

      if (sanction.publicationId) {
        setIsLoadingPub(true);
        api.publications
          .get(sanction.publicationId)
          .then((pub) => setSanctionedPub(pub))
          .catch(() => setSanctionedPub(null))
          .finally(() => setIsLoadingPub(false));
      }
    }
  }, [isOpen, sanction]);

  if (!sanction) return null;

  const isExplanationValid = Boolean(explanation.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExplanationValid) {
      setErrorMsg("Debes proporcionar una explicación para enviar la apelación.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await api.appeals.create({
        sanctionId: sanction.id,
        userExplanation: explanation.trim(),
      });

      onSuccess(response.appeal);
      onClose();
    } catch (err: unknown) {
      console.error("Error enviando apelación:", err);
      setErrorMsg(err instanceof Error ? err.message : "Ocurrió un error al enviar la apelación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Apelar decisión de sanción" size="lg">
      <chakra.form onSubmit={handleSubmit}>
        <VStack align="stretch" gap={4}>
          {/* Motivo de la sanción (solo lectura) */}
          <Box bg="rgba(239, 68, 68, 0.1)" border="1px solid #ef4444" borderRadius="panel" p={3}>
            <Text fontSize="xs" fontWeight="bold" color="red.400" textTransform="uppercase" mb={1}>
              Motivo de la sanción (solo lectura)
            </Text>
            <Text fontWeight="semibold" mb={1} color="var(--text-color)">
              {sanctionTypeLabels[sanction.type] || sanction.type}
            </Text>
            <Text fontSize="sm" color="var(--text-color)">
              {sanction.reason || sanction.description || "No especificado por el administrador."}
            </Text>
          </Box>

          {/* Details Row: Publicación & Fecha */}
          <Flex gap={3} direction={{ base: "column", sm: "row" }}>
            <Box flex="1" bg="var(--surface-bg)" border="1px solid var(--card-border)" borderRadius="panel" p={3}>
              <Text fontSize="xs" fontWeight="bold" color="var(--text-muted)" mb={1}>
                Publicación / Video sancionado
              </Text>
              <Text fontSize="sm" color="var(--text-color)" fontWeight="medium">
                {sanction.publicationId
                  ? sanctionedPub?.title
                    ? sanctionedPub.title
                    : `ID: ${sanction.publicationId}`
                  : "N/A - Sanción a nivel de cuenta"}
              </Text>
            </Box>

            <Box flex="1" bg="var(--surface-bg)" border="1px solid var(--card-border)" borderRadius="panel" p={3}>
              <Text fontSize="xs" fontWeight="bold" color="var(--text-muted)" mb={1}>
                Fecha de la sanción
              </Text>
              <Text fontSize="sm" color="var(--text-color)" fontWeight="medium">
                {formatDate(sanction.createdAt || sanction.startsAt)}
              </Text>
            </Box>
          </Flex>

          {/* Explicación del usuario (textarea obligatorio) */}
          <Box>
            <Flex justify="space-between" align="center" mb={1}>
              <chakra.label fontSize="sm" fontWeight="bold" color="var(--text-color)">
                Explicación del usuario <chakra.span color="red.400">*</chakra.span>
              </chakra.label>
            </Flex>
            <TextareaField
              placeholder="Explica las razones por las cuales consideras que esta sanción debe ser revisada o anulada..."
              value={explanation}
              minH="8rem"
              onChange={(e) => {
                setExplanation(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
            />
          </Box>

          {/* Automatic Preview of Sanctioned Publication / Video */}
          {sanction.publicationId && (
            <Box bg="var(--surface-muted)" border="1px solid var(--card-border)" borderRadius="panel" p={4}>
              <Flex align="center" gap={2} mb={2}>
                {sanctionedPub?.format === "video" || sanctionedPub?.videoUrl ? (
                  <FaFilm color="var(--brand-primary)" />
                ) : (
                  <FaFileAlt color="var(--brand-primary)" />
                )}
                <Heading as="h4" size="xs" color="var(--text-color)">
                  Contenido Sancionado
                </Heading>
              </Flex>

              {isLoadingPub ? (
                <Flex justify="center" py={4}>
                  <Spinner size="sm" color="var(--brand-primary)" />
                </Flex>
              ) : sanctionedPub ? (
                <VStack align="stretch" gap={2}>
                  {sanctionedPub.title && (
                    <Text fontWeight="bold" fontSize="sm" color="var(--text-color)">
                      {sanctionedPub.title}
                    </Text>
                  )}

                  {sanctionedPub.videoUrl && (
                    <Box borderRadius="control" overflow="hidden" maxW="100%" bg="#000" mt={1}>
                      <video
                        src={sanctionedPub.videoUrl}
                        controls
                        preload="metadata"
                        crossOrigin="anonymous"
                        style={{ width: "100%", maxHeight: "240px", objectFit: "contain" }}
                      />
                    </Box>
                  )}

                  {sanctionedPub.content && (
                    <Text fontSize="xs" color="var(--text-muted)" whiteSpace="pre-wrap" maxH="120px" overflowY="auto">
                      {sanctionedPub.content}
                    </Text>
                  )}
                </VStack>
              ) : (
                <Text fontSize="xs" color="var(--text-muted)">
                  Publicación ID: {sanction.publicationId}
                </Text>
              )}
            </Box>
          )}

          {/* Messages & Feedback */}
          {errorMsg && (
            <Flex align="center" gap={2} bg="rgba(239, 68, 68, 0.15)" p={3} borderRadius="panel" color="red.300" fontSize="sm">
              <Box flexShrink={0}>
                <FaExclamationTriangle />
              </Box>
              <Text>{errorMsg}</Text>
            </Flex>
          )}

          {/* Action Buttons */}
          <Flex justify="flex-end" gap={3} mt={2}>
            <AppButton type="button" tone="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </AppButton>
            <AppButton type="submit" tone="primary" disabled={!isExplanationValid || isSubmitting}>
              {isSubmitting ? "Enviando apelación..." : "Enviar apelación"}
            </AppButton>
          </Flex>
        </VStack>
      </chakra.form>
    </AppModal>
  );
}
