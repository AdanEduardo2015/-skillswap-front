import { useState, useEffect } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { api } from "../services/api";
import type { Publication } from "../types";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import { SkeletonFeed } from "./Skeletons";
import InfiniteScroll from "react-infinite-scroll-component";

function Home() {
  const [publicaciones, setPublicaciones] = useState<Publication[]>([]);
  const [isLoadingPublications, setIsLoadingPublications] = useState(true);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPublications = async (limit: number, token?: string | null) => {
    try {
      const { items, hasMore: more, nextToken: newNextToken } = await api.publications.list(limit, token);
      setPublicaciones((prev) => (!token ? items : [...prev, ...items]));
      setHasMore(more);
      setNextToken(newNextToken ?? null);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingPublications(false);
    }
  };

  useEffect(() => {
    setIsLoadingPublications(true);
    loadPublications(10);
  }, []);

  const fetchMoreData = () => {
    loadPublications(10, nextToken);
  };

  if (isLoadingPublications)
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Box w={["90%", "75%"]} mx="auto">
          <SkeletonFeed count={3} />
        </Box>
      </Box>
    );

  if (!publicaciones)
    return (
      <Flex minH="100vh" justify="center" align="center">
        <Heading size="4xl" color="white">
          No hay publicación para mostrar
        </Heading>
      </Flex>
    );

  return (
    <Box display="flex" justifyContent="center" py={4}>
      <Box w={["90%", "75%"]} mx="auto">
        <InfiniteScroll
          dataLength={publicaciones.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={
            <Box mt={4}>
              <SkeletonFeed count={1} />
            </Box>
          }
          endMessage={
            <Text color="gray.500" textAlign="center" mt={6} mb={4} fontSize="sm">
              No hay más publicaciones por cargar
            </Text>
          }
          style={{ overflow: "hidden" }}
        >
          {publicaciones.map((post) => (
            <PublicationCard key={post.id} post={post} onImageClick={setImagenSeleccionada} />
          ))}
        </InfiniteScroll>

        <ImageModal image={imagenSeleccionada} onClose={() => setImagenSeleccionada(null)} />
      </Box>
    </Box>
  );
}

export default Home;
