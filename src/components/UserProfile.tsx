import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { FiBookmark, FiGrid, FiHeart, FiMessageCircle, FiSend } from "react-icons/fi";
import type { IconType } from "react-icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSearchParamsGlobal } from "../utils/GlobalVariables";
import { useUserData } from "../utils/UserStore";
import { api, normalizeRole } from "../services/api";
import type { Publication, UserSummary, Sanction } from "../types";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import ConfirmModal from "./modals/ConfirmModal";
import { SkeletonProfileHeader, SkeletonFeed } from "./Skeletons";
import ProfileSummaryCard from "../features/profiles/ProfileSummaryCard";
import ProfileAdminActions, { type ProfileAdminAction } from "../features/profiles/ProfileAdminActions";
import { AppButton } from "../shared/ui";
import InteractiveRating from "../features/social/InteractiveRating";
import { calculateOptimisticRatingSummary } from "../features/social/socialInteractions";

const actionTitles: Record<ProfileAdminAction, string> = {
  ban: "Estas seguro de que deseas restringir esta cuenta?",
  unban: "Estas seguro de que deseas reactivar esta cuenta?",
};

const successMessages: Record<ProfileAdminAction, string> = {
  ban: "La cuenta fue restringida",
  unban: "La cuenta fue reactivada",
};

const errorMessages: Record<ProfileAdminAction, string> = {
  ban: "Hubo un problema al restringir la cuenta",
  unban: "Hubo un problema al reactivar la cuenta",
};

const numberFormatter = new Intl.NumberFormat("es-MX");

const formatNumber = (value: number) => numberFormatter.format(value);

const getCommentCount = (post: Publication) => post.comments?.total ?? post.commentsCount ?? 0;

interface UserProfileStats {
  publications: number;
  likes: number;
  comments: number;
  shares: number;
  saved: number;
}

const buildProfileStats = (posts: Publication[]): UserProfileStats =>
  posts.reduce(
    (stats, post) => ({
      publications: stats.publications + 1,
      likes: stats.likes + (post.likesCount ?? 0),
      comments: stats.comments + getCommentCount(post),
      shares: stats.shares + (post.sharesCount ?? 0),
      saved: stats.saved + (post.savedCount ?? 0),
    }),
    {
      publications: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saved: 0,
    }
  );

function UserProfile() {
  const navigate = useNavigate();
  const searchParams = useSearchParamsGlobal();
  const { email: globalEmail, role: globalRole } = useUserData();
  const userEmail = searchParams.get("user");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ProfileAdminAction | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [posts, setPosts] = useState<Publication[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userProfile, setUserProfile] = useState<UserSummary | null>(null);
  const [profileUserRating, setProfileUserRating] = useState<number | null>(null);
  const [isRatingProfile, setIsRatingProfile] = useState(false);
  const ratingLock = useRef(false);
  const [status, setStatus] = useState({
    loading: false,
    notFound: false,
  });

  useEffect(() => {
    if (userEmail && userEmail === globalEmail) {
      navigate("/my-profile");
    }
  }, [userEmail, globalEmail, navigate]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const loadUserFeed = useCallback(
    async (token: string | null = null, isInitial = false) => {
      if (!userEmail) return;
      if (isInitial) setStatus({ loading: true, notFound: false });

      try {
        const response = await api.publications.listByUser(userEmail, 10, token);

        if (response.userProfile) {
          setUserProfile(response.userProfile);
          setProfileUserRating(response.userProfile.userRating ?? null);
        }

        setPosts((current) => (isInitial ? response.items : [...current, ...response.items]));
        setHasMore(response.hasMore);
        setNextToken(response.nextToken ?? null);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message === "Usuario no encontrado" || message.includes("404")) {
          if (isInitial) setStatus((current) => ({ ...current, notFound: true }));
        }
        setHasMore(false);
      } finally {
        if (isInitial) setStatus((current) => ({ ...current, loading: false }));
      }
    },
    [userEmail]
  );

  useEffect(() => {
    if (userEmail) void loadUserFeed(null, true);
  }, [userEmail, loadUserFeed]);

  const fetchMoreData = () => {
    void loadUserFeed(nextToken);
  };

  const handleConfirmAction = async () => {
    if (!userEmail || !action) return;
    setIsLoadingAction(true);

    try {
      const actionMap: Record<ProfileAdminAction, (email: string) => Promise<unknown>> = {
        ban: api.admin.banUser,
        unban: api.admin.unbanUser,
      };

      await actionMap[action](userEmail);
      showToast(successMessages[action]);

      setUserProfile((current) => {
        if (!current) return current;
        const nextBanned = action === "ban";
        return {
          ...current,
          isBanned: nextBanned,
          role: nextBanned ? "banned" : current.role === "banned" ? "consumer" : current.role,
        };
      });
    } catch {
      showToast(errorMessages[action]);
    } finally {
      setIsLoadingAction(false);
      setAction(null);
    }
  };

  const handleRateProfile = async (rating: number) => {
    if (!userEmail || ratingLock.current) return;
    ratingLock.current = true;
    setIsRatingProfile(true);

    const previousUserRating = profileUserRating;
    const currentProfile = userProfile ?? { ratingAvg: 0, ratingCount: 0 };
    const previousSummary = {
      ratingAvg: currentProfile.ratingAvg ?? 0,
      ratingCount: currentProfile.ratingCount ?? 0,
    };
    const optimistic = calculateOptimisticRatingSummary(
      previousSummary.ratingAvg,
      previousSummary.ratingCount,
      rating,
      previousUserRating
    );

    setProfileUserRating(rating);
    setUserProfile((current) =>
      current
        ? {
            ...current,
            ratingAvg: optimistic.ratingAvg,
            ratingCount: optimistic.ratingCount,
          }
        : current
    );

    try {
      const response = await api.ratings.create({
        targetType: "creator",
        targetId: userEmail,
        rating,
      });

      if (response.summary) {
        setUserProfile((current) =>
          current
            ? {
                ...current,
                ratingAvg: response.summary!.ratingAvg,
                ratingCount: response.summary!.ratingCount,
              }
            : current
        );
      }

      setProfileUserRating(response.rating?.rating ?? rating);
      showToast("Calificacion guardada");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";

      setProfileUserRating(previousUserRating);
      setUserProfile((current) =>
        current
          ? {
              ...current,
              ratingAvg: previousSummary.ratingAvg,
              ratingCount: previousSummary.ratingCount,
            }
          : current
      );

      if (message.includes("401")) showToast("Inicia sesion para calificar este perfil");
      else if (message.includes("403")) showToast("No tienes permisos para calificar este perfil");
      else if (message.includes("No puedes calificarte")) showToast("No puedes calificar tu propio perfil");
      else showToast("No se pudo guardar la calificacion");
    } finally {
      ratingLock.current = false;
      setIsRatingProfile(false);
    }
  };

  const viewerRole = globalRole ? normalizeRole(globalRole) : null;
  const canSendMessage = Boolean(userEmail && viewerRole && viewerRole !== "banned");
  const activityStats = buildProfileStats(posts);
  const displayedProfile: UserSummary = userProfile ?? {
    email: userEmail ?? "",
    username: "Usuario",
    profilePicUrl: null,
    role: "consumer",
  };
  const isOwnProfile = Boolean(
    globalEmail &&
    displayedProfile.email &&
    globalEmail.toLowerCase() === displayedProfile.email.toLowerCase()
  );
  const canRateProfile = Boolean(
    userEmail &&
    globalEmail &&
    viewerRole &&
    viewerRole !== "banned" &&
    displayedProfile.role !== "banned" &&
    !displayedProfile.isBanned
  );

  if (status.notFound) {
    return (
      <Heading textAlign="center" color="red.500" fontWeight="bold" fontSize="6xl" mt={5}>
        Usuario no encontrado
      </Heading>
    );
  }

  if (status.loading) return <SkeletonProfileHeader isMyProfile={false} />;

  return (
    <Flex justify="center" minH="100vh">
      <VStack w={["90%", "75%"]} minH="100dvh" maxW="container.md" align="stretch" gap={4}>
        {isOwnProfile && displayedProfile.activeSanctions && displayedProfile.activeSanctions.length > 0 && (
          <VStack align="stretch" gap={3} w="100%">
            {displayedProfile.activeSanctions.map((sanction: Sanction) => {
              if (sanction.type === "warning") {
                return (
                  <Box
                    key={sanction.id}
                    bg="rgba(245, 158, 11, 0.15)"
                    border="1px solid #f59e0b"
                    borderRadius="panel"
                    p={4}
                    color="var(--text-color)"
                  >
                    <Heading as="h4" size="md" color="yellow.400" mb={1}>
                      ⚠️ Advertencia de Cuenta
                    </Heading>
                    <Text fontSize="sm">
                      Has recibido una advertencia en tu cuenta. Motivo:{" "}
                      <strong>{sanction.description || "No especificado"}</strong>. Tu cuenta sigue
                      funcionando con normalidad.
                    </Text>
                  </Box>
                );
              }
              if (sanction.type === "temporary_ban") {
                return (
                  <Box
                    key={sanction.id}
                    bg="rgba(239, 68, 68, 0.15)"
                    border="1px solid #ef4444"
                    borderRadius="panel"
                    p={4}
                    color="var(--text-color)"
                  >
                    <Heading as="h4" size="md" color="red.400" mb={1}>
                      🚫 Baneo Temporal
                    </Heading>
                    <Text fontSize="sm" mb={1}>
                      Tu cuenta se encuentra baneada temporalmente. Motivo:{" "}
                      <strong>{sanction.description || "No especificado"}</strong>.
                    </Text>
                    {sanction.endsAt && (
                      <Text fontSize="sm" fontWeight="bold">
                        Tu cuenta volverá a estar activa el:{" "}
                        {new Date(sanction.endsAt).toLocaleString("es-MX", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </Text>
                    )}
                  </Box>
                );
              }
              if (sanction.type === "permanent_ban") {
                return (
                  <Box
                    key={sanction.id}
                    bg="rgba(239, 68, 68, 0.2)"
                    border="2px solid #ef4444"
                    borderRadius="panel"
                    p={4}
                    color="var(--text-color)"
                  >
                    <Heading as="h4" size="md" color="red.500" mb={1}>
                      💀 Baneo Permanente
                    </Heading>
                    <Text fontSize="sm">
                      Tu cuenta ha sido baneada permanentemente. Motivo:{" "}
                      <strong>{sanction.description || "No especificado"}</strong>. Todas las funciones de la
                      cuenta han sido suspendidas permanentemente.
                    </Text>
                  </Box>
                );
              }
              if (sanction.type === "content_restriction") {
                return (
                  <Box
                    key={sanction.id}
                    bg="rgba(239, 68, 68, 0.15)"
                    border="1px solid #ef4444"
                    borderRadius="panel"
                    p={4}
                    color="var(--text-color)"
                  >
                    <Heading as="h4" size="md" color="red.400" mb={1}>
                      Restricción de Contenido
                    </Heading>
                    <Text fontSize="sm">
                      Tienes una restricción activa en una publicación o video. Motivo:{" "}
                      <strong>{sanction.description || "No especificado"}</strong>.
                    </Text>
                  </Box>
                );
              }
              return null;
            })}
          </VStack>
        )}

        <ProfileSummaryCard
          heading={`Perfil de ${displayedProfile.username}`}
          profile={displayedProfile}
          onImageClick={setSelectedImage}
          actions={
            <Flex gap={2} wrap="wrap" justify="flex-end">
              {canSendMessage && (
                <AppButton
                  type="button"
                  tone="secondary"
                  onClick={() => navigate(`/messages?user=${encodeURIComponent(userEmail ?? "")}`)}
                >
                  <Flex align="center" gap={2}>
                    <FiSend />
                    <Text>Mensaje</Text>
                  </Flex>
                </AppButton>
              )}
              <ProfileAdminActions
                viewerRole={viewerRole}
                profile={displayedProfile}
                onAction={setAction}
                onEdit={() =>
                  navigate(`/edit-profile?user=${userEmail}`, { state: { profile: displayedProfile } })
                }
              />
            </Flex>
          }
        />

        <ProfileRatingPanel
          profile={displayedProfile}
          userRating={profileUserRating}
          canRate={canRateProfile}
          isLoading={isRatingProfile}
          isLoggedIn={Boolean(globalEmail)}
          isBannedViewer={viewerRole === "banned"}
          onRate={handleRateProfile}
        />

        <UserActivityStats stats={activityStats} />

        <Box as="hr" borderColor="var(--card-border)" my={4} />

        <Heading as="h3" size="lg" color="white" mb={5} textAlign="center">
          Publicaciones de {displayedProfile.username}
        </Heading>
        {posts.length === 0 ? (
          <Text color="white" textAlign="center">
            {displayedProfile.username} no tiene publicaciones
          </Text>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={fetchMoreData}
            hasMore={hasMore}
            loader={
              <Box mt={4}>
                <SkeletonFeed count={1} />
              </Box>
            }
            endMessage={
              <Text color="gray.500" textAlign="center" mt={6} mb={4} fontSize="sm">
                No hay mas publicaciones por cargar
              </Text>
            }
            style={{ overflow: "hidden" }}
          >
            {posts.map((post) => (
              <PublicationCard
                key={post.id}
                post={post}
                onImageClick={setSelectedImage}
                onPostDelete={async (deletedId) => {
                  setPosts((prev) => prev.filter((p) => p.id !== deletedId));
                  await loadUserFeed(null, true);
                }}
              />
            ))}
          </InfiniteScroll>
        )}

        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      </VStack>

      <ConfirmModal
        isOpen={action !== null}
        title={action ? actionTitles[action] : ""}
        isLoading={isLoadingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => setAction(null)}
      />

      {toastMessage && (
        <Box
          position="fixed"
          bottom="90px"
          left="50%"
          transform="translateX(-50%)"
          bg="white"
          color="black"
          px={5}
          py={3}
          borderRadius="xl"
          fontWeight="bold"
          fontSize="sm"
          zIndex={9999}
          boxShadow="0 4px 20px rgba(0,0,0,0.4)"
        >
          {toastMessage}
        </Box>
      )}
    </Flex>
  );
}

function ProfileRatingPanel({
  profile,
  userRating,
  canRate,
  isLoading,
  isLoggedIn,
  isBannedViewer,
  onRate,
}: {
  profile: UserSummary;
  userRating: number | null;
  canRate: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  isBannedViewer: boolean;
  onRate: (rating: number) => void;
}) {
  const helperText = !isLoggedIn
    ? "Inicia sesion para calificar este perfil."
    : isBannedViewer
      ? "Las cuentas restringidas no pueden calificar perfiles."
      : profile.isBanned || profile.role === "banned"
        ? "Este perfil no acepta nuevas calificaciones."
        : "Selecciona de 1 a 5 estrellas para calificar a este usuario.";

  return (
    <Box
      as="section"
      aria-labelledby="profile-rating-title"
      aria-busy={isLoading || undefined}
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="panel"
      bg="var(--surface-bg)"
      p={{ base: 3, md: 4 }}
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        gap={3}
      >
        <Box>
          <Heading id="profile-rating-title" as="h2" size="md" color="white">
            Calificar usuario
          </Heading>
          <Text color="var(--text-muted)" fontSize="sm">
            {helperText}
          </Text>
        </Box>

        <Flex align="center" gap={2}>
          <InteractiveRating
            value={profile.ratingAvg ?? 0}
            count={profile.ratingCount ?? 0}
            userRating={userRating}
            disabled={!canRate}
            isLoading={isLoading}
            onRate={onRate}
          />
          {isLoading && <Spinner size="sm" color="accent.500" />}
        </Flex>
      </Flex>
    </Box>
  );
}

function UserActivityStats({ stats }: { stats: UserProfileStats }) {
  const metrics: Array<{ label: string; value: number; Icon: IconType }> = [
    { label: "Publicaciones", value: stats.publications, Icon: FiGrid },
    { label: "Likes", value: stats.likes, Icon: FiHeart },
    { label: "Comentarios", value: stats.comments, Icon: FiMessageCircle },
    { label: "Enviados", value: stats.shares, Icon: FiSend },
    { label: "Guardados", value: stats.saved, Icon: FiBookmark },
  ];

  return (
    <Box
      as="section"
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="panel"
      bg="var(--surface-bg)"
      p={{ base: 3, md: 4 }}
    >
      <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} gap={3}>
        {metrics.map(({ label, value, Icon }) => (
          <Box
            key={label}
            border="1px solid"
            borderColor="var(--card-border)"
            borderRadius="panel"
            p={3}
            minH="6rem"
          >
            <Flex align="center" gap={2} color="var(--text-muted)" mb={2}>
              <Icon aria-hidden="true" />
              <Text fontSize="sm">{label}</Text>
            </Flex>
            <Text color="var(--text-color)" fontSize="2xl" fontWeight="800">
              {formatNumber(value)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default UserProfile;
