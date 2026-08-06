import { Box, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  minH?: string;
}

export default function EmptyState({ title, description, action, minH = "40vh" }: EmptyStateProps) {
  return (
    <Box
      minH={minH}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      color="var(--text-color)"
    >
      <Box maxW="460px" textAlign="center">
        <Heading as="h2" size="2xl" mb={description || action ? 4 : 0}>
          {title}
        </Heading>
        {description && (
          <Text color="var(--text-muted)" mb={action ? 6 : 0}>
            {description}
          </Text>
        )}
        {action}
      </Box>
    </Box>
  );
}
