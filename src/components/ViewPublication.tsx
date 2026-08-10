import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSearchParamsGlobal } from "../utils/GlobalVariables";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import PublicationComments from "./PublicationComments";
import { Flex, Box, Heading, Text, Collapsible } from "@chakra-ui/react";
import { SkeletonPublicationCard } from "./Skeletons";
import type { Publication } from "../types";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import { AppButton } from "../shared/ui";
import { FaArrowLeft } from "react-icons/fa";

function ViewPublication() {
  const navigate = useNavigate();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const searchParams = useSearchParamsGlobal();
  const publicationId = searchParams.get("post");
  const focusComment = searchParams.get("focusComment") === "true";
  const [showCommentInput, setShowCommentInput] = useState(focusComment);
  const { user } = useAuthSession();

  const isAuthor = Boolean(
    user &&
    user.email &&
    publication &&
    user.email.toLowerCase() ===
      (publication.authorEmail || publication.creatorEmail || publication.userEmail || "").toLowerCase()
  );

  useEffect(() => {
    if (focusComment) {
      setShowCommentInput(true);
    }
  }, [focusComment]);

  useEffect(() => {
    if (!publicationId) {
      setError("No se proporcionó un ID de publicación.");
      return;
    }

    setIsLoading(true);

    const loadPublication = async () => {
      try {
        const data = await api.publications.get(publicationId);
        setPublication(data);

        const authorEmail = data.authorEmail || data.creatorEmail || data.userEmail || "";
        if (user?.email && authorEmail && user.email.toLowerCase() !== authorEmail.toLowerCase()) {
          try {
            const result = await api.publications.recordView(publicationId);
            if (result.counted && result.viewsCount !== undefined) {
              setPublication((prev) => (prev ? { ...prev, viewsCount: result.viewsCount } : null));
            }
          } catch (err) {
            console.error("Error recording publication view:", err);
          }
        }
      } catch {
        setError("Error al obtener la publicación");
      } finally {
        setIsLoading(false);
      }
    };

    loadPublication();
  }, [publicationId, user?.email]);

  const handleCommentAdded = () => {
    setPublication((prev: Publication | null) => {
      if (!prev) return prev;
      const prevComentarios = prev.comments ?? { total: 0, list: [] };
      return {
        ...prev,
        comments: {
          ...prevComentarios,
          total: prevComentarios.total + 1,
        },
      };
    });
  };

  const handleCommentDeleted = () => {
    setPublication((prev: Publication | null) => {
      if (!prev) return prev;
      const prevComentarios = prev.comments ?? { total: 0, list: [] };
      return {
        ...prev,
        comments: {
          ...prevComentarios,
          total: Math.max(0, prevComentarios.total - 1),
        },
      };
    });
  };

  if (isLoading)
    return (
      <Flex direction="column" w={["90%", "75%"]} mx="auto" minH="100vh" py={4}>
        <SkeletonPublicationCard />
      </Flex>
    );

  if (error)
    return (
      <Flex minH="100vh" justify="center" align="center">
        <Heading color="red.500">{error}</Heading>
      </Flex>
    );
  if (!publication)
    return (
      <Flex minH="100vh" justify="center" align="center">
        <Heading color="white">No hay publicación para mostrar</Heading>
      </Flex>
    );
  if (publication.status === "restricted" && !isAuthor) {
    return (
      <Flex minH="100vh" justify="center" align="center" direction="column" p={6}>
        <Box
          bg="var(--surface-bg)"
          border="1px solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          p={8}
          textAlign="center"
          maxW="500px"
          boxShadow="var(--modal-shadow)"
        >
          <Heading as="h2" size="xl" color="red.500" mb={4}>
            Contenido no disponible
          </Heading>
          <Text color="var(--text-color)" fontSize="md">
            Esta publicación o video ha sido bloqueado/restringido administrativamente por incumplir las
            normas de la comunidad.
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex direction="column" w={["90%", "75%"]} mx="auto" minH="100vh" py={4}>
      <Box mb={4}>
        <AppButton type="button" tone="secondary" onClick={() => navigate("/")}>
          <Flex align="center" gap={2}>
            <FaArrowLeft />
            <Text>Volver al inicio</Text>
          </Flex>
        </AppButton>
      </Box>

      {publication.status === "restricted" && (
        <Box
          bg="var(--surface-bg)"
          border="1px solid var(--card-border)"
          borderRadius="panel"
          p={4}
          mb={4}
          color="var(--text-color)"
        >
          <Heading as="h4" size="md" color="var(--text-color)" mb={1}>
            Publicación Restringida
          </Heading>
          <Text fontSize="sm">
            Tu publicación fue restringida porque incumplió las reglas de la comunidad. Solo tú puedes verla
            en tu perfil.
          </Text>
        </Box>
      )}
      <PublicationCard
        post={publication}
        onImageClick={setImagenSeleccionada}
        onClickComent={() => setShowCommentInput((prev) => !prev)}
      />

      <Collapsible.Root open={showCommentInput}>
        <Collapsible.Content>
          <Box as="hr" borderColor="var(--card-border)" mt={3} mb={0} />
          <Heading as="h6" size="sm" color="var(--text-color)" my={2}>
            Comentarios
          </Heading>
          <Box as="hr" borderColor="var(--card-border)" mb={3} mt={0} />

          <PublicationComments
            publication={publication}
            showInput={showCommentInput}
            setShowInput={setShowCommentInput}
            onImageClick={setImagenSeleccionada}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
          />
        </Collapsible.Content>
      </Collapsible.Root>

      <ImageModal image={imagenSeleccionada} onClose={() => setImagenSeleccionada(null)} />
    </Flex>
  );
}

export default ViewPublication;
