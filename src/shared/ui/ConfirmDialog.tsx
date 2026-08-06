import { Flex, Text } from "@chakra-ui/react";
import AppButton from "./AppButton";
import AppModal from "./AppModal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AppModal isOpen={isOpen} title={title} onClose={onCancel}>
      {description && (
        <Text fontSize="15px" lineHeight="1.5" color="var(--text-muted)" mb={6}>
          {description}
        </Text>
      )}
      {children}
      <Flex direction="column" gap={3}>
        <AppButton w="100%" onClick={onConfirm} loading={isLoading}>
          {confirmLabel}
        </AppButton>
        <AppButton tone="ghost" w="100%" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </AppButton>
      </Flex>
    </AppModal>
  );
}
