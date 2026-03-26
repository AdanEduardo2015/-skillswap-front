import { useState, useEffect } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { listPublications } from "../services/api";
import type { Publication } from "../types";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import { SkeletonFeed } from "./Skeletons";
import InfiniteScroll from "react-infinite-scroll-component";

function Home() {
    const [publicaciones, setPublicaciones] = useState<Publication[]>([]);
    const [isLoadingPublications, setIsLoadingPublications] = useState(true);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadPublications = async (pageNumber: number) => {
        try {
            const { publications, hasMore: more } = await listPublications(pageNumber, 10);
            setPublicaciones(prev => pageNumber === 1 ? publications : [...prev, ...publications]);
            setHasMore(more);
        } catch {
            setHasMore(false);
        } finally {
            setIsLoadingPublications(false);
        }
    };

    useEffect(() => {
        setIsLoadingPublications(true);
        loadPublications(1);
    }, []);

    const fetchMoreData = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPublications(nextPage);
    };

    if (isLoadingPublications) return (
        <Box display="flex" justifyContent="center" py={4}>
            <Box w={["90%", "75%"]} mx="auto">
                <SkeletonFeed count={3} />
            </Box>
        </Box>
    );

    if (!publicaciones) return <Flex minH="100vh" justify="center" align="center"><Heading size="4xl" color="white">No hay publicación para mostrar</Heading></Flex>;

    return (
        <Box display="flex" justifyContent="center" py={4}>
            <Box w={["90%", "75%"]} mx="auto">
                <InfiniteScroll
                    dataLength={publicaciones.length}
                    next={fetchMoreData}
                    hasMore={hasMore}
                    loader={<Box mt={4}><SkeletonFeed count={1} /></Box>}
                    endMessage={
                        <Text color="gray.500" textAlign="center" mt={6} mb={4} fontSize="sm">
                            No hay más publicaciones por cargar
                        </Text>
                    }
                    style={{ overflow: 'hidden' }}
                >
                    {publicaciones.map(post => (
                        <PublicationCard
                            key={post.Id_publicacion}
                            post={post}
                            onImageClick={setImagenSeleccionada}
                        />
                    ))}
                </InfiniteScroll>

                <ImageModal
                    image={imagenSeleccionada}
                    onClose={() => setImagenSeleccionada(null)}
                />

            </Box>
        </Box>
    );
}

export default Home;
