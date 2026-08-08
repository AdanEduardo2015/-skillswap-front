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
    bg: "#000000",
    color: "#ffffff",
    border: "1px solid #ffffff",
    _hover: { bg: "#ffffff", color: "#000000", borderColor: "#000000" },
  },
  ghost: {
    bg: "transparent",
    color: "var(--text-color)",
    border: "1px solid transparent",
    _hover: { borderColor: "var(--text-color)" },
  },
  danger: {
    bg: "#000000",
    color: "#ffffff",
    border: "2px dashed #ffffff",
    _hover: { bg: "#ffffff", color: "#000000", borderStyle: "solid", borderColor: "#000000" },
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
