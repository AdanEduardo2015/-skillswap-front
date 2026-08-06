import { Input } from "@chakra-ui/react";
import { useRef } from "react";
import AppButton from "./AppButton";
import type { ComponentProps, ReactNode } from "react";

type ButtonProps = ComponentProps<typeof AppButton>;

interface FilePickerProps extends Omit<ButtonProps, "onChange" | "children"> {
  accept?: string;
  label: ReactNode;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
}

export default function FilePicker({
  accept,
  label,
  disabled,
  onFileSelected,
  ...buttonProps
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Input
        type="file"
        accept={accept}
        ref={inputRef}
        display="none"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = "";
        }}
      />
      <AppButton type="button" disabled={disabled} onClick={() => inputRef.current?.click()} {...buttonProps}>
        {label}
      </AppButton>
    </>
  );
}
