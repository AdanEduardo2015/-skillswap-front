import { IconButton } from "@chakra-ui/react";
import type { ComponentProps } from "react";
import type { AppButtonTone } from "./AppButton";

type IconButtonProps = ComponentProps<typeof IconButton>;

interface AppIconButtonProps extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  tone?: AppButtonTone;
}

const toneStyles: Record<AppButtonTone, Partial<IconButtonProps>> = {
  primary: {
    bg: "var(--button-bg)",
    color: "var(--button-text)",
    _hover: { bg: "var(--button-hover-bg)" },
  },
  secondary: {
    bg: "brand.500",
    color: "white",
    _hover: { bg: "brand.600" },
  },
  ghost: {
    bg: "transparent",
    color: "var(--text-muted)",
    _hover: { color: "var(--text-color)", bg: "var(--ghost-hover-bg)" },
  },
  danger: {
    bg: "danger.500",
    color: "white",
    _hover: { bg: "danger.700" },
  },
};

export default function AppIconButton({
  label,
  tone = "ghost",
  borderRadius = "control",
  ...props
}: AppIconButtonProps) {
  return <IconButton aria-label={label} borderRadius={borderRadius} {...toneStyles[tone]} {...props} />;
}
