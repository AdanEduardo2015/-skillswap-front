import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParamsGlobal } from "../utils/GlobalVariables";
import { useUserData } from "../utils/UserStore";
import { api } from "../services/api";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import { Box, Flex, Heading, Text, Image, VStack, Button } from "@chakra-ui/react";
import ConfirmModal from "./modals/ConfirmModal";
import { SkeletonProfileHeader, SkeletonFeed } from "./Skeletons";
import InfiniteScroll from "react-infinite-scroll-component";
import type { Publication } from "../types";

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    admin: "El patrón",
    banned: "Baneado",
    moderators: "Moderador",
    users: "Usuario",
  };
  return roles[role] || role;
};

function UserProfile() {
  const navigate = useNavigate();
  const searchParams = useSearchParamsGlobal();
  const { email: globalEmail, role: globalRole } = useUserData();
  const userEmail = searchParams.get("user");

  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [accion, setAccion] = useState<"make_moderator" | "remove_moderator" | "ban" | "unban" | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);

  const [posts, setPosts] = useState<Publication[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [userProfile, setUserProfile] = useState({
    pic: "",
    name: "",
    role: "users",
  });

  const [status, setStatus] = useState({
    loading: false,
    notFound: false,
  });

  useEffect(() => {
    if (userEmail === globalEmail) {
      navigate("/my-profile");
    }
  }, [userEmail, globalEmail, navigate]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const loadUserFeed = useCallback(async (token: string | null = null, isInitial: boolean = false) => {
    if (!userEmail) return;
    if (isInitial) setStatus({ loading: true, notFound: false });

    try {
      const res = await api.publications.listByUser(userEmail, 10, token);

      if (res.userProfile) {
        setUserProfile({
          pic: res.userProfile.profilePicUrl || "",
          name: res.userProfile.username || "Usuario",
          role: res.userProfile.role || "users",
        });
      }

      setPosts((prev) => (isInitial ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setNextToken(res.nextToken ?? null);
    } catch (err: any) {
      if (err.message === "Usuario no encontrado" || err.message?.includes("404")) {
        if (isInitial) setStatus((prev) => ({ ...prev, notFound: true }));
      }
      setHasMore(false);
    } finally {
      if (isInitial) setStatus((prev) => ({ ...prev, loading: false }));
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) loadUserFeed(null, true);
  }, [userEmail, loadUserFeed]);

  const fetchMoreData = () => {
    loadUserFeed(nextToken);
  };

  const handleConfirmAction = async () => {
    if (!userEmail || !accion) return;
    setIsLoadingAction(true);
    try {
      const actionMap: Record<string, (email: string) => Promise<any>> = {
        make_moderator: api.admin.makeModerator,
        remove_moderator: api.admin.removeModerator,
        ban: api.admin.banUser,
        unban: api.admin.unbanUser,
      };

      const mensajeExito: Record<string, string> = {
        make_moderator: "✅ El usuario ahora es moderador",
        remove_moderator: "✅ Se eliminaron los privilegios de moderador",
        ban: "✅ El usuario ha sido baneado",
        unban: "✅ El usuario ha sido desbaneado",
      };

      await actionMap[accion](userEmail);
      showToast(mensajeExito[accion]);

      setUserProfile((prev) => {
        let newRole = prev.role;
        if (accion === "make_moderator") newRole = "moderators";
        else if (accion === "remove_moderator") newRole = "users";
        else if (accion === "ban") newRole = "banned";
        else if (accion === "unban") newRole = "users";
        
        return { ...prev, role: newRole };
      });
    } catch {
      showToast(({
        make_moderator: "❌ Hubo un problema al hacer moderador al usuario",
        remove_moderator: "❌ Hubo un problema al eliminar privilegios",
        ban: "❌ Hubo un problema al banear al usuario",
        unban: "❌ Hubo un problema al desbanear al usuario",
      })[accion] || "❌ Error desconocido");
    } finally {
      setIsLoadingAction(false);
      setAccion(null);
    }
  };

  const profileImage = userProfile.pic || "/Profile.svg";
  const isPrivileged = globalRole === "admin" || globalRole === "moderators";

  if (status.notFound) {
    return <Heading textAlign="center" color="red.500" fontWeight="bold" fontSize="6xl" mt={5}>¡USUARIO NO ENCONTRADO!</Heading>;
  }

  if (status.loading) return <SkeletonProfileHeader isMyProfile={false} />;

  return (
    <Flex justify="center" minH="100vh">
      <VStack w={["90%", "75%"]} minH="100dvh" maxW="container.md" align="stretch" gap={4}>
        <Box textAlign="center">
          <Heading as="h1" size="4xl" color="white" mb={4}>Perfil de {userProfile.name}</Heading>
          <Image
            mb={4}
            mx="auto"
            borderRadius="full"
            cursor="pointer"
            src={profileImage}
            alt="Profile Image"
            onClick={() => setImagenSeleccionada(profileImage)}
            boxSize={["8rem", "9rem", "10rem", "11rem"]}
            objectFit="cover"
          />
        </Box>

        <Text color="white" fontWeight="bold">Nombre de usuario:</Text>
        <Text color="white" mb={5}>{userProfile.name}</Text>
        <Text color="white" fontWeight="bold">Correo Electrónico:</Text>
        <Text color="white" mb={5}>{userEmail}</Text>

        {isPrivileged && (
          <>
            <Text color="white" fontWeight="bold">Rol:</Text>
            <Text color="white" mb={5}>{formatRole(userProfile.role)}</Text>
            {userProfile.role !== "admin" && (
              <Flex py={2} align="center" justify="space-around" wrap="wrap" gap={4} mb={5}>
                {globalRole === "admin" && userProfile.role === "users" && (
                  <Button bg="white" color="black" _hover={{ bg: "gray.200" }} w={["100%", "30%"]} borderRadius="1rem" onClick={() => setAccion("make_moderator")}>
                    Hacer Moderador
                  </Button>
                )}
                {globalRole === "admin" && userProfile.role === "moderators" && (
                  <Button bg="white" color="black" _hover={{ bg: "gray.200" }} w={["100%", "30%"]} borderRadius="1rem" onClick={() => setAccion("remove_moderator")}>
                    Eliminar privilegios
                  </Button>
                )}
                {userProfile.role === "banned" ? (
                  <Button bg="white" color="black" _hover={{ bg: "gray.200" }} w={["100%", "30%"]} borderRadius="1rem" onClick={() => setAccion("unban")}>
                    Desbanear
                  </Button>
                ) : (
                  <Button bg="white" color="black" _hover={{ bg: "gray.200" }} w={["100%", "30%"]} borderRadius="1rem" onClick={() => setAccion("ban")}>
                    Banear
                  </Button>
                )}
                <Button bg="white" color="black" _hover={{ bg: "gray.200" }} w={["100%", "30%"]} borderRadius="1rem" onClick={() => navigate(`/edit-profile?user=${userEmail}`, { state: { userName: userProfile.name, userPic: userProfile.pic } })}>
                  Editar Perfil
                </Button>
              </Flex>
            )}
          </>
        )}

        <Box as="hr" borderColor="white" my={4} />

        <Heading as="h3" size="lg" color="white" mb={5} textAlign="center">Publicaciones de {userProfile.name}</Heading>
        {posts.length === 0 ? (
          <Text color="white" textAlign="center">{userProfile.name} no tiene publicaciones</Text>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={fetchMoreData}
            hasMore={hasMore}
            loader={<Box mt={4}><SkeletonFeed count={1} /></Box>}
            endMessage={<Text color="gray.500" textAlign="center" mt={6} mb={4} fontSize="sm">No hay más publicaciones por cargar</Text>}
            style={{ overflow: "hidden" }}
          >
            {posts.map((post) => (
              <PublicationCard key={post.id} post={post} onImageClick={setImagenSeleccionada} />
            ))}
          </InfiniteScroll>
        )}

        <ImageModal image={imagenSeleccionada} onClose={() => setImagenSeleccionada(null)} />
      </VStack>

      <ConfirmModal
        isOpen={accion !== null}
        title={
          accion === "make_moderator" ? "¿Estás seguro de que deseas hacer moderador a este usuario?" :
            accion === "remove_moderator" ? "¿Estás seguro de que deseas eliminar los privilegios de moderador?" :
              accion === "unban" ? "¿Estás seguro de que deseas desbanear a este usuario?" :
                "¿Estás seguro de que deseas banear a este usuario?"
        }
        isLoading={isLoadingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => setAccion(null)}
      />

      {toastMessage && (
        <Box position="fixed" bottom="90px" left="50%" transform="translateX(-50%)" bg="white" color="black" px={5} py={3} borderRadius="xl" fontWeight="bold" fontSize="sm" zIndex={9999} boxShadow="0 4px 20px rgba(0,0,0,0.4)">
          {toastMessage}
        </Box>
      )}
    </Flex>
  );
}

export default UserProfile;
