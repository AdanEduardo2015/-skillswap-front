import { Button } from "@chakra-ui/react";
import type { ComponentProps, ReactNode } from "react";

type ButtonProps = ComponentProps<typeof Button>;

export type AppButtonTone = "primary" | "secondary" | "ghost" | "danger";

interface AppButtonProps extends ButtonProps {
  tone?: AppButtonTone;
  children: ReactNode;
}

const toneStyles: Record<AppButtonTone, Partial<ButtonProps>> = {
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

export default function AppButton({
  tone = "primary",
  children,
  borderRadius = "control",
  fontWeight = "700",
  minH = "touch",
  ...props
}: AppButtonProps) {
  return (
    <Button borderRadius={borderRadius} fontWeight={fontWeight} minH={minH} {...toneStyles[tone]} {...props}>
      {children}
    </Button>
  );
}
