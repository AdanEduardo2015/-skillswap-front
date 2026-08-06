import { Badge } from "@chakra-ui/react";
import type { ComponentProps } from "react";

type BadgeProps = ComponentProps<typeof Badge>;

interface CategoryBadgeProps extends Omit<BadgeProps, "children"> {
  label: string;
}

export default function CategoryBadge({ label, ...props }: CategoryBadgeProps) {
  return (
    <Badge borderRadius="panel" colorPalette="teal" px={2} py={1} {...props}>
      {label}
    </Badge>
  );
}
