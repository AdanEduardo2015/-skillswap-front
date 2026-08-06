import { Badge, Box, Flex, Heading, Image, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { UserSummary } from "../../types";
import { RatingStars, RoleBadge } from "../../shared/ui";

interface ProfileSummaryCardProps {
  profile: UserSummary;
  heading?: ReactNode;
  onImageClick?: (src: string) => void;
  actions?: ReactNode;
}

export default function ProfileSummaryCard({
  profile,
  heading,
  onImageClick,
  actions,
}: ProfileSummaryCardProps) {
  const profileImage = profile.profilePicUrl ?? profile.profilePicture ?? "/Profile.svg";
  const isCreator = profile.role === "creator";
  const hasRating = isCreator || Boolean(profile.ratingCount);

  return (
    <Box
      as="section"
      border="1px solid"
      borderColor="var(--card-border)"
      borderRadius="panel"
      bg="var(--surface-bg)"
      p={{ base: 4, md: 5 }}
    >
      <Flex direction={{ base: "column", md: "row" }} gap={5} align={{ base: "center", md: "flex-start" }}>
        <Image
          borderRadius="full"
          cursor={onImageClick ? "pointer" : "default"}
          src={profileImage}
          alt={`Foto de perfil de ${profile.username}`}
          onClick={() => onImageClick?.(profileImage)}
          boxSize={{ base: "8rem", md: "10rem" }}
          objectFit="cover"
          flexShrink={0}
        />

        <VStack align={{ base: "center", md: "stretch" }} gap={3} flex="1" w="100%">
          <Box textAlign={{ base: "center", md: "left" }}>
            {heading && (
              <Heading as="h1" size="2xl" color="white" mb={2}>
                {heading}
              </Heading>
            )}
            <Heading as={heading ? "h2" : "h1"} size="xl" color="white">
              {profile.username}
            </Heading>
            <Text color="muted.300" wordBreak="break-word">
              {profile.email}
            </Text>
          </Box>

          <Flex wrap="wrap" gap={2} justify={{ base: "center", md: "flex-start" }}>
            <RoleBadge role={profile.role} />
            {profile.isVerified && (
              <Badge borderRadius="panel" colorPalette="green" px={2} py={1}>
                Verificado
              </Badge>
            )}
            {(profile.isBanned || profile.role === "banned") && (
              <Badge borderRadius="panel" colorPalette="red" px={2} py={1}>
                Cuenta restringida
              </Badge>
            )}
          </Flex>

          <Text color="white" whiteSpace="pre-wrap">
            {profile.bio?.trim() || "Sin biografia registrada."}
          </Text>

          {hasRating && (
            <Box
              maxW="sm"
              border="1px solid"
              borderColor="var(--card-border)"
              borderRadius="panel"
              p={3}
              w="100%"
            >
              <Text color="muted.300" fontSize="sm">
                Valoracion
              </Text>
              <Flex align="center" gap={2} wrap="wrap">
                <RatingStars value={profile.ratingAvg ?? 0} size={14} />
                <Text color="white" fontWeight="700">
                  {(profile.ratingAvg ?? 0).toFixed(1)} ({profile.ratingCount ?? 0})
                </Text>
              </Flex>
            </Box>
          )}

          {isCreator && (
            <ProfileList
              label="Area de especialidad"
              values={profile.specialty ? [profile.specialty] : []}
              emptyText="Sin especialidad registrada."
            />
          )}

          {actions}
        </VStack>
      </Flex>
    </Box>
  );
}

function ProfileList({ label, values, emptyText }: { label: string; values: string[]; emptyText: string }) {
  return (
    <Box w="100%">
      <Text color="muted.300" fontSize="sm" mb={2}>
        {label}
      </Text>
      {values.length > 0 ? (
        <Flex gap={2} wrap="wrap">
          {values.map((value) => (
            <Badge key={value} borderRadius="panel" colorPalette="blue" px={2} py={1}>
              {value}
            </Badge>
          ))}
        </Flex>
      ) : (
        <Text color="white">{emptyText}</Text>
      )}
    </Box>
  );
}
