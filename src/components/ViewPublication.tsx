import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
    useSearchParamsGlobal,
} from "../utils/GlobalVariables";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import PublicationComments from "./PublicationComments";
import { Flex, Box, Heading } from "@chakra-ui/react";
import { SkeletonPublicationCard } from "./Skeletons";
import type { Publication } from "../types";

function ViewPublication() {
    const [publication, setPublication] = useState<Publication | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
    const [showCommentInput, setShowCommentInput] = useState(false);

    const searchParams = useSearchParamsGlobal();
    const publicationId = searchParams.get("post");

    useEffect(() => {
        if (!publicationId) {
            setError("No se proporcionó un ID de publicación.");
            return;
        }

        setIsLoading(true);

        const loadPublication = async () => {
            try {
                const data = await api.publications.get(publicationId);
                setPublication(data);
            } catch {
                setError("Error al obtener la publicación");
            } finally {
                setIsLoading(false);
            }
        };

        loadPublication();
    }, [publicationId]);

    const handleCommentAdded = () => {
        setPublication((prev: any) => {
            if (!prev) return prev;
            const prevComentarios = prev.comments ?? { total: 0, list: [] };
            return {
                ...prev,
                comments: {
                    ...prevComentarios,
                    total: prevComentarios.total + 1
                }
            };
        });
    };

    const handleCommentDeleted = () => {
        setPublication((prev: any) => {
            if (!prev) return prev;
            const prevComentarios = prev.comments ?? { total: 0, list: [] };
            return {
                ...prev,
                comments: {
                    ...prevComentarios,
                    total: Math.max(0, prevComentarios.total - 1)
                }
            };
        });
    };

    if (isLoading) return (
        <Flex direction="column" w={["90%", "75%"]} mx="auto" minH="100vh" py={4}>
            <SkeletonPublicationCard />
        </Flex>
    );

    if (error) return <Flex minH="100vh" justify="center" align="center"><Heading color="red.500">{error}</Heading></Flex>;
    if (!publication) return <Flex minH="100vh" justify="center" align="center"><Heading color="white">No hay publicación para mostrar</Heading></Flex>;

    return (
        <Flex direction="column" w={["90%", "75%"]} mx="auto" minH="100vh" py={4}>
            <PublicationCard
                post={publication}
                onImageClick={setImagenSeleccionada}
                onClickComent={() => setShowCommentInput(prev => !prev)}
            />

            <Box as="hr" borderColor="white" mt={3} mb={0} />
            <Heading as="h6" size="sm" color="white" my={2}>Comentarios</Heading>
            <Box as="hr" borderColor="white" mb={3} mt={0} />

            <PublicationComments
                publication={publication}
                showInput={showCommentInput}
                setShowInput={setShowCommentInput}
                onImageClick={setImagenSeleccionada}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
            />

            <ImageModal
                image={imagenSeleccionada}
                onClose={() => setImagenSeleccionada(null)}
            />
        </Flex>
    );
}

export default ViewPublication;
