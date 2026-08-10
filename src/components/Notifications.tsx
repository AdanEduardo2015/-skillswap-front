import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, Image, VStack, Button, chakra } from "@chakra-ui/react";
import {
  FaBell,
  FaBookmark,
  FaCog,
  FaFlag,
  FaGavel,
  FaRegComment,
  FaStar,
  FaThumbsDown,
  FaThumbsUp,
  FaUser,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { useNotificationStore } from "../utils/NotificationStore";
import { getToken } from "../utils/GlobalVariables";
import { SkeletonNotification } from "./Skeletons";
import { AppModal } from "../shared/ui";
import type { Notification } from "../types";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import { usePolling } from "../hooks/usePolling";

const isRecoverableAuthError = (error: unknown) => {
  if (!(error instanceof Error)) return false;

  const status = (error as Error & { status?: number }).status;
  return (
    (status === 401 || status === 404) &&
    /^(No autorizado|Usuario no encontrado|Unauthorized)$/i.test(error.message)
  );
};

type NotificationKind =
  "report" | "like" | "dislike" | "comment" | "saved" | "sanction" | "rating" | "follower" | "appeal" | "default";

interface NotificationVisual {
  Icon: IconType;
  label: string;
  color: string;
  bg: string;
}

const notificationVisuals: Record<NotificationKind, NotificationVisual> = {
  report: { Icon: FaFlag, label: "Reporte", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.16)" },
  like: { Icon: FaThumbsUp, label: "Like", color: "#2f80ed", bg: "rgba(47, 128, 237, 0.16)" },
  dislike: { Icon: FaThumbsDown, label: "Dislike", color: "#64748b", bg: "rgba(100, 116, 139, 0.18)" },
  comment: { Icon: FaRegComment, label: "Comentario", color: "#35c27f", bg: "rgba(53, 194, 127, 0.16)" },
  saved: { Icon: FaBookmark, label: "Guardado", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.16)" },
  appeal: { Icon: FaGavel, label: "Apelación", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.16)" },
  sanction: { Icon: FaGavel, label: "Sancion", color: "#ef4444", bg: "rgba(239, 68, 68, 0.16)" },
  rating: { Icon: FaStar, label: "Calificacion", color: "#eab308", bg: "rgba(234, 179, 8, 0.18)" },
  follower: { Icon: FaUser, label: "Seguidor", color: "#10b981", bg: "rgba(16, 185, 129, 0.16)" },
  default: { Icon: FaBell, label: "Notificacion", color: "#2f80ed", bg: "rgba(47, 128, 237, 0.16)" },
};

const normalizeNotificationText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getNotificationKind = (notification: Notification): NotificationKind => {
  const text = normalizeNotificationText(
    `${notification.type ?? ""} ${notification.targetType ?? ""} ${notification.message ?? ""}`
  );

  if (text.includes("report") || text.includes("reporte") || text.includes("denuncia")) return "report";
  if (text.includes("dislike") || text.includes("no me gusta")) return "dislike";
  if (text.includes("like") || text.includes("me gusta")) return "like";
  if (text.includes("comment") || text.includes("comentario")) return "comment";
  if (text.includes("saved") || text.includes("guardado") || text.includes("favorito")) return "saved";
  if (text.includes("apelacion") || text.includes("appeal") || text.includes("apelación")) return "appeal";
  if (
    text.includes("sanction") ||
    text.includes("sancion") ||
    text.includes("ban") ||
    text.includes("suspend")
  )
    return "sanction";
  if (
    text.includes("rating") ||
    text.includes("calificacion") ||
    text.includes("calificar") ||
    text.includes("estrella")
  )
    return "rating";

  if (
    text.includes("follow") ||
    text.includes("siguiendo") ||
    text.includes("seguidor") ||
    text.includes("sigue")
  )
    return "follower";

  return "default";
};

const formatNotificationDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const isNotificationUnread = (notification: Notification) =>
  !(notification.read || notification.isRead);

function Notifications() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [notificationsSettings, setNotificationsSettings] = useState<{ notificationsEnabled: boolean }>({
    notificationsEnabled: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [selectedAppealNotification, setSelectedAppealNotification] = useState<Notification | null>(null);

  const setHasUnreadNotifications = useNotificationStore((state) => state.setHasUnreadNotifications);
  const { isAuthenticated, isLoading: isSessionLoading, user } = useAuthSession();
  const canLoadNotifications = !isSessionLoading && isAuthenticated && Boolean(user?.email);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let isActive = true;
    const loadSettings = async () => {
      try {
        const settings = await api.notifications.getSettings();
        if (isActive) {
          setNotificationsSettings(settings);
        }
      } catch {
        if (isActive) {
          setNotificationsSettings({ notificationsEnabled: true });
        }
      }
    };
    void loadSettings();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!canLoadNotifications) {
      setHasUnreadNotifications(false);
      return;
    }

    const hasUnread = notificaciones.some((n) => !(n.read || n.isRead));
    setHasUnreadNotifications(hasUnread);
  }, [notificaciones, canLoadNotifications, setHasUnreadNotifications]);

  const fetchNotifications = async (showLoader = false) => {
    if (!canLoadNotifications) {
      if (showLoader) setIsLoading(false);
      setNotificaciones([]);
      return;
    }

    if (showLoader) setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setNotificaciones([]);
        return;
      }

      const res = await api.notifications.list();
      const fetched = res.notifications || [];

      if (showLoader) {
        setNotificaciones(fetched);
      } else {
        setNotificaciones((current) => {
          const currentIds = new Set(current.map(n => n.id));
          const newItems = fetched.filter(n => !currentIds.has(n.id));
          const updatedCurrent = current.map(c => {
             const updated = fetched.find(n => n.id === c.id);
             return updated || c;
          });
          return [...newItems, ...updatedCurrent];
        });
      }
    } catch (error: unknown) {
      if (isRecoverableAuthError(error)) {
        setNotificaciones([]);
        return;
      }
      console.error("Error loading notifications:", error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadNotifications]);

  usePolling(() => {
    void fetchNotifications(false);
  }, canLoadNotifications ? 10000 : null, [canLoadNotifications]);

  const handleToggleNotificationsEnabled = async (enabled: boolean) => {
    setIsSavingSettings(true);
    try {
      const updated = await api.notifications.updateSettings(enabled);
      setNotificationsSettings(updated);
    } catch {
      setNotificationsSettings({ notificationsEnabled: enabled });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const leerNotificacion = async (id: string) => {
    const previousNotifications = [...notificaciones];

    setNotificaciones((prev) => prev.filter((n) => n.id !== id));

    try {
      await api.notifications.read(id);
    } catch {
      setNotificaciones(previousNotifications);
    }
  };

  const handleClearAll = async () => {
    const previousNotifications = [...notificaciones];
    setIsClearing(true);
    setNotificaciones([]);

    try {
      await api.notifications.deleteAll();
    } catch (error) {
      console.error(error);
      setNotificaciones(previousNotifications);
    } finally {
      setIsClearing(false);
    }
  };

  const openNotification = (notification: Notification) => {
    void leerNotificacion(notification.id);
    
    const kind = getNotificationKind(notification);
    
    if (kind === "appeal") {
      setSelectedAppealNotification(notification);
      return;
    }
    
    if (kind === "report") {
      if (isAdmin) {
        navigate("/admin/reports");
      } else {
        alert("Tu reporte ya fue recibido y revisado por la administración. ¡Gracias!");
      }
    } else if (kind === "follower" || notification.targetType === "user") {
      const userToView = notification.targetId || notification.user?.email || "";
      navigate("/profile?user=" + userToView);
    } else {
      navigate("/publication?post=" + (notification.targetId ?? notification.publicationId ?? ""));
    }
  };

  const hasNotificaciones = notificaciones.length > 0;
  const notificationsEnabled = notificationsSettings.notificationsEnabled;

  // Remove the early return so the header is always rendered

  return (
    <Flex direction="column" minH="100vh" textAlign="center" py={{ base: 3, md: 4 }}>
      <Flex
        w={{ base: "92%", md: "75%" }}
        maxW="46rem"
        mx="auto"
        mb={4}
        justify="space-between"
        align="center"
        gap={3}
      >
        <Flex align="center" gap={3}>
          <Heading
            as="h1"
            fontSize={{ base: "2rem", md: "3rem" }}
            color="var(--text-color)"
            textAlign="left"
            lineHeight="1.1"
          >
            Notificaciones
          </Heading>

          {isAdmin && (
            <chakra.button
              type="button"
              onClick={() => void handleToggleNotificationsEnabled(!notificationsEnabled)}
              disabled={isSavingSettings}
              p={2}
              borderRadius="full"
              bg={notificationsEnabled ? "rgba(53, 194, 127, 0.15)" : "rgba(239, 68, 68, 0.15)"}
              color={notificationsEnabled ? "#35c27f" : "#ef4444"}
              _hover={{ opacity: 0.8 }}
              transition="all 0.2s ease"
              title={
                notificationsEnabled
                  ? "Desactivar centro de notificaciones (Admin)"
                  : "Activar centro de notificaciones (Admin)"
              }
              aria-label="Alternar notificaciones (Admin)"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              <FaCog size={18} />
            </chakra.button>
          )}
        </Flex>
        {hasNotificaciones && (
          <Button
            size="sm"
            bg="transparent"
            color="danger.500"
            _hover={{ bg: "rgba(239, 68, 68, 0.12)" }}
            onClick={handleClearAll}
            disabled={isClearing}
            fontWeight="semibold"
            px={3}
          >
            {isClearing ? "Limpiando..." : "Limpiar todo"}
          </Button>
        )}
      </Flex>

      {isLoading && (
        <VStack w={{ base: "92%", md: "75%" }} maxW="46rem" mx="auto" gap={3}>
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
          <SkeletonNotification />
        </VStack>
      )}

      {!isLoading && !hasNotificaciones && notificationsEnabled && (
        <Box
          w={{ base: "92%", md: "75%" }}
          maxW="46rem"
          mx="auto"
          mt={4}
          p={6}
          bg="var(--surface-elevated)"
          border="1px solid var(--card-border)"
          borderRadius="panel"
        >
          <Text color="var(--text-muted)" textAlign="center">
            No tienes notificaciones
          </Text>
        </Box>
      )}

      {!isLoading && hasNotificaciones && notificationsEnabled && (
        <VStack w={{ base: "92%", md: "75%" }} maxW="46rem" mx="auto" gap={3} align="stretch">
          {notificaciones.map((noti) => {
            const isUnread = isNotificationUnread(noti);
            const visual = notificationVisuals[getNotificationKind(noti)];
            const Icon = visual.Icon;
            const createdAtLabel = formatNotificationDate(noti.createdAt);

            return (
              <Flex
                key={noti.id}
                role="button"
                tabIndex={0}
                align="flex-start"
                gap={3}
                p={{ base: 3, md: 4 }}
                w="100%"
                color="var(--text-color)"
                bg={isUnread ? "rgba(47, 128, 237, 0.12)" : "var(--surface-elevated)"}
                border="1px solid"
                borderColor={isUnread ? "rgba(47, 128, 237, 0.38)" : "var(--card-border)"}
                borderRadius="panel"
                cursor="pointer"
                position="relative"
                textAlign="left"
                boxShadow={isUnread ? "0 10px 30px rgba(47, 128, 237, 0.08)" : "none"}
                transition="background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease"
                _hover={{
                  bg: isUnread ? "rgba(47, 128, 237, 0.16)" : "var(--surface-muted)",
                  transform: "translateY(-1px)",
                }}
                onClick={() => openNotification(noti)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openNotification(noti);
                  }
                }}
              >
                {isUnread && (
                  <Box
                    position="absolute"
                    top="0.95rem"
                    left="0.45rem"
                    w="8px"
                    h="8px"
                    bg="#2f80ed"
                    borderRadius="full"
                  />
                )}

                <Box position="relative" flex="0 0 auto" ml={isUnread ? 1 : 0}>
                  <Box bg="var(--surface-muted)" borderRadius="full" boxSize={{ base: "2.75rem", md: "3rem" }} overflow="hidden">
                    <Image
                      src={noti.user?.profilePicUrl ?? noti.user?.profilePicture ?? "/Profile.svg"}
                      alt={noti.user?.username ?? "Usuario"}
                      userSelect="none"
                      borderRadius="full"
                      boxSize="100%"
                      objectFit="cover"
                      bg="transparent"
                    />
                  </Box>
                  <Flex
                    position="absolute"
                    right="-3px"
                    bottom="-3px"
                    w="1.35rem"
                    h="1.35rem"
                    align="center"
                    justify="center"
                    borderRadius="full"
                    bg={visual.bg}
                    color={visual.color}
                    border="2px solid var(--surface-elevated)"
                    title={visual.label}
                  >
                    <Icon size={12} aria-hidden="true" />
                  </Flex>
                </Box>

                <Box flex="1" minW={0} pr={{ base: 1, md: 2 }}>
                  <Flex align="flex-start" justify="space-between" gap={3}>
                    <Text
                      as="span"
                      color="var(--text-color)"
                      fontSize={{ base: "sm", md: "md" }}
                      fontWeight={isUnread ? "semibold" : "normal"}
                      lineHeight="1.35"
                    >
                      {noti.message}
                    </Text>
                    {createdAtLabel && (
                      <chakra.time
                        dateTime={noti.createdAt}
                        color="var(--text-subtle)"
                        fontSize="xs"
                        lineHeight="1.2"
                        whiteSpace="nowrap"
                        flex="0 0 auto"
                        pt="2px"
                      >
                        {createdAtLabel}
                      </chakra.time>
                    )}
                  </Flex>
                </Box>

                <chakra.button
                  type="button"
                  aria-label="Eliminar"
                  onClick={(event) => {
                    event.stopPropagation();
                    void leerNotificacion(noti.id);
                  }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flex="0 0 auto"
                  w="1.75rem"
                  h="1.75rem"
                  borderRadius="full"
                  opacity={0.62}
                  transition="opacity 0.2s ease, background-color 0.2s ease"
                  _hover={{ opacity: 1, bg: "var(--ghost-hover-bg)" }}
                >
                  <Image src="/Cancel-white.svg" boxSize="0.7rem" alt="" aria-hidden="true" />
                </chakra.button>
              </Flex>
            );
          })}
        </VStack>
      )}

      {!isLoading && !notificationsEnabled && (
        <Flex direction="column" mt={8} align="center" justify="center" px={4} textAlign="center">
          <Box
            p={{ base: 6, md: 8 }}
            maxW="28rem"
            w="100%"
            bg="var(--surface-elevated)"
            border="1px solid var(--card-border)"
            borderRadius="panel"
            boxShadow="0 10px 30px rgba(0,0,0,0.1)"
          >
            <Flex justify="center" mb={4} color="var(--brand-primary)">
              <FaBell size={44} />
            </Flex>
            <Heading as="h1" size="2xl" mb={3} color="var(--text-color)">
              Próximamente
            </Heading>
            <Text color="var(--text-muted)" fontSize="md" lineHeight="1.5">
              Estamos haciendo mejoras en el centro de notificaciones.
            </Text>
          </Box>
        </Flex>
      )}
      <AppModal
        isOpen={Boolean(selectedAppealNotification)}
        onClose={() => setSelectedAppealNotification(null)}
        title="Detalle de Apelación Rechazada"
        size="md"
      >
        {selectedAppealNotification && (
          <Box textAlign="left" color="var(--text-color)">
            <Text mb={3} fontWeight="bold">Motivo del rechazo:</Text>
            <Text mb={4} p={3} bg="var(--ghost-hover-bg)" color="var(--bg-color)" borderRadius="md">
              {selectedAppealNotification.motivo || selectedAppealNotification.reason || selectedAppealNotification.message}
            </Text>
            
            {selectedAppealNotification.publicationId && (
              <Text fontSize="sm" color="var(--text-subtle)" mb={2}>
                <strong>ID de Publicación:</strong> {selectedAppealNotification.publicationId}
              </Text>
            )}
            
            <Text fontSize="sm" color="var(--text-subtle)">
              <strong>Fecha de resolución:</strong> {formatNotificationDate(selectedAppealNotification.createdAt)}
            </Text>

            <Button mt={6} w="100%" bg="var(--text-color)" color="var(--bg-color)" _hover={{ opacity: 0.8 }} onClick={() => setSelectedAppealNotification(null)}>
              Cerrar
            </Button>
          </Box>
        )}
      </AppModal>
    </Flex>
  );
}

export default Notifications;
