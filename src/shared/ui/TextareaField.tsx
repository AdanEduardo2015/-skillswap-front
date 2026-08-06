import { Box, Text, Textarea, chakra } from "@chakra-ui/react";
import { useId } from "react";
import type { ComponentProps } from "react";

type BoxProps = ComponentProps<typeof Box>;
type TextareaProps = ComponentProps<typeof Textarea>;

interface TextareaFieldProps extends Omit<TextareaProps, "children"> {
  label?: string;
  helperText?: string;
  errorText?: string;
  isInvalid?: boolean | null;
  containerProps?: BoxProps;
}

export default function TextareaField({
  label,
  helperText,
  errorText,
  isInvalid,
  containerProps,
  borderRadius = "control",
  bg = "var(--input-bg)",
  color = "var(--input-text)",
  border = "solid 0.05rem",
  borderColor,
  _placeholder = { color: "var(--input-placeholder)" },
  _focus = { border: "solid 0.05rem var(--input-focus-border)", boxShadow: "none", outline: "none" },
  ...textareaProps
}: TextareaFieldProps) {
  const hasError = Boolean(errorText || isInvalid);
  const generatedId = useId();
  const textareaId = textareaProps.id ?? generatedId;
  const messageId = errorText || helperText ? `${textareaId}-message` : undefined;
  const describedBy = [textareaProps["aria-describedby"], messageId].filter(Boolean).join(" ") || undefined;
  const safeTextareaProps =
    "value" in textareaProps ? { ...textareaProps, value: textareaProps.value ?? "" } : textareaProps;

  return (
    <Box w="100%" mb={4} {...containerProps}>
      {label && (
        <chakra.label htmlFor={textareaId} color={hasError ? "red.500" : "inherit"} mb={2} display="block">
          {label}
        </chakra.label>
      )}
      <Textarea
        bg={bg}
        color={color}
        border={border}
        borderColor={hasError ? "red.500" : (borderColor ?? "var(--input-border)")}
        borderRadius={borderRadius}
        _placeholder={_placeholder}
        _focus={_focus}
        {...safeTextareaProps}
        id={textareaId}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
      />
      {(errorText || helperText) && (
        <Text id={messageId} color={hasError ? "red.500" : "var(--text-muted)"} fontSize="sm" mt={2}>
          {errorText ?? helperText}
        </Text>
      )}
    </Box>
  );
}
