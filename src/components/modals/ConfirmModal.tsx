import ConfirmDialog from "../../shared/ui/ConfirmDialog";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  isLoading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      description={description}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {children}
    </ConfirmDialog>
  );
}
