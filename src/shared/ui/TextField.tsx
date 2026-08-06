import { Box, Input, Text, chakra } from "@chakra-ui/react";
import { useId } from "react";
import type { ComponentProps, ReactNode, Ref } from "react";

type BoxProps = ComponentProps<typeof Box>;
type InputProps = ComponentProps<typeof Input>;

interface TextFieldProps extends Omit<InputProps, "children"> {
  label?: string;
  helperText?: string;
  errorText?: string;
  isInvalid?: boolean | null;
  rightElement?: ReactNode;
  containerProps?: BoxProps;
  inputRef?: Ref<HTMLInputElement>;
}

export default function TextField({
  label,
  helperText,
  errorText,
  isInvalid,
  rightElement,
  containerProps,
  inputRef,
  borderRadius = "control",
  bg = "var(--input-bg)",
  color = "var(--input-text)",
  border = "solid 0.05rem",
  borderColor,
  _placeholder = { color: "var(--input-placeholder)" },
  _focus = { border: "solid 0.05rem var(--input-focus-border)", boxShadow: "none", outline: "none" },
  ...inputProps
}: TextFieldProps) {
  const hasError = Boolean(errorText || isInvalid);
  const generatedId = useId();
  const inputId = inputProps.id ?? generatedId;
  const messageId = errorText || helperText ? `${inputId}-message` : undefined;
  const describedBy = [inputProps["aria-describedby"], messageId].filter(Boolean).join(" ") || undefined;
  const safeInputProps =
    "value" in inputProps ? { ...inputProps, value: inputProps.value ?? "" } : inputProps;

  return (
    <Box w="100%" mb={4} {...containerProps}>
      {label && (
        <chakra.label htmlFor={inputId} color={hasError ? "red.500" : "inherit"} mb={2} display="block">
          {label}
        </chakra.label>
      )}

      <Box position="relative">
        <Input
          ref={inputRef}
          bg={bg}
          color={color}
          border={border}
          borderColor={hasError ? "red.500" : (borderColor ?? "var(--input-border)")}
          borderRadius={borderRadius}
          _placeholder={_placeholder}
          _focus={_focus}
          pr={rightElement ? "3.5rem" : undefined}
          {...safeInputProps}
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
        />

        {rightElement && (
          <Box position="absolute" right="1rem" top="50%" transform="translateY(-50%)">
            {rightElement}
          </Box>
        )}
      </Box>

      {(errorText || helperText) && (
        <Text id={messageId} color={hasError ? "red.500" : "var(--text-muted)"} fontSize="sm" mt={2}>
          {errorText ?? helperText}
        </Text>
      )}
    </Box>
  );
}
