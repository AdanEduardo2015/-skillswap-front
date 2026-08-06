import { Box, Flex, Heading, HStack, SimpleGrid, VStack } from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";

function SkeletonBlock({ className, ...props }: BoxProps) {
  return (
    <Box aria-hidden="true" className={["app-skeleton", className].filter(Boolean).join(" ")} {...props} />
  );
}

function SkeletonCircle({ size, ...props }: BoxProps & { size: BoxProps["boxSize"] }) {
  return <SkeletonBlock boxSize={size} borderRadius="full" flex="0 0 auto" {...props} />;
}

function SkeletonLine({ ...props }: BoxProps) {
  return <SkeletonBlock h="0.75rem" borderRadius="999px" {...props} />;
}

function SkeletonActionRow() {
  return (
    <HStack justify="space-between" gap={3} pt={1}>
      {["4.25rem", "5rem", "4.5rem", "5.25rem"].map((width) => (
        <SkeletonBlock key={width} h="2rem" w={width} maxW="24%" borderRadius="999px" />
      ))}
    </HStack>
  );
}

export function SkeletonPublicationCard() {
  return (
    <Box py={3} w="100%">
      <VStack align="stretch" gap={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <HStack gap={3} minW={0} flex="1">
            <SkeletonCircle size="2rem" />
            <VStack align="stretch" gap={2} minW={0} flex="1">
              <SkeletonLine w={{ base: "9rem", md: "11rem" }} maxW="70%" />
              <SkeletonLine w="6.5rem" h="0.55rem" opacity={0.7} />
            </VStack>
          </HStack>
          <SkeletonLine w={{ base: "4.5rem", md: "5.75rem" }} h="0.65rem" />
        </Flex>

        <VStack align="stretch" gap={2}>
          <SkeletonLine w="92%" />
          <SkeletonLine w="78%" />
          <SkeletonLine w="58%" />
        </VStack>

        <SkeletonBlock
          h={{ base: "12rem", sm: "15rem", md: "17rem" }}
          w="100%"
          maxW={{ base: "100%", md: "34rem" }}
          mx="auto"
          borderRadius="8px"
        />

        <SkeletonActionRow />
      </VStack>

      <Box as="hr" borderColor="var(--card-border)" m={0} mt={3} />
    </Box>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <VStack w="100%" align="stretch" gap={0}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPublicationCard key={index} />
      ))}
    </VStack>
  );
}

function SkeletonProfileSummary({ isMyProfile }: { isMyProfile: boolean }) {
  return (
    <Box
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="8px"
      bg="var(--surface-bg)"
      p={{ base: 4, md: 5 }}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "center", md: "flex-start" }}
        justify="space-between"
        gap={{ base: 4, md: 6 }}
      >
        <VStack align={{ base: "center", md: "flex-start" }} gap={3} flex="1" minW={0}>
          {isMyProfile ? (
            <Heading as="h1" size="2xl" color="var(--text-color)">
              Tu perfil
            </Heading>
          ) : (
            <SkeletonBlock h="2rem" w={{ base: "13rem", md: "18rem" }} borderRadius="8px" />
          )}

          <SkeletonCircle size={{ base: "7.5rem", md: "9rem" }} />
        </VStack>

        <VStack align="stretch" gap={3} flex="1.5" w="100%">
          <SkeletonLine w="60%" h="1rem" />
          <SkeletonLine w="42%" />
          <SkeletonLine w="85%" />
          <SkeletonLine w="72%" />

          <HStack gap={2} pt={2} wrap="wrap">
            <SkeletonBlock h="2.25rem" w="7.5rem" borderRadius="999px" />
            <SkeletonBlock h="2.25rem" w="6rem" borderRadius="999px" />
          </HStack>
        </VStack>
      </Flex>
    </Box>
  );
}

function SkeletonStatsPanel() {
  return (
    <Box
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="8px"
      bg="var(--surface-bg)"
      p={{ base: 3, md: 4 }}
    >
      <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} gap={3}>
        {Array.from({ length: 5 }).map((_, index) => (
          <VStack key={index} align="center" gap={2} minH="5.25rem" justify="center">
            <SkeletonCircle size="1.75rem" />
            <SkeletonLine w="3.25rem" h="0.9rem" />
            <SkeletonLine w="4.75rem" h="0.6rem" />
          </VStack>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function SkeletonSettingsPanel() {
  return (
    <Box border="1px solid" borderColor="var(--card-border)" borderRadius="8px" bg="var(--surface-bg)" p={4}>
      <VStack align="stretch" gap={3}>
        <SkeletonBlock h="1.35rem" w="7.5rem" borderRadius="8px" />
        <SkeletonLine w="12rem" />
        <SkeletonLine w="6rem" />
        <SkeletonBlock h="2.5rem" w="9rem" borderRadius="999px" />
      </VStack>
    </Box>
  );
}

export function SkeletonProfileHeader({ isMyProfile = false }: { isMyProfile?: boolean }) {
  return (
    <Flex justify="center" minH="100vh" w="100%" py={{ base: 3, md: 4 }}>
      <VStack w={{ base: "90%", md: "75%" }} maxW="container.md" gap={4} align="stretch">
        <SkeletonProfileSummary isMyProfile={isMyProfile} />

        {isMyProfile ? <SkeletonSettingsPanel /> : <SkeletonStatsPanel />}

        <Box as="hr" borderColor="var(--card-border)" my={2} />

        <Flex justify="center" mb={2}>
          <SkeletonBlock h="1.75rem" w={{ base: "11rem", md: "15rem" }} borderRadius="8px" />
        </Flex>

        <SkeletonFeed count={2} />
      </VStack>
    </Flex>
  );
}

export function SkeletonNotification() {
  return (
    <Flex
      align="center"
      p={3}
      w="100%"
      justify="space-between"
      bg="var(--surface-muted)"
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="8px"
      gap={3}
    >
      <HStack align="center" gap={3} minW={0} flex="1">
        <SkeletonCircle size="2rem" />
        <VStack align="stretch" gap={2} flex="1" minW={0}>
          <SkeletonLine w="82%" />
          <SkeletonLine w="48%" h="0.55rem" opacity={0.7} />
        </VStack>
      </HStack>
      <SkeletonCircle size="1.25rem" />
    </Flex>
  );
}
