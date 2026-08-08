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
    border: "1px solid var(--button-bg)",
    _hover: { bg: "var(--button-text)", color: "var(--button-bg)", borderColor: "var(--button-bg)" },
  },
  secondary: {
    bg: "var(--button-text)",
    color: "var(--button-bg)",
    border: "1px solid var(--button-bg)",
    _hover: { bg: "var(--button-bg)", color: "var(--button-text)" },
  },
  ghost: {
    bg: "transparent",
    color: "var(--text-color)",
    border: "1px solid transparent",
    _hover: { borderColor: "var(--text-color)" },
  },
  danger: {
    bg: "var(--button-text)",
    color: "var(--button-bg)",
    border: "2px dashed var(--button-bg)",
    _hover: { bg: "var(--button-bg)", color: "var(--button-text)", borderStyle: "solid" },
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
