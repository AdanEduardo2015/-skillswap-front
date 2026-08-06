import { useEffect, useState } from "react";
import { Dialog, Flex, Box, Text, Image, Spinner } from "@chakra-ui/react";
import { api } from "../../services/api";
import { useUserData } from "../../utils/UserStore";
import type { Publication } from "../../types";
import { AppButton } from "../../shared/ui";
import PublicationFormFields from "../../features/publications/PublicationFormFields";
import PublicationMediaPicker from "../../features/publications/PublicationMediaPicker";
import { usePublicationCategories } from "../../features/publications/usePublicationCategories";
import {
  buildPublicationPayload,
  getPublicationFormValues,
  inferPublicationFormat,
  validatePublicationForm,
  type PublicationFormErrors,
  type PublicationFormValues,
} from "../../features/publications/publicationForm";

export interface EditPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Publication;
  onSuccess: (updatedPost: Publication) => void;
}

export default function EditPublicationModal({
  isOpen,
  onClose,
  post,
  onSuccess,
}: EditPublicationModalProps) {
  const { profilePictureUrl, name, email: globalEmail } = useUserData();
  const { categories, isLoadingCategories } = usePublicationCategories();
  const postOwnerName = post.user?.username ?? name ?? "Usuario";
  const postOwnerPic =
    post.user?.profilePicUrl ?? post.user?.profilePicture ?? profilePictureUrl ?? "/Profile.svg";
  const isOwner = post.user?.email === globalEmail;

  const [values, setValues] = useState<PublicationFormValues>(() => getPublicationFormValues(post));
  const [errors, setErrors] = useState<PublicationFormErrors>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSendingForm, setIsSendingForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(getPublicationFormValues(post));
      setErrors({});
    }
  }, [isOpen, post]);

  const updateValues = (nextValues: Partial<PublicationFormValues>) => {
    setValues((current) => ({ ...current, ...nextValues }));
    setErrors((current) => ({
      ...current,
      ...Object.fromEntries(Object.keys(nextValues).map((key) => [key, undefined])),
    }));
  };

  const updateVideo = (url: string | null) => {
    setValues((current) => ({
      ...current,
      videoUrl: url,
      format: inferPublicationFormat(url),
    }));
    setErrors((current) => ({ ...current, media: undefined }));
  };

  const handleUpdatePublication = async () => {
    const validationErrors = validatePublicationForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSendingForm(true);
    try {
      const payload = buildPublicationPayload(values);
      await api.publications.edit(post.id, payload);
      onSuccess({ ...post, ...payload, content: payload.content ?? post.content });
      onClose();
    } catch {
      // API interceptor centralizes the visible error path for now.
    } finally {
      setIsSendingForm(false);
    }
  };

  const isDisabled = isSendingForm || isUploadingMedia;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(event) => !event.open && onClose()}
      placement="center"
      closeOnInteractOutside={!isDisabled}
    >
      <Dialog.Backdrop bg="rgba(0,0,0,0.85)" />
      <Dialog.Positioner>
        <Dialog.Content
          aria-labelledby="edit-publication-title"
          aria-busy={isDisabled || undefined}
          bg="#1f1f1f"
          border="1px solid #333"
          boxShadow="0 20px 60px rgba(0,0,0,0.6)"
          borderRadius="panel"
          p="24px"
          w="95%"
          maxW="680px"
          maxH="90vh"
          overflowY="auto"
        >
          <Dialog.Body p={0}>
            <Box className={`${isDisabled ? "disabled-form" : ""}`} userSelect="none" color="white">
              <Text id="edit-publication-title" fontSize="20px" fontWeight="700" mb={4} textAlign="center">
                {isOwner || !globalEmail ? "Editar publicacion" : `Editar publicacion de ${postOwnerName}`}
              </Text>

              <Flex align="center" my={3} aria-label={`Autor: ${postOwnerName}`}>
                <Image
                  src={postOwnerPic}
                  alt="Foto de perfil"
                  borderRadius="full"
                  mr={2}
                  boxSize="2rem"
                  userSelect="none"
                />
                <Box>
                  <Text color="white" fontWeight="bold" fontSize="sm">
                    {postOwnerName}
                  </Text>
                  <Text color="gray.400" fontSize="xs">
                    Editando contenido educativo
                  </Text>
                </Box>
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

              <Flex w="100%" mt={6} justify="flex-end" gap={3}>
                <AppButton
                  tone="ghost"
                  aria-label="Cancelar edicion de publicacion"
                  onClick={onClose}
                  disabled={isDisabled}
                >
                  Cancelar
                </AppButton>
                <AppButton
                  aria-label={
                    isSendingForm ? "Guardando cambios de publicacion" : "Guardar cambios de publicacion"
                  }
                  onClick={() => void handleUpdatePublication()}
                  disabled={isDisabled}
                  px={6}
                >
                  {!isSendingForm ? "Guardar cambios" : <Spinner size="sm" color="black" />}
                </AppButton>
              </Flex>
            </Box>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
