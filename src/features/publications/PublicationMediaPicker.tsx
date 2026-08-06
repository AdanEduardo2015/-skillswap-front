import { useEffect, useRef, useState } from "react";
import { Box, Flex, Input, Text, chakra } from "@chakra-ui/react";
import { FaTimes, FaVideo } from "react-icons/fa";
import { AppButton, AppIconButton } from "../../shared/ui";
import { uploadFile } from "../../utils/UploadUtils";
import { validateVideoDuration, validateVideoFile } from "./publicationForm";

interface PublicationMediaPickerProps {
  videoUrl: string | null;
  disabled?: boolean;
  errorText?: string;
  onVideoChange: (url: string | null) => void;
  onBusyChange?: (isBusy: boolean) => void;
}

export default function PublicationMediaPicker({
  videoUrl,
  disabled = false,
  errorText,
  onVideoChange,
  onBusyChange,
}: PublicationMediaPickerProps) {
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [videoError, setVideoError] = useState("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const errorId = videoError || errorText ? "publication-video-error" : undefined;

  useEffect(() => {
    onBusyChange?.(isUploadingVideo);
  }, [isUploadingVideo, onBusyChange]);

  const handleVideoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateVideoFile(file) ?? (await validateVideoDuration(file));
    if (validationError) {
      setVideoError(validationError);
      return;
    }

    setVideoError("");
    setIsUploadingVideo(true);

    try {
      const fileUrl = await uploadFile(file, "publications");
      onVideoChange(fileUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error subiendo video. Intenta de nuevo.";
      setVideoError(message);
      onVideoChange(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  return (
    <Box
      mb={5}
      as="section"
      aria-labelledby="publication-video-heading"
      aria-busy={isUploadingVideo || undefined}
    >
      <Text id="publication-video-heading" color={errorText ? "red.500" : "inherit"} mb={2}>
        Video de la publicacion
      </Text>

      <Flex gap={3} wrap="wrap" mb={3}>
        <AppButton
          type="button"
          tone="ghost"
          disabled={disabled || isUploadingVideo}
          aria-describedby={errorId}
          onClick={() => videoInputRef.current?.click()}
        >
          <Flex align="center" gap={2}>
            <FaVideo /> Seleccionar video
          </Flex>
        </AppButton>
      </Flex>

      <Input
        id="publication-video-input"
        type="file"
        accept="video/mp4"
        ref={videoInputRef}
        onChange={handleVideoSelected}
        display="none"
        aria-label="Seleccionar video MP4 para la publicacion"
        aria-invalid={Boolean(errorId) || undefined}
        aria-describedby={errorId}
      />

      {(videoError || errorText) && (
        <Box id={errorId} mb={3} role="alert" aria-live="assertive">
          {errorText && (
            <Text color="red.500" fontSize="sm">
              {errorText}
            </Text>
          )}
          {videoError && (
            <Text color="red.500" fontSize="sm">
              {videoError}
            </Text>
          )}
        </Box>
      )}

      {isUploadingVideo && (
        <Text color="white" fontSize="sm" mb={3} role="status" aria-live="polite">
          Subiendo video...
        </Text>
      )}

      {videoUrl && (
        <Box pos="relative" w={{ base: "100%", md: "75%" }} mx="auto" mt={4}>
          <chakra.video
            src={videoUrl}
            controls
            preload="metadata"
            crossOrigin="anonymous"
            borderRadius="panel"
            w="100%"
            maxH="18rem"
            bg="black"
            display="block"
            aria-label="Vista previa del video seleccionado"
            onClick={(event) => event.stopPropagation()}
          />
          <AppIconButton
            label="Quitar video"
            tone="danger"
            size="sm"
            pos="absolute"
            top={2}
            right={2}
            onClick={() => onVideoChange(null)}
          >
            <FaTimes />
          </AppIconButton>
        </Box>
      )}
    </Box>
  );
}
