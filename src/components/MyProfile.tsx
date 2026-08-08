import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { useNavigate, useOutletContext } from "react-router-dom";
import { appSignOut } from "../app/auth/session";
import { Box, Flex, Heading, Separator, Text, VStack } from "@chakra-ui/react";
import InfiniteScroll from "react-infinite-scroll-component";
import { api, normalizeRole } from "../services/api";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import { useUserData } from "../utils/UserStore";
import { useNotificationStore } from "../utils/NotificationStore";
import type { AuthContext } from "./layouts/LoggedLayout";
import type { Appeal, Publication, Sanction, UserSummary } from "../types";
import { AppButton } from "../shared/ui";
import ProfileSummaryCard from "../features/profiles/ProfileSummaryCard";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import ConfirmModal from "./modals/ConfirmModal";
import AppealModal from "./modals/AppealModal";
import AppLinkPrompt from "./AppLinkPrompt";
import PushNotificationPrompt from "./PushNotificationPrompt";
import PushErrorPrompt from "./PushErrorPrompt";
import { SkeletonProfileHeader, SkeletonFeed } from "./Skeletons";
import { OpenDefaultSettings } from "../utils/OpenDefaultSettingsPlugin";
import { applyUserSummaryToStore, syncAuthenticatedProfile } from "../features/profiles/profileSession";

export default function MyProfile() {
  const navigate = useNavigate();
  const authContext = useOutletContext<AuthContext>();
  const authSession = useAuthSession();
  const {
    name,
    email,
    profilePictureUrl,
    setName,
    setEmail,
    setProfilePictureUrl,
    resetUser,
    activeSanctions: globalActiveSanctions,
  } = useUserData();

  const [posts, setPosts] = useState<Publication[]>([]);
  const [profile, setProfile] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [action, setAction] = useState<"logout" | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isBannedUser, setIsBannedUser] = useState(false);
  const [isBecomingCreator, setIsBecomingCreator] = useState(false);
  const [appLinksEnabled, setAppLinksEnabled] = useState(true);
  const { pushEnabled, setPushEnabled, pushRegistrationError, setPushRegistrationError } =
    useNotificationStore();

  const [isNative, setIsNative] = useState(false);
  const [showTurnOffLinks, setShowTurnOffLinks] = useState(false);
  const [showTurnOffPush, setShowTurnOffPush] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedSanctionToAppeal, setSelectedSanctionToAppeal] = useState<Sanction | null>(null);

  const loadAppeals = useCallback(async () => {
    try {
      const userAppeals = await api.appeals.listMine();
      setAppeals(userAppeals);
    } catch {
      // Ignore if fail
    }
  }, []);

  const applyUserProfile = useCallback((userProfile: UserSummary) => {
    setProfile(userProfile);
    setIsBannedUser(Boolean(userProfile.isBanned || userProfile.role === "banned"));
    applyUserSummaryToStore(userProfile);
  }, []);

  const loadPublications = useCallback(
    async (token: string | null = null, mounted = true) => {
      try {
        if (!authContext.email) return;

        const response = await api.publications.listByUser(authContext.email, 10, token);
        if (!mounted) return;

        if (response.userProfile) {
          applyUserProfile(response.userProfile);
        }

        setPosts((current) => (token === null ? response.items : [...current, ...response.items]));
        setHasMore(response.hasMore);
        setNextToken(response.nextToken ?? null);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("403")) {
          if (mounted) setIsBannedUser(true);
        } else if (message.includes("401")) {
          navigate("/login");
        }
        setHasMore(false);
      } finally {
        if (mounted && token === null) setIsLoading(false);
      }
    },
    [applyUserProfile, authContext.email, navigate]
  );

  const fetchMoreData = () => {
    void loadPublications(nextToken, true);
  };

  useEffect(() => {
    let mounted = true;
    let appStateListener: { remove: () => void } | null = null;

    setName(authContext.name);
    setEmail(authContext.email);
    setProfilePictureUrl(authContext.picture);

    if (authContext.email) {
      setProfile({
        email: authContext.email,
        username: authContext.name ?? "Usuario",
        profilePicUrl: authContext.picture,
        profilePicture: authContext.picture,
        role: normalizeRole(authContext.role),
      });
      void loadPublications(null, mounted);
      void loadAppeals();
    }

    const loadNativeState = async () => {
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

      setIsNative(true);

      const checkAppLinks = async () => {
        try {
          const status = await OpenDefaultSettings.checkAppLinksStatus();
          if (mounted) setAppLinksEnabled(status.enabled ?? true);
        } catch {
          if (mounted) setAppLinksEnabled(true);
        }
      };

      const checkPushStatus = async () => {
        try {
          const status = await PushNotifications.checkPermissions();
          if (mounted) setPushEnabled(status.receive === "granted");
        } catch {
          // Native permission APIs can be unavailable in unsupported shells.
        }
      };

      await checkAppLinks();
      appStateListener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void checkAppLinks();
      });
      await checkPushStatus();
    };
    void loadNativeState();

    return () => {
      mounted = false;
      appStateListener?.remove();
    };
  }, [
    authContext.email,
    authContext.name,
    authContext.picture,
    authContext.role,
    authSession.isAuthenticated,
    loadPublications,
    setEmail,
    setName,
    setProfilePictureUrl,
    setPushEnabled,
  ]);

  const handleConfirm = async () => {
    setIsLoadingAction(true);
    try {
      if (action === "logout") {
        await appSignOut();
        resetUser();
        await authSession.refresh({ forceRefresh: true });
        navigate("/login");
      }
    } finally {
      setIsLoadingAction(false);
      setAction(null);
    }
  };

  const handleBecomeCreator = async () => {
    setIsBecomingCreator(true);
    try {
      const userProfile = await api.users.becomeCreator();
      applyUserProfile(userProfile);
      await syncAuthenticatedProfile(userProfile, authSession.refresh);
    } catch {
      // Handled globally
    } finally {
      setIsBecomingCreator(false);
    }
  };

  if (isLoading) return <SkeletonProfileHeader isMyProfile={true} />;

  const currentProfile: UserSummary = profile ?? {
    email: email ?? authContext.email ?? "",
    username: name ?? authContext.name ?? "Usuario",
    profilePicUrl: profilePictureUrl ?? authContext.picture ?? null,
    profilePicture: profilePictureUrl ?? authContext.picture ?? null,
    role: normalizeRole(authContext.role),
  };
  const canBecomeCreator = !isBannedUser && currentProfile.role === "consumer";

  const displayActiveSanctions = currentProfile.activeSanctions || globalActiveSanctions || [];

  return (
    <Flex justify="center" minH="100vh">
      <VStack w={["90%", "75%"]} maxW="container.md" gap={4} align="stretch">
        {displayActiveSanctions && displayActiveSanctions.length > 0 && (
          <VStack align="stretch" gap={3} w="100%">
            {displayActiveSanctions.map((sanction: Sanction) => {
              const existingAppeal = appeals.find((a) => a.sanctionId === sanction.id);

              let sanctionTitle = "🚫 Sanción de Cuenta";
              let borderColor = "#ef4444";
              let bgColor = "var(--surface-muted)";
              let titleColor = "red.400";

              if (sanction.type === "warning") {
                sanctionTitle = "⚠️ Advertencia de Cuenta";
                borderColor = "#f59e0b";
                bgColor = "var(--surface-muted)";
                titleColor = "yellow.400";
              } else if (sanction.type === "temporary_ban") {
                sanctionTitle = "🚫 Baneo Temporal";
              } else if (sanction.type === "permanent_ban") {
                sanctionTitle = "💀 Baneo Permanente";
                bgColor = "var(--surface-muted)";
                titleColor = "red.500";
              } else if (sanction.type === "content_restriction") {
                sanctionTitle = "Restricción de Contenido";
              }

              return (
                <Box
                  key={sanction.id}
                  bg={bgColor}
                  border={`1px solid ${borderColor}`}
                  borderRadius="panel"
                  p={4}
                  color="var(--text-color)"
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={1}>
                    <Heading as="h4" size="md" color={titleColor}>
                      {sanctionTitle}
                    </Heading>
                    {existingAppeal && (
                      <Box
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                        bg={
                          existingAppeal.status === "pending"
                            ? "blue.600"
                            : existingAppeal.status === "in_review"
                            ? "yellow.600"
                            : existingAppeal.status === "accepted"
                            ? "green.600"
                            : "red.700"
                        }
                        color="white"
                      >
                        {existingAppeal.status === "pending" && "Apelación enviada (Pendiente)"}
                        {existingAppeal.status === "in_review" && "Apelación en revisión"}
                        {existingAppeal.status === "accepted" && "Apelación aceptada"}
                        {existingAppeal.status === "rejected" && "Apelación rechazada"}
                      </Box>
                    )}
                  </Flex>

                  <Text fontSize="sm" mb={2}>
                    Motivo: <strong>{sanction.reason || sanction.description || "No especificado"}</strong>.
                  </Text>

                  {sanction.endsAt && sanction.type === "temporary_ban" && (
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Tu cuenta volverá a estar activa el:{" "}
                      {new Date(sanction.endsAt).toLocaleString("es-MX", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </Text>
                  )}

                  {/* Status of appeal if already sent */}
                  {existingAppeal && (
                    <Box
                      bg="var(--surface-muted)"
                      borderRadius="control"
                      p={3}
                      mt={2}
                      mb={2}
                      borderLeft="3px solid"
                      borderColor={
                        existingAppeal.status === "pending"
                          ? "#3b82f6"
                          : existingAppeal.status === "in_review"
                          ? "#eab308"
                          : existingAppeal.status === "accepted"
                          ? "#22c55e"
                          : "#ef4444"
                      }
                    >
                      <Text fontSize="xs" fontWeight="bold" color="var(--text-muted)" mb={1}>
                        Detalles de tu apelación:
                      </Text>
                      {existingAppeal.status === "pending" && (
                        <Text fontSize="sm">
                          Tu apelación ha sido enviada y está pendiente de revisión por un administrador.
                        </Text>
                      )}
                      {existingAppeal.status === "in_review" && (
                        <Text fontSize="sm">
                          {existingAppeal.adminNote ||
                            "Un administrador está revisando tu apelación o ha solicitado información adicional."}
                        </Text>
                      )}
                      {existingAppeal.status === "rejected" && (
                        <Text fontSize="sm">
                          <strong>Motivo de la decisión:</strong>{" "}
                          {existingAppeal.decisionReason || "El administrador determinó mantener la sanción."}
                        </Text>
                      )}
                      {existingAppeal.status === "accepted" && (
                        <Text fontSize="sm">
                          Tu apelación fue aceptada y la restricción ha sido levantada.
                        </Text>
                      )}
                    </Box>
                  )}

                  {/* Button to appeal if no pending appeal exists */}
                  {(!existingAppeal || existingAppeal.status === "rejected") && (
                    <Flex justify="flex-end" mt={2}>
                      <AppButton
                        type="button"
                        tone="primary"
                        onClick={() => setSelectedSanctionToAppeal(sanction)}
                      >
                        Apelar decisión
                      </AppButton>
                    </Flex>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}

        <ProfileSummaryCard
          heading="Tu perfil"
          profile={currentProfile}
          onImageClick={setSelectedImage}
          actions={
            canBecomeCreator && (
              <AppButton
                type="button"
                w="fit-content"
                disabled={isBecomingCreator}
                onClick={() => void handleBecomeCreator()}
              >
                {isBecomingCreator ? "Activando..." : "Activar modo creador"}
              </AppButton>
            )
          }
        />

        {isNative && (
          <Box
            as="section"
            border="1px solid"
            borderColor="var(--card-border)"
            borderRadius="panel"
            p={4}
            bg="var(--surface-bg)"
          >
            <Heading as="h2" size="md" color="white" mb={3}>
              Ajustes de la aplicación
            </Heading>
            <Text color="white" fontWeight="bold">
              Abrir enlaces en la app
            </Text>
            <Text color="white" mb={3}>
              {appLinksEnabled ? "Activado" : "Desactivado"}
            </Text>
            {appLinksEnabled ? (
              <AppButton mb={2} onClick={() => setShowTurnOffLinks(true)} w="fit-content">
                Desactivar App Links
              </AppButton>
            ) : (
              <AppButton
                mb={2}
                onClick={() => window.dispatchEvent(new Event("show-app-link-prompt"))}
                w="fit-content"
              >
                Configurar App Links
              </AppButton>
            )}

            <AppLinkPrompt
              isOpen={showTurnOffLinks}
              onClose={() => setShowTurnOffLinks(false)}
              title="Desactivar App Links"
              description={
                <>
                  Evita que los links de <strong>Comunired</strong> abran automaticamente en la app.
                </>
              }
              instructionHeader='Al presionar "Desactivar":'
              instructionStep1={
                <>
                  1. Toca <strong>Agregar vinculo</strong>
                </>
              }
              instructionStep2={
                <>
                  2. Apaga <strong>comuni-red.com</strong>
                </>
              }
              primaryButtonText="Desactivar ahora"
              secondaryButtonText="Cancelar"
            />

            <Text color="white" fontWeight="bold" mt={4}>
              Notificaciones
            </Text>
            <Text color="white" mb={3}>
              {pushEnabled ? "Activadas" : "Desactivadas"}
            </Text>
            {pushEnabled ? (
              <AppButton mb={2} onClick={() => setShowTurnOffPush(true)} w="fit-content">
                Desactivar notificaciones
              </AppButton>
            ) : (
              <AppButton
                mb={2}
                onClick={() => window.dispatchEvent(new Event("show-push-prompt"))}
                w="fit-content"
              >
                Configurar notificaciones
              </AppButton>
            )}

            <PushNotificationPrompt
              isOpen={showTurnOffPush}
              onClose={() => setShowTurnOffPush(false)}
              title="Desactivar notificaciones"
              description={
                <>
                  Dejaras de recibir alertas en tiempo real sobre tu actividad en <strong>Comunired</strong>.
                </>
              }
              instructionHeader="Como desactivarlas:"
              instructionStep1={
                <>
                  1. Ve a <strong>Ajustes del telefono</strong> {">"} Apps {">"} Comunired
                </>
              }
              instructionStep2={
                <>
                  2. Apaga el permiso de <strong>Notificaciones</strong>
                </>
              }
              primaryButtonText="Entendido"
              secondaryButtonText="Volver"
            />

            <PushErrorPrompt isOpen={pushRegistrationError} onClose={() => setPushRegistrationError(false)} />
          </Box>
        )}

        <Separator borderColor="var(--card-border)" my={2} />

        <Flex py={2} align="center" justify="space-around" wrap="wrap" gap={4}>
          {!isBannedUser && (
            <AppButton
              w={["100%", "30%"]}
              onClick={() => navigate("/edit-profile", { state: { profile: currentProfile } })}
            >
              Editar mi perfil
            </AppButton>
          )}
          <AppButton w={["100%", "30%"]} onClick={() => setAction("logout")}>
            Cerrar sesion
          </AppButton>
        </Flex>

        <Separator borderColor="var(--card-border)" mt={2} mb={4} />

        <Heading as="h3" size="lg" color="white" mb={5} textAlign="center">
          Tus publicaciones
        </Heading>
        {posts.length === 0 ? (
          <Text color="white" textAlign="center">
            No tienes publicaciones aun
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
                  await loadPublications(null, true);
                  await loadAppeals();
                }}
              />
            ))}
          </InfiniteScroll>
        )}

        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      </VStack>

      <ConfirmModal
        isOpen={action !== null}
        title="Estas seguro de que deseas cerrar sesion?"
        isLoading={isLoadingAction}
        onConfirm={handleConfirm}
        onCancel={() => setAction(null)}
      />

      <AppealModal
        isOpen={selectedSanctionToAppeal !== null}
        sanction={selectedSanctionToAppeal}
        onClose={() => setSelectedSanctionToAppeal(null)}
        onSuccess={(newAppeal) => {
          setAppeals((prev) => [newAppeal, ...prev.filter((a) => a.sanctionId !== newAppeal.sanctionId)]);
        }}
      />
    </Flex>
  );
}
