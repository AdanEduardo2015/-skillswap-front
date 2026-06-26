import { Box, Image, Text, chakra } from "@chakra-ui/react";
import LocationPicker from "../LocationPicker";
import type { Publication } from "../../types";

interface PublicationContentProps {
    post: Publication;
    onImageClick: (src: string) => void;
}

export default function PublicationContent({ post, onImageClick }: PublicationContentProps) {
    return (
        <>
            <Text mb={3}>{post.content}</Text>

            {post.lat && post.long && (
                <Box mb={3} w={["100%", "75%"]} mx="auto" onClick={e => e.stopPropagation()}>
                    <LocationPicker
                        latitude={Number(post.lat)}
                        longitude={Number(post.long)}
                        readOnly={true}
                    />
                </Box>
            )}

            {post.imageUrl && (
                <Image
                    src={post.imageUrl}
                    borderRadius="md"
                    mb={3}
                    w={["100%", "50%"]}
                    display="block"
                    fetchPriority="high"
                    mx="auto"
                    cursor="pointer"
                    onClick={e => { e.stopPropagation(); onImageClick(post.imageUrl!); }}
                />
            )}

            {post.videoUrl && (
                <chakra.video
                    src={post.videoUrl}
                    borderRadius="md"
                    mb={3}
                    w={["100%", "75%"]}
                    display="block"
                    mx="auto"
                    controls
                    preload="auto"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
            )}
        </>
    );
}
