import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Flex, Heading, Separator, Spinner, Text, VStack, chakra } from "@chakra-ui/react";
import { FaBan, FaCheck, FaComment, FaFileAlt, FaSync, FaUser } from "react-icons/fa";
import { api } from "../../services/api";
import type { Report, ReportStatus, ReportTargetType } from "../../types";
import { AppButton, EmptyState } from "../../shared/ui";

type ReviewStatus = Exclude<ReportStatus, "pending">;

const statusOptions: Array<{ value: ReportStatus; label: string; colorPalette: string }> = [
  { value: "pending", label: "Pendientes", colorPalette: "yellow" },
  { value: "reviewed", label: "Revisados", colorPalette: "blue" },
  { value: "dismissed", label: "Descartados", colorPalette: "gray" },
  { value: "actioned", label: "Accionados", colorPalette: "green" },
];

const reviewActions: Array<{
  status: ReviewStatus;
  label: string;
  tone: "primary" | "secondary" | "ghost" | "danger";
}> = [
  { status: "reviewed", label: "Marcar revisado", tone: "secondary" },
  { status: "dismissed", label: "Descartar", tone: "ghost" },
  { status: "actioned", label: "Accion tomada", tone: "primary" },
];

const targetTypeLabels: Record<ReportTargetType, string> = {
  publication: "Publicacion",
  comment: "Comentario",
  user: "Usuario",
};

const getStatusOption = (status: ReportStatus) =>
  statusOptions.find((option) => option.value === status) ?? statusOptions[0];

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getTargetIcon = (targetType: ReportTargetType) => {
  if (targetType === "comment") return <FaComment />;
  if (targetType === "user") return <FaUser />;
  return <FaFileAlt />;
};

export default function AdminReports() {
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [reports, setReports] = useState<Report[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isFeedbackError, setIsFeedbackError] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  const selectedStatus = useMemo(() => getStatusOption(status), [status]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => report.status === status);
  }, [reports, status]);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      setFeedbackMessage("");
      setIsFeedbackError(false);

      try {
        const result = await api.admin.listReports(status);
        setReports(result.reports || []);
        setNextToken(result.nextToken);
      } catch {
        setReports([]);
        setNextToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReports();
  }, [status, reloadVersion]);

  const loadMore = async () => {
    if (!nextToken || isLoadingMore) return;

    setIsLoadingMore(true);
    setFeedbackMessage("");
    setIsFeedbackError(false);

    try {
      const result = await api.admin.listReports(status, 20, nextToken);
      setReports((current) => [...current, ...result.reports]);
      setNextToken(result.nextToken);
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudieron cargar mas reportes.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const applyReviewedReport = (updatedReport: Report) => {
    setReports((current) => {
      if (updatedReport.status !== status) {
        return current.filter((report) => report.id !== updatedReport.id);
      }

      return current.map((report) => (report.id === updatedReport.id ? updatedReport : report));
    });
  };

  const reviewReport = async (report: Report, nextStatus: ReviewStatus) => {
    setProcessingReportId(report.id);
    setFeedbackMessage("");
    setIsFeedbackError(false);

    try {
      const updatedReport = await api.admin.reviewReport(report.id, nextStatus, "");
      applyReviewedReport(updatedReport);
      setIsFeedbackError(false);
      setFeedbackMessage("Reporte actualizado.");
    } catch (error: unknown) {
      setIsFeedbackError(true);
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo actualizar el reporte.");
    } finally {
      setProcessingReportId(null);
    }
  };

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={6} color="var(--text-color)">
      <Heading as="h1" size="4xl" mb={2}>
        Reportes
      </Heading>
      <Text color="var(--text-muted)" mb={6}>
        Revisa reportes enviados por usuarios y registra las acciones de moderacion.
      </Text>

      <Flex
        gap={4}
        align={{ base: "stretch", md: "flex-end" }}
        direction={{ base: "column", md: "row" }}
        mb={5}
      >
        <Box w={{ base: "100%", md: "280px" }}>
          <chakra.label htmlFor="report-status-filter" display="block" mb={2}>
            Estado
          </chakra.label>
          <chakra.select
            id="report-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value as ReportStatus)}
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
          {filteredReports.length} resultados
        </Text>
      </Flex>

      {feedbackMessage && (
        <Text mb={4} color={isFeedbackError ? "red.400" : "green.300"}>
          {feedbackMessage}
        </Text>
      )}

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="var(--text-color)" />
        </Flex>
      ) : filteredReports.length === 0 ? (
        <EmptyState title={`No hay reportes ${selectedStatus.label.toLowerCase()}.`} minH="35vh" />
      ) : (
        <VStack align="stretch" gap={0} borderTop="1px solid" borderColor="var(--card-border)">
          {filteredReports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              isProcessing={processingReportId === report.id}
              onReview={(nextStatus) => void reviewReport(report, nextStatus)}
            />
          ))}
        </VStack>
      )}

      {nextToken && !isLoading && (
        <Flex justify="center" mt={6}>
          <AppButton type="button" tone="ghost" onClick={() => void loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <Flex align="center" gap={2}>
                <Spinner size="sm" />
                <Text>Cargando...</Text>
              </Flex>
            ) : (
              "Cargar mas"
            )}
          </AppButton>
        </Flex>
      )}
    </Box>
  );
}

function ReportRow({
  report,
  isProcessing,
  onReview,
}: {
  report: Report;
  isProcessing: boolean;
  onReview: (status: ReviewStatus) => void;
}) {
  const statusOption = getStatusOption(report.status);
  const isPending = report.status === "pending";

  return (
    <Box py={5}>
      <Flex
        justify="space-between"
        gap={4}
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "center" }}
      >
        <Box flex="1">
          <Flex gap={2} align="center" wrap="wrap" mb={2}>
            <Flex align="center" gap={2}>
              {getTargetIcon(report.targetType)}
              <Heading as="h2" size="md">
                {targetTypeLabels[report.targetType]}
              </Heading>
            </Flex>
            <Badge borderRadius="panel" colorPalette={statusOption.colorPalette}>
              {statusOption.label}
            </Badge>
          </Flex>

          <Text color="var(--text-muted)" fontSize="sm" mb={3}>
            {report.reportedUser && (
              <>
                Usuario reportado: {report.reportedUser.name || report.reportedUser.username || "Creador"} ({report.reportedUser.email || "Correo no disponible"}) |{" "}
              </>
            )}
            {report.targetType === "publication" ? "ID Publicación" : "ID objetivo"}: {report.targetId} | {" "}
            Reportado por: {report.reporterEmail || "desconocido"} - {formatDate(report.createdAt)}
          </Text>

          <Text fontWeight="700" mb={1}>
            {report.reason}
          </Text>
          {report.description && (
            <Text color="var(--text-color)" whiteSpace="pre-wrap" mb={3}>
              {report.description}
            </Text>
          )}

          {(report.reviewNotes || report.reviewedAt) && (
            <Text color="var(--text-muted)" fontSize="sm">
              Revision: {report.reviewNotes || "Sin notas"}{" "}
              {report.reviewedAt ? `(${formatDate(report.reviewedAt)})` : ""}
            </Text>
          )}
        </Box>

        {isPending && (
          <Flex
            gap={2}
            justify={{ base: "flex-start", lg: "flex-end" }}
            align="center"
            wrap="wrap"
            shrink={0}
          >
            {reviewActions.map((action) => (
              <AppButton
                key={action.status}
                type="button"
                tone={action.tone}
                onClick={() => onReview(action.status)}
                disabled={isProcessing}
              >
                <Flex align="center" gap={2}>
                  {action.status === "dismissed" ? <FaBan /> : <FaCheck />}
                  <Text>{action.label}</Text>
                </Flex>
              </AppButton>
            ))}
          </Flex>
        )}
      </Flex>
      <Separator borderColor="var(--card-border)" mt={5} />
    </Box>
  );
}
