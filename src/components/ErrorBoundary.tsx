import React, { Component, type ReactNode } from "react";
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          w="100vw"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="var(--app-bg)"
          color="white"
          p={4}
        >
          <VStack gap={4} maxW="lg" textAlign="center">
            <Heading as="h1" size="xl" color="red.400">
              Algo salió mal
            </Heading>
            <Text color="gray.300">
              Ocurrió un error inesperado al renderizar esta pantalla. Por favor, recarga la página.
            </Text>
            <Button
              mt={4}
              bg="var(--button-bg)"
              color="var(--button-text)"
              _hover={{ bg: "var(--button-hover-bg)" }}
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}
