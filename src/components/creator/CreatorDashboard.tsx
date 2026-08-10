import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Box, Flex, Heading, Image, Separator, Spinner, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaBookmark, FaChartLine, FaComments, FaEye, FaHeart, FaShare, FaUsers } from "react-icons/fa";
import { api } from "../../services/api";
import type { CreatorDashboard as CreatorDashboardData, Follow } from "../../types";
import { AppButton, AppModal, EmptyState, RatingStars } from "../../shared/ui";

const numberFormatter = new Intl.NumberFormat("es-MX");

const formatNumber = (value: number | undefined) => numberFormatter.format(Number(value ?? 0));

const formatRating = (value: number | undefined) => Number(value ?? 0).toFixed(1);

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    dateStyle: "medium",
  });
};

export default function CreatorDashboard() {
  const [dashboard, setDashboard] = useState<CreatorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const navigate = useNavigate();

  const metricTiles = useMemo(() => {
    const totals = dashboard?.totals;

    return [
      { label: "Publicaciones", value: formatNumber(totals?.publications), icon: <FaChartLine /> },
      { label: "Vistas", value: formatNumber(totals?.views), icon: <FaEye /> },
      { label: "Likes", value: formatNumber(totals?.likes), icon: <FaHeart /> },
      { label: "Comentarios", value: formatNumber(totals?.comments), icon: <FaComments /> },
      { label: "Compartidos", value: formatNumber(totals?.shares), icon: <FaShare /> },
      { label: "Guardados", value: formatNumber(totals?.saved), icon: <FaBookmark /> },
    ];
  }, [dashboard]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await api.creatorDashboard.get();
      setDashboard(result);
    } catch (error: unknown) {
      setDashboard(null);
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={6} color="var(--text-color)">
      <Flex
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={4}
        mb={6}
      >
        <Box>
          <Heading as="h1" size="4xl" mb={2}>
            Dashboard de creador
          </Heading>
          <Text color="var(--text-muted)">Metricas agregadas de tus publicaciones educativas.</Text>
        </Box>
        <Flex gap={3} wrap="wrap">
          <AppButton type="button" tone="ghost" onClick={() => void loadDashboard()} disabled={isLoading}>
            Recargar
          </AppButton>
          <AppButton type="button" onClick={() => navigate("/create-publication")}>
            Crear publicacion
          </AppButton>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="var(--text-color)" />
        </Flex>
      ) : errorMessage ? (
        <EmptyState title={errorMessage} minH="40vh" />
      ) : dashboard ? (
        <>
          <Box
            border="1px solid"
            borderColor="var(--card-border)"
            borderRadius="panel"
            p={5}
            mb={6}
            bg="var(--surface-bg)"
          >
            <Flex
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <Box>
                <Heading as="h2" size="lg" mb={1}>
                  {dashboard.creator.username}
                </Heading>
                <Text color="var(--text-muted)">{dashboard.creator.email}</Text>
              </Box>
              <Flex gap={4} wrap="wrap" align="center">
                <Box
                  onClick={() => setShowFollowersModal(true)}
                  cursor="pointer"
                  borderRadius="panel"
                  p={2}
                  color="var(--text-color)"
                  transition="all 0.2s ease"
                  _hover={{ bg: "var(--ghost-hover-bg)", transform: "translateY(-1px)", color: "var(--bg-color)" }}
                  role="button"
                  aria-label="Ver lista de seguidores"
                >
                  <CreatorMetric
                    icon={<FaUsers />}
                    label="Seguidores"
                    value={formatNumber(dashboard.creator.followersCount)}
                  />
                </Box>
                <Box minW="170px">
                  <Text color="var(--text-muted)" fontSize="sm" mb={1}>
                    Rating de perfil
                  </Text>
                  <Flex align="center" gap={2}>
                    <RatingStars value={dashboard.creator.ratingAvg} size={16} />
                    <Text fontWeight="700">
                      {formatRating(dashboard.creator.ratingAvg)} (
                      {formatNumber(dashboard.creator.ratingCount)})
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Box>

          <FollowersModal
            isOpen={showFollowersModal}
            onClose={() => setShowFollowersModal(false)}
            creatorEmail={dashboard.creator.email}
          />

          <Flex gap={3} wrap="wrap" mb={6}>
            {metricTiles.map((metric) => (
              <MetricTile key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
            ))}
          </Flex>

          <Flex gap={6} direction={{ base: "column", xl: "row" }} align="stretch">
            <TopPublicationList
              title="Mas vistas"
              items={dashboard.topPublications.byViews}
              metricLabel="vistas"
              getMetric={(item) => formatNumber(item.viewsCount)}
              onOpen={(id) => navigate(`/publication?post=${id}`)}
            />
            <TopPublicationList
              title="Mas guardadas"
              items={dashboard.topPublications.bySaved}
              metricLabel="guardados"
              getMetric={(item) => formatNumber(item.savedCount)}
              onOpen={(id) => navigate(`/publication?post=${id}`)}
            />
          </Flex>
        </>
      ) : (
        <EmptyState title="No hay datos de dashboard." minH="40vh" />
      )}
    </Box>
  );
}

function CreatorMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Flex align="center" gap={3} minW="160px">
      <Box color="inherit">{icon}</Box>
      <Box>
        <Text color="inherit" fontSize="sm" opacity={0.8}>
          {label}
        </Text>
        <Text fontWeight="700" color="inherit">{value}</Text>
      </Box>
    </Flex>
  );
}

function MetricTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box
      flex="1 1 160px"
      minW="150px"
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="panel"
      p={4}
      bg="var(--surface-bg)"
    >
      <Flex align="center" gap={3} mb={2}>
        <Box color="brand.300">{icon}</Box>
        <Text color="var(--text-muted)" fontSize="sm">
          {label}
        </Text>
      </Flex>
      <Text fontSize="2xl" fontWeight="800">
        {value}
      </Text>
    </Box>
  );
}

interface TopPublicationListProps<
  T extends { id: string; title?: string; categoryId?: string; createdAt: string },
> {
  title: string;
  items: T[];
  metricLabel: string;
  getMetric: (item: T) => string;
  onOpen: (id: string) => void;
}

function TopPublicationList<
  T extends { id: string; title?: string; categoryId?: string; createdAt: string },
>({ title, items, metricLabel, getMetric, onOpen }: TopPublicationListProps<T>) {
  return (
    <Box
      flex="1"
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="panel"
      p={5}
      bg="var(--surface-bg)"
    >
      <Heading as="h2" size="lg" mb={4}>
        {title}
      </Heading>

      {items.length === 0 ? (
        <EmptyState title="Sin publicaciones." minH="12rem" />
      ) : (
        <VStack align="stretch" gap={0}>
          {items.map((item) => (
            <Box key={item.id} py={3}>
              <Flex justify="space-between" align="flex-start" gap={3}>
                <Box flex="1">
                  <Text fontWeight="700" mb={1}>
                    {item.title || "Publicacion sin titulo"}
                  </Text>
                  <Flex gap={2} align="center" wrap="wrap">
                    {item.categoryId && (
                      <Badge borderRadius="panel" colorPalette="blue">
                        {item.categoryId}
                      </Badge>
                    )}
                    <Text color="var(--text-muted)" fontSize="sm">
                      {formatDate(item.createdAt)}
                    </Text>
                  </Flex>
                </Box>
                <Box textAlign="right">
                  <Text fontWeight="800">{getMetric(item)}</Text>
                  <Text color="var(--text-muted)" fontSize="sm">
                    {metricLabel}
                  </Text>
                </Box>
              </Flex>
              <Flex justify="flex-end" mt={3}>
                <AppButton type="button" tone="ghost" size="sm" minH="2rem" onClick={() => onOpen(item.id)}>
                  Ver
                </AppButton>
              </Flex>
              <Separator borderColor="var(--card-border)" mt={3} />
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}

function FollowersModal({
  isOpen,
  onClose,
  creatorEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  creatorEmail: string;
}) {
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api.social
      .listFollowers(creatorEmail)
      .then((res) => {
        setFollowers(res.followers || []);
      })
      .catch((err) => {
        console.error("Error al cargar seguidores:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, creatorEmail]);

  return (
    <AppModal isOpen={isOpen} title="Seguidores" size="md" onClose={onClose}>
      {isLoading ? (
        <Flex justify="center" py={8}>
          <Spinner color="var(--text-color)" size="lg" />
        </Flex>
      ) : followers.length === 0 ? (
        <Box py={8} textAlign="center">
          <Text color="var(--text-muted)" fontSize="md" fontWeight="bold">
            Aún no tienes seguidores
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={3} maxH="60vh" overflowY="auto" py={2} px={1}>
          {followers.map((item, idx) => {
            const followerUser = item.user || item.follower;
            const email = item.followerEmail || item.email || followerUser?.email || "";
            const username =
              item.username || followerUser?.username || (email ? email.split("@")[0] : `Seguidor ${idx + 1}`);
            const avatar =
              item.profilePicUrl ||
              item.profilePicture ||
              followerUser?.profilePicUrl ||
              followerUser?.profilePicture ||
              "/Profile.svg";

            return (
              <Flex
                key={email || `follower-${idx}`}
                align="center"
                justify="space-between"
                p={3}
                bg="var(--input-bg)"
                border="1px solid var(--input-border)"
                borderRadius="lg"
                gap={3}
              >
                <Flex align="center" gap={3} overflow="hidden">
                  <Image
                    src={avatar}
                    alt={`Perfil de ${username}`}
                    borderRadius="full"
                    boxSize="2.5rem"
                    objectFit="cover"
                  />
                  <Box textAlign="left" overflow="hidden">
                    <Text color="var(--text-color)" fontWeight="bold" fontSize="sm" truncate>
                      {username}
                    </Text>
                    <Text color="var(--text-muted)" fontSize="xs" truncate>
                      {email}
                    </Text>
                  </Box>
                </Flex>

                <AppButton
                  size="xs"
                  tone="ghost"
                  onClick={() => {
                    onClose();
                    navigate(`/profile?user=${encodeURIComponent(email)}`);
                  }}
                >
                  Ver perfil
                </AppButton>
              </Flex>
            );
          })}
        </VStack>
      )}
    </AppModal>
  );
}
