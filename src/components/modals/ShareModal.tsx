import { useState, useEffect } from "react";
import { Box, Flex, Text, Heading, chakra, Image, Dialog } from "@chakra-ui/react";
import { FaTimes, FaLink, FaUser } from "react-icons/fa";
import type { Publication } from "../../types";
import { AppButton } from "../../shared/ui";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Publication;
  onShare: () => Promise<void> | void;
  onShowToast?: (message: string) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  post,
  onShare,
  onShowToast,
}: ShareModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/publication?post=${post.id}`
    : `/publication?post=${post.id}`;

  useEffect(() => {
    if (!isOpen) return;
    setIsSubmitting(false);
  }, [isOpen]);

  const notifyToast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
  };

  const handleCopyLink = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Fallback
    }
    notifyToast("✅ Enlace copiado al portapapeles");
    try {
      await onShare();
    } catch {
      // Keep copy feedback active even if server count fails
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const creatorName = post.user?.username || post.authorUsername || post.creatorEmail || post.userEmail || "Creador";
  const creatorAvatar = post.user?.profilePicUrl || post.user?.profilePicture || post.authorProfilePicture || undefined;
  const postSnippet = post.content || post.title || "Publicación";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="center" size="md">
      <Dialog.Backdrop bg="var(--overlay-bg)" style={{ backdropFilter: "blur(4px)" }} />
      <Dialog.Positioner px={3}>
        <Dialog.Content
          bg="var(--modal-bg)"
          border="1px solid var(--modal-border)"
          boxShadow="var(--modal-shadow)"
          borderRadius="2xl"
          p={0}
          color="var(--text-color)"
          maxW="480px"
          w="100%"
          overflow="hidden"
        >
          {/* Header */}
          <Flex align="center" justify="space-between" px={5} py={4} borderBottom="1px solid var(--card-border)">
            <Box w="32px" />
            <Heading size="md" fontWeight="700" textAlign="center" color="var(--text-color)">
              Compartir
            </Heading>
            <chakra.button
              type="button"
              onClick={onClose}
              w="32px"
              h="32px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="var(--card-border)"
              color="var(--text-color)"
              _hover={{ opacity: 0.8 }}
              aria-label="Cerrar"
              cursor="pointer"
            >
              <FaTimes size={16} />
            </chakra.button>
          </Flex>

          {/* Modal Body */}
          <Box p={5}>
            {/* Original Post Preview Card */}
            <Box
              border="1px solid var(--card-border)"
              borderRadius="xl"
              p={3}
              bg="var(--input-bg)"
              mb={5}
            >
              <Flex align="center" gap={2} mb={2}>
                <Box
                  w="28px"
                  h="28px"
                  borderRadius="full"
                  overflow="hidden"
                  bg="var(--card-border)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {creatorAvatar ? (
                    <Image src={creatorAvatar} alt={creatorName} w="100%" h="100%" objectFit="cover" />
                  ) : (
                    <FaUser size={14} color="var(--text-muted)" />
                  )}
                </Box>
                <Text fontWeight="600" fontSize="xs" color="var(--text-color)">
                  {creatorName}
                </Text>
              </Flex>
              {post.title && (
                <Text fontSize="sm" fontWeight="700" color="var(--text-color)" mb={1}>
                  {post.title}
                </Text>
              )}
              <Text fontSize="sm" color="var(--text-color)" fontWeight="400" lineClamp={2} mb={2}>
                {postSnippet}
              </Text>
              {post.videoUrl ? (
                <Box mt={2} borderRadius="lg" overflow="hidden" maxH="180px" bg="black">
                  <chakra.video
                    src={post.videoUrl}
                    controls
                    preload="metadata"
                    crossOrigin="anonymous"
                    w="100%"
                    maxH="180px"
                    borderRadius="lg"
                    objectFit="contain"
                  />
                </Box>
              ) : post.imageUrl ? (
                <Box mt={2} borderRadius="lg" overflow="hidden" maxH="180px">
                  <Image src={post.imageUrl} alt="Publicación" w="100%" maxH="180px" objectFit="cover" />
                </Box>
              ) : null}
            </Box>

            {/* Copiar enlace Main Button */}
            <AppButton
              tone="primary"
              w="100%"
              py={3.5}
              fontSize="md"
              fontWeight="700"
              borderRadius="xl"
              disabled={isSubmitting}
              onClick={() => void handleCopyLink()}
            >
              <Flex align="center" justify="center" gap={2}>
                <FaLink size={18} />
                <Text>Copiar enlace</Text>
              </Flex>
            </AppButton>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
