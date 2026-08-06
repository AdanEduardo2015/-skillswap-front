import { Badge } from "@chakra-ui/react";
import type { ComponentProps } from "react";
import type { UserRole } from "../../types";

type BadgeProps = ComponentProps<typeof Badge>;

interface RoleBadgeProps extends Omit<BadgeProps, "children"> {
  role: UserRole;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  creator: "Creador",
  consumer: "Usuario",
  guest: "Invitado",
  banned: "Baneado",
};

const rolePalette: Record<UserRole, BadgeProps["colorPalette"]> = {
  admin: "purple",
  creator: "blue",
  consumer: "green",
  guest: "gray",
  banned: "red",
};

export default function RoleBadge({ role, ...props }: RoleBadgeProps) {
  return (
    <Badge borderRadius="panel" colorPalette={rolePalette[role]} px={2} py={1} {...props}>
      {roleLabels[role]}
    </Badge>
  );
}
