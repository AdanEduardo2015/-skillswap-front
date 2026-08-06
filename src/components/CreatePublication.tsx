import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Image, Spinner, Text } from "@chakra-ui/react";
import { api } from "../services/api";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import { useUserData } from "../utils/UserStore";
import { usePublicationData } from "../utils/PublicationStore";
import { AppButton } from "../shared/ui";
import { syncAuthenticatedProfile } from "../features/profiles/profileSession";
import PublicationFormFields from "../features/publications/PublicationFormFields";
import PublicationMediaPicker from "../features/publications/PublicationMediaPicker";
import { usePublicationCategories } from "../features/publications/usePublicationCategories";
import {
  buildPublicationPayload,
  inferPublicationFormat,
  validatePublicationForm,
  type PublicationFormErrors,
  type PublicationFormValues,
} from "../features/publications/publicationForm";

function CreatePublication() {
  const navigate = useNavigate();
  const authSession = useAuthSession();
  const { name, profilePictureUrl, role: globalRole } = useUserData();
  const isBannedUser = globalRole === "banned";

  const {
    title,
    setTitle,
    text,
    setText,
    categoryId,
    setCategoryId,
    format,
    setFormat,
    tags,
    setTags,
    video,
    setVideo,
    resetPublication,
  } = usePublicationData();
  const { categories, isLoadingCategories } = usePublicationCategories();
  const [errors, setErrors] = useState<PublicationFormErrors>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (isBannedUser) {
    return (
      <Flex minH="70vh" justify="center" align="center" direction="column" p={6}>
        <Box
          bg="var(--surface-bg)"
          border="1px solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          p={8}
          textAlign="center"
          maxW="500px"
          boxShadow="var(--modal-shadow)"
          color="var(--text-color)"
        >
          <Heading as="h2" size="xl" color="red.500" mb={4}>
            Acceso Restringido
          </Heading>
          <Text fontSize="md">
            Tu cuenta se encuentra suspendida temporalmente y no tienes permisos para crear publicaciones.
          </Text>
        </Box>
      </Flex>
    );
  }

  const values: PublicationFormValues = {
    title: title ?? "",
    content: text ?? "",
    categoryId: categoryId ?? "",
    format,
    tags,
    videoUrl: video,
  };

  const updateValues = (nextValues: Partial<PublicationFormValues>) => {
    if (nextValues.title !== undefined) setTitle(nextValues.title);
    if (nextValues.content !== undefined) setText(nextValues.content);
    if (nextValues.categoryId !== undefined) setCategoryId(nextValues.categoryId || null);
    if (nextValues.format !== undefined) setFormat(nextValues.format);
    if (nextValues.tags !== undefined) setTags(nextValues.tags);
    setErrors((current) => ({
      ...current,
      ...Object.fromEntries(Object.keys(nextValues).map((key) => [key, undefined])),
    }));
  };

  const updateVideo = (url: string | null) => {
    setVideo(url);
    setFormat(inferPublicationFormat(url));
    setErrors((current) => ({ ...current, media: undefined }));
  };

  const validateAndBuildPayload = () => {
    const validationErrors = validatePublicationForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return null;

    return buildPublicationPayload(values);
  };

  const handlePublish = async () => {
    const payload = validateAndBuildPayload();
    if (!payload) return;

    setIsSendingForm(true);
    try {
      const response = await api.publications.create(payload);
      await syncAuthenticatedProfile(response.user, authSession.refresh);
      resetPublication();
      navigate("/my-profile");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrio un error al publicar.";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsSendingForm(false);
    }
  };

  const handlePreview = () => {
    const payload = validateAndBuildPayload();
    if (!payload) return;
    navigate("/preview-publication");
  };

  const isDisabled = isSendingForm || isUploadingMedia;

  return (
    <Box
      as="main"
      aria-labelledby="create-publication-title"
      aria-busy={isDisabled || undefined}
      className={`${isDisabled ? "disabled-form" : ""}`}
      userSelect="none"
    >
      <Flex direction="column" minH="100vh" w={["90%", "75%"]} mx="auto">
        <Heading id="create-publication-title" as="h1" size="4xl" textAlign="center" color="white" mb={4}>
          Nueva publicacion
        </Heading>

        <Flex align="center" my={3} aria-label={`Autor: ${name ?? "Usuario"}`}>
          <Image
            src={profilePictureUrl ?? "/Profile.svg"}
            alt="Foto de perfil"
            borderRadius="full"
            mr={2}
            boxSize="1.5rem"
            userSelect="none"
          />
          <Text color="white">
            {name ?? "Usuario"} &gt;{" "}
            <Text as="span" color="#9aa3af">
              Contenido educativo
            </Text>
          </Text>
        </Flex>

        <PublicationFormFields
          values={values}
          errors={errors}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
          onChange={updateValues}
        />

        <PublicationMediaPicker
          videoUrl={values.videoUrl}
          disabled={isDisabled}
          errorText={errors.media}
          onVideoChange={updateVideo}
          onBusyChange={setIsUploadingMedia}
        />

        <Flex w="100%" mt={5} justify="center" align="center" gap={3}>
          <Box w="50%" textAlign="start">
            <AppButton
              tone="ghost"
              aria-label="Previsualizar publicacion"
              onClick={handlePreview}
              disabled={isDisabled}
            >
              Previsualizar
            </AppButton>
          </Box>
          <Box w="50%" textAlign="end">
            <AppButton
              aria-label={isSendingForm ? "Publicando publicacion" : "Publicar publicacion"}
              onClick={() => void handlePublish()}
              disabled={isDisabled}
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

      {errorMessage && (
        <Box
          position="fixed"
          bottom="90px"
          left="50%"
          transform="translateX(-50%)"
          bg="white"
          color="red.500"
          px={5}
          py={3}
          borderRadius="xl"
          fontWeight="bold"
          fontSize="sm"
          zIndex={9999}
          boxShadow="0 4px 20px rgba(0,0,0,0.4)"
          textAlign="center"
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </Box>
      )}
    </Box>
  );
}

export default CreatePublication;
