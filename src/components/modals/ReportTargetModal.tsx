import { Box, Flex, Spinner, Text, chakra } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../services/api";
import type { ReportTargetType } from "../../types";
import { AppButton, AppModal, TextareaField } from "../../shared/ui";
import {
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_REASON_OPTIONS,
  buildReportPayload,
  createEmptyReportFormValues,
  hasReportFormErrors,
  validateReportForm,
  type ReportFormErrors,
  type ReportFormValues,
} from "../../features/reports/reportForm";

interface ReportTargetModalProps {
  isOpen: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onDuplicate?: (message: string) => void;
}

const targetTypeLabels: Record<ReportTargetType, string> = {
  publication: "publicacion",
  comment: "comentario",
  user: "usuario",
};

export default function ReportTargetModal({
  isOpen,
  targetType,
  targetId,
  targetLabel,
  onClose,
  onSuccess,
  onDuplicate,
}: ReportTargetModalProps) {
  const [values, setValues] = useState<ReportFormValues>(createEmptyReportFormValues);
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setValues(createEmptyReportFormValues());
    setErrors({});
    setSubmitError("");
    setIsSubmitting(false);
    setWasSubmitted(false);
  }, [isOpen, targetType, targetId]);

  const updateField = <K extends keyof ReportFormValues>(field: K, value: ReportFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateReportForm(values);
    setErrors(validationErrors);
    if (hasReportFormErrors(validationErrors)) return;

    if (!targetId.trim()) {
      setSubmitError("No se pudo identificar el recurso reportado.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await api.reports.create(buildReportPayload(targetType, targetId, values));
      setWasSubmitted(true);
      onSuccess?.();
    } catch (error: unknown) {
      const status =
        error && typeof error === "object" && "status" in error
          ? (error as { status?: number }).status
          : null;
      const msg = error instanceof Error ? error.message : "No se pudo enviar el reporte.";

      if (status === 409 || msg.includes("ya fue enviado")) {
        onClose();
        if (onDuplicate) {
          onDuplicate(msg);
        } else {
          alert(msg);
        }
      } else {
        setSubmitError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      title={`Reportar ${targetTypeLabels[targetType]}`}
      size="md"
      onClose={handleClose}
    >
      <chakra.form textAlign="left" onSubmit={(event) => void handleSubmit(event)}>
        {wasSubmitted ? (
          <>
            <Text color="green.300" mb={6}>
              Reporte enviado. Un administrador revisara el caso.
            </Text>
            <Flex justify="flex-end">
              <AppButton type="button" onClick={handleClose}>
                Cerrar
              </AppButton>
            </Flex>
          </>
        ) : (
          <>
            {targetLabel && (
              <Text color="var(--text-muted)" fontSize="sm" mb={4}>
                Recurso: {targetLabel}
              </Text>
            )}

            <Box mb={4}>
              <chakra.label htmlFor="report-reason" display="block" mb={2}>
                Motivo
              </chakra.label>
              <chakra.select
                id="report-reason"
                value={values.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                disabled={isSubmitting}
                bg="var(--input-bg)"
                color="var(--input-text)"
                border="solid 0.05rem"
                borderColor={errors.reason ? "red.500" : "var(--input-border)"}
                borderRadius="control"
                minH="touch"
                px={3}
                w="100%"
              >
                {REPORT_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </chakra.select>
              {errors.reason && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  {errors.reason}
                </Text>
              )}
            </Box>

            <TextareaField
              label="Descripcion"
              value={values.description}
              errorText={errors.description}
              helperText="Opcional. Agrega contexto para moderacion."
              maxLength={REPORT_DESCRIPTION_MAX_LENGTH}
              minH="8rem"
              disabled={isSubmitting}
              onChange={(event) => updateField("description", event.target.value)}
            />

            {submitError && (
              <Text color="red.400" mb={4}>
                {submitError}
              </Text>
            )}

            <Flex justify="flex-end" gap={3} wrap="wrap">
              <AppButton type="button" tone="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </AppButton>
              <AppButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Flex align="center" gap={2}>
                    <Spinner size="sm" />
                    <Text>Enviando...</Text>
                  </Flex>
                ) : (
                  "Enviar reporte"
                )}
              </AppButton>
            </Flex>
          </>
        )}
      </chakra.form>
    </AppModal>
  );
}
