import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { api } from "../services/api";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import PublicationCard from "./PublicationCard";
import { usePublicationData } from "../utils/PublicationStore";
import { useUserData } from "../utils/UserStore";
import { AppButton } from "../shared/ui";
import { syncAuthenticatedProfile } from "../features/profiles/profileSession";
import {
  buildPublicationPayload,
  validatePublicationForm,
  type PublicationFormValues,
} from "../features/publications/publicationForm";

function PreviewPublication() {
  const navigate = useNavigate();
  const authSession = useAuthSession();
  const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
  const { title, text, categoryId, format, tags, video, resetPublication } = usePublicationData();
  const { email: userEmail, name: userName, profilePictureUrl } = useUserData();

  const values: PublicationFormValues = {
    title: title ?? "",
    content: text ?? "",
    categoryId: categoryId ?? "",
    format,
    tags,
    videoUrl: video,
  };

  const handleValidatePublicationPublicate = async () => {
    const validationErrors = validatePublicationForm(values);
    if (Object.keys(validationErrors).length > 0) {
      navigate("/create-publication");
      return;
    }

    setIsSendingForm(true);

    try {
      const response = await api.publications.create(buildPublicationPayload(values));
      await syncAuthenticatedProfile(response.user, authSession.refresh);
      resetPublication();
      navigate("/my-profile");
    } catch {
      // Error is handled by api interceptor/service
    } finally {
      setIsSendingForm(false);
    }
  };

  return (
    <Box
      as="main"
      minH="100vh"
      aria-label="Previsualizacion de publicacion"
      aria-busy={isSendingForm || undefined}
      className={isSendingForm ? "disabled-form" : ""}
      userSelect="none"
    >
      <Flex direction="column" w={["90%", "75%"]} minH="70vh" mx="auto" className="home-container">
        <PublicationCard
          key={0}
          isPreview={true}
          post={{
            id: "0",
            title: values.title,
            categoryId: values.categoryId,
            format: values.format,
            tags: values.tags,
            user: {
              email: userEmail ?? "",
              username: userName ?? "",
              profilePicUrl: profilePictureUrl ?? "",
              role: "creator",
            },
            createdAt: new Date().toISOString(),
            content: values.content,
            videoUrl: values.videoUrl,
            likesCount: 0,
            dislikesCount: 0,
            sharesCount: 0,
            savedCount: 0,
            ratingAvg: 0,
            ratingCount: 0,
            isLiked: false,
            isDisliked: false,
            comments: { total: 0, list: [] },
          }}
          onImageClick={() => undefined}
        />

        <Flex w="100%" mt="auto" justify="center" align="center" gap={3}>
          <Box w="50%" textAlign="start">
            <AppButton
              tone="ghost"
              aria-label="Regresar a editar publicacion"
              onClick={() => navigate("/create-publication")}
            >
              Regresar
            </AppButton>
          </Box>
          <Box w="50%" textAlign="end">
            <AppButton
              aria-label={isSendingForm ? "Publicando publicacion" : "Publicar publicacion"}
              onClick={() => void handleValidatePublicationPublicate()}
            >
              {!isSendingForm ? (
                "Publicar"
              ) : (
                <Flex justify="center" align="center">
                  <Text mr={3}>Publicando...</Text>
                  <Spinner size="sm" color="black" />
                </Flex>
              )}
            </AppButton>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}

export default PreviewPublication;
