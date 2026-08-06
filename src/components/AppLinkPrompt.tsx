import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Box, Button, Text, Dialog } from "@chakra-ui/react";
import { OpenDefaultSettings } from "../utils/OpenDefaultSettingsPlugin";

export interface AppLinkPromptProps {
  title?: string;
  description?: ReactNode;
  instructionHeader?: string;
  instructionStep1?: ReactNode;
  instructionStep2?: ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppLinkPrompt({
  title = "Abrir links automáticamente",
  description = (
    <>
      Permite que los links de <strong>Comunired</strong> abran directamente en la app en vez del navegador.
    </>
  ),
  instructionHeader = 'Al presionar "Activar":',
  instructionStep1 = (
    <>
      1. Toca <strong>Agregar vínculo</strong>
    </>
  ),
  instructionStep2 = (
    <>
      2. Activa <strong>comuni-red.com</strong>
    </>
  ),
  primaryButtonText = "Activar ahora",
  secondaryButtonText = "Ahora no",
  isOpen,
  onClose,
}: AppLinkPromptProps = {}) {
  const [internalShow, setInternalShow] = useState(false);
  const show = isOpen !== undefined ? isOpen : internalShow;

  const hideDialog = () => {
    if (onClose) onClose();
    if (isOpen === undefined) setInternalShow(false);
  };

  useEffect(() => {
    if (isOpen !== undefined) return;

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      const seen = localStorage.getItem("applink_prompt_seen");
      if (seen) return;

      const checkAndShow = async () => {
        try {
          const status = await OpenDefaultSettings.checkAppLinksStatus();
          if (status && status.enabled) {
            localStorage.setItem("applink_prompt_seen", "true");
            return;
          }
        } catch {
          // Native app-link status is best-effort and may be unavailable.
        }
        setInternalShow(true);
      };

      const timer = setTimeout(checkAndShow, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen !== undefined) return;
    const handleShowPrompt = () => setInternalShow(true);
    window.addEventListener("show-app-link-prompt", handleShowPrompt);
    return () => window.removeEventListener("show-app-link-prompt", handleShowPrompt);
  }, [isOpen]);

  const handleOpen = async () => {
    try {
      await OpenDefaultSettings.openAppLinkSettings();
    } catch {
      // Opening Android settings is best-effort.
    }
    if (isOpen === undefined) localStorage.setItem("applink_prompt_seen", "true");
    hideDialog();
  };

  const handleDismiss = () => {
    if (isOpen === undefined) localStorage.setItem("applink_prompt_seen", "true");
    hideDialog();
  };

  return (
    <Dialog.Root open={show} onOpenChange={(e) => !e.open && handleDismiss()} placement="center">
      <Dialog.Backdrop bg="var(--overlay-bg)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="var(--modal-bg)"
          border="1px solid var(--modal-border)"
          boxShadow="var(--modal-shadow)"
          borderRadius="20px"
          p="28px 24px"
          maxW="340px"
          w="100%"
          textAlign="center"
        >
          <Dialog.Body p={0}>
            <Text fontSize="48px" mb={4}>
              🔗
            </Text>

            <Text color="white" fontSize="18px" fontWeight="700" mb={2}>
              {title}
            </Text>

            <Text color="var(--text-muted)" fontSize="14px" lineHeight="1.5" mb={3}>
              {description}
            </Text>

            <Box
              bg="var(--surface-muted)"
              borderRadius="12px"
              p="14px 16px"
              mb={6}
              textAlign="left"
              border="1px solid var(--card-border)"
            >
              <Text
                color="var(--text-subtle)"
                fontSize="12px"
                mb={2}
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                {instructionHeader}
              </Text>
              <Text color="var(--text-muted)" fontSize="13px" mb={1} lineHeight="1.4">
                {instructionStep1}
              </Text>
              <Text color="var(--text-muted)" fontSize="13px" lineHeight="1.4">
                {instructionStep2}
              </Text>
            </Box>

            <Button
              w="100%"
              py={3}
              bg="white"
              color="black"
              borderRadius="12px"
              fontSize="15px"
              fontWeight="700"
              mb={2}
              onClick={handleOpen}
              _hover={{ opacity: 0.9 }}
            >
              {primaryButtonText}
            </Button>

            <Button
              w="100%"
              py={3}
              bg="transparent"
              color="var(--text-muted)"
              borderRadius="12px"
              fontSize="14px"
              onClick={handleDismiss}
              _hover={{ color: "var(--text-color)" }}
            >
              {secondaryButtonText}
            </Button>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
