import { Flex, Spinner, Text } from "@chakra-ui/react";

interface LoadingStateProps {
  label?: string;
  minH?: string;
}

export default function LoadingState({ label, minH = "50vh" }: LoadingStateProps) {
  return (
    <Flex direction="column" minH={minH} align="center" justify="center" color="var(--text-color)" gap={4}>
      <Spinner color="var(--text-color)" />
      {label && <Text color="var(--text-muted)">{label}</Text>}
    </Flex>
  );
}
