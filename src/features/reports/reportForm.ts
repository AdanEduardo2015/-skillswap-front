import type { ReportTargetType } from "../../types";

export const REPORT_REASON_MAX_LENGTH = 160;
export const REPORT_DESCRIPTION_MAX_LENGTH = 1200;

export interface ReportReasonOption {
  value: string;
  label: string;
}

export const REPORT_REASON_OPTIONS: ReportReasonOption[] = [
  { value: "Contenido inapropiado", label: "Contenido inapropiado" },
  { value: "Spam o publicidad enganosa", label: "Spam o publicidad enganosa" },
  { value: "Acoso o discurso de odio", label: "Acoso o discurso de odio" },
  { value: "Informacion falsa", label: "Informacion falsa" },
  { value: "Derechos de autor", label: "Derechos de autor" },
  { value: "Otro", label: "Otro" },
];

export interface ReportFormValues {
  reason: string;
  description: string;
}

export interface ReportFormErrors {
  reason?: string;
  description?: string;
}

export const createEmptyReportFormValues = (): ReportFormValues => ({
  reason: REPORT_REASON_OPTIONS[0]?.value ?? "",
  description: "",
});

export const validateReportForm = (values: ReportFormValues): ReportFormErrors => {
  const errors: ReportFormErrors = {};
  const reason = values.reason.trim();
  const description = values.description.trim();

  if (!reason) {
    errors.reason = "Selecciona o escribe un motivo.";
  } else if (reason.length > REPORT_REASON_MAX_LENGTH) {
    errors.reason = `El motivo no puede superar ${REPORT_REASON_MAX_LENGTH} caracteres.`;
  }

  if (description.length > REPORT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripcion no puede superar ${REPORT_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  return errors;
};

export const hasReportFormErrors = (errors: ReportFormErrors): boolean =>
  Boolean(errors.reason || errors.description);

export const buildReportPayload = (
  targetType: ReportTargetType,
  targetId: string,
  values: ReportFormValues
) => {
  const description = values.description.trim();

  return {
    targetType,
    targetId: targetId.trim(),
    reason: values.reason.trim(),
    ...(description ? { description } : {}),
  };
};
