import { Flex } from "@chakra-ui/react";
import type { UserRole, UserSummary } from "../../types";
import { AppButton } from "../../shared/ui";

export type ProfileAdminAction = "ban" | "unban";

interface ProfileAdminActionsProps {
  viewerRole: UserRole | null;
  profile: UserSummary;
  onAction: (action: ProfileAdminAction) => void;
  onEdit: () => void;
}

export default function ProfileAdminActions({
  viewerRole,
  profile,
  onAction,
  onEdit,
}: ProfileAdminActionsProps) {
  if (viewerRole !== "admin" || profile.role === "admin") return null;

  const isBanned = profile.role === "banned" || profile.isBanned;

  return (
    <Flex py={2} align="center" justify="flex-start" wrap="wrap" gap={3}>
      {isBanned ? (
        <AppButton tone="primary" w={{ base: "100%", md: "auto" }} onClick={() => onAction("unban")}>
          Reactivar cuenta
        </AppButton>
      ) : (
        <AppButton tone="danger" w={{ base: "100%", md: "auto" }} onClick={() => onAction("ban")}>
          Restringir cuenta
        </AppButton>
      )}
      <AppButton tone="primary" w={{ base: "100%", md: "auto" }} onClick={onEdit}>
        Editar perfil
      </AppButton>
    </Flex>
  );
}
