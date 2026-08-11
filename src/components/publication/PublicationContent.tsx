import { Badge, Flex, Heading, Text, chakra } from "@chakra-ui/react";
import type { MouseEvent, SyntheticEvent } from "react";
import type { Publication } from "../../types";
import { CategoryBadge } from "../../shared/ui";
import { PUBLICATION_FORMAT_LABELS } from "../../features/publications/publicationForm";

interface PublicationContentProps {
  post: Publication;
  titleId?: string;
  onVideoPlay?: () => void;
}

export default function PublicationContent({ post, titleId, onVideoPlay }: PublicationContentProps) {
  const categoryLabel = post.categoryName ?? post.categoryId;
  const showMetrics = Boolean(post.savedCount || post.viewsCount);

  return (
    <>
      {post.title && (
        <Heading id={titleId} as="h2" size="lg" mb={2} color="var(--text-color)">
          {post.title}
        </Heading>
      )}

      {(categoryLabel || post.format || (post.tags && post.tags.length > 0)) && (
        <Flex gap={2} wrap="wrap" mb={3} align="center">
          {categoryLabel && <CategoryBadge label={categoryLabel} />}
          {post.format && (
            <Badge borderRadius="panel" colorPalette="blue" px={2} py={1}>
              {PUBLICATION_FORMAT_LABELS[post.format]}
            </Badge>
          )}
          {post.status === "restricted" && (
            <Badge borderRadius="panel" colorPalette="red" px={2} py={1}>
              Restringida
            </Badge>
          )}
          {post.tags?.map((tag) => (
            <Badge
              key={tag}
              borderRadius="panel"
              px={2}
              py={1}
              color="var(--text-color)"
              bg="var(--surface-muted)"
              border="1px solid var(--card-border)"
            >
              #{tag}
            </Badge>
          ))}
        </Flex>
      )}

      <Text mb={3}>{post.content}</Text>

      {showMetrics && (
        <Flex gap={4} wrap="wrap" mb={3} align="center" color="var(--text-muted)" fontSize="sm">
          {post.savedCount !== undefined && post.savedCount > 0 && <Text>{post.savedCount} guardados</Text>}
          {post.viewsCount !== undefined && post.viewsCount > 0 && <Text>{post.viewsCount} vistas</Text>}
        </Flex>
      )}

      {post.videoUrl && (
        <chakra.video
          src={post.videoUrl}
          borderRadius="md"
          mb={3}
          w="100%"
          maxW="600px"
          maxH={{ base: "300px", md: "450px" }}
          objectFit="contain"
          bg="black"
          display="block"
          mx="auto"
          controls
          preload="metadata"
          crossOrigin="anonymous"
          aria-label={post.title ? `Video de ${post.title}` : "Video de la publicacion"}
          onClick={(event: MouseEvent<HTMLVideoElement>) => event.stopPropagation()}
          onPlay={(event: SyntheticEvent<HTMLVideoElement>) => {
            event.stopPropagation();
            onVideoPlay?.();
          }}
        />
      )}
    </>
  );
}
