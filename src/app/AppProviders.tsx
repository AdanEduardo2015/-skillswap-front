import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { system } from "./theme";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
