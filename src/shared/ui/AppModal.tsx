import { Dialog } from "@chakra-ui/react";
import type { ComponentProps, ReactNode } from "react";

type DialogRootProps = ComponentProps<typeof Dialog.Root>;

interface AppModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogRootProps["size"];
  onClose: () => void;
}

export default function AppModal({ isOpen, title, children, footer, size = "sm", onClose }: AppModalProps) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(event) => !event.open && onClose()}
      size={size}
      placement="center"
    >
      <Dialog.Backdrop bg="var(--overlay-bg)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="var(--modal-bg)"
          border="1px solid var(--modal-border)"
          boxShadow="var(--modal-shadow)"
          borderRadius="panel"
          p={6}
          color="var(--text-color)"
          textAlign="center"
        >
          {title && (
            <Dialog.Header
              color="var(--text-color)"
              fontWeight="700"
              textAlign="center"
              fontSize="2xl"
              p={0}
              mb={3}
            >
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
          )}
          <Dialog.Body p={0}>{children}</Dialog.Body>
          {footer && (
            <Dialog.Footer p={0} mt={6}>
              {footer}
            </Dialog.Footer>
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
