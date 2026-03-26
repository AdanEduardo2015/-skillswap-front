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
            <Text mb={3}>{post.Contenido}</Text>

            {post.Lat && post.Long && (
                <Box mb={3} w={["100%", "75%"]} mx="auto" onClick={e => e.stopPropagation()}>
                    <LocationPicker
                        latitude={Number(post.Lat)}
                        longitude={Number(post.Long)}
                        readOnly={true}
                    />
                </Box>
            )}

            {post.Url_imagen && (
                <Image
                    src={post.Url_imagen}
                    borderRadius="md"
                    mb={3}
                    w={["100%", "50%"]}
                    display="block"
                    fetchPriority="high"
                    mx="auto"
                    cursor="pointer"
                    onClick={e => { e.stopPropagation(); onImageClick(post.Url_imagen!); }}
                />
            )}

            {post.Url_video && (
                <chakra.video
                    src={post.Url_video}
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
