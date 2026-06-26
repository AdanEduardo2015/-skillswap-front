import { useState } from "react";
import { api } from "../services/api";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import { Box, Flex, Heading, Input, Button } from "@chakra-ui/react";
import { SkeletonFeed } from "./Skeletons";
import type { Publication } from "../types";

function Search() {
    const [text, setText] = useState("");
    const [resultados, setResultados] = useState<Publication[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

    const loadSearch = async () => {
        const lowered = text.toLowerCase().trim();
        if (!lowered) return;

        setHasSearched(true);
        setIsLoading(true);

        try {
            const res = await api.search.list(lowered);
            setResultados(res.items);
        } catch {
            setResultados([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        loadSearch();
    };

    return (
        <Box minH="100vh">
            <Heading as="h1" size="4xl" color="white" mb={4} textAlign="center">Buscador</Heading>

            <form
                style={{ width: "100%" }}
                onSubmit={e => {
                    e.preventDefault();
                    handleSearch();
                }}
            >
                <Flex w={["90%", "75%"]} mx="auto" justify="space-around" align="center" mb={5}>
                    <Flex w="100%" justify="space-between" align="center">
                        <Box w="75%">
                            <Input
                                type="text"
                                bg="#454545"
                                color="white"
                                _placeholder={{ color: "gray.400" }}
                                borderRadius="1rem"
                                borderColor="white"
                                _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                                w="100%"
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />
                        </Box>
                        <Box w="25%" textAlign="center">
                            <Button
                                type="submit"
                                bg="white"
                                color="black"
                                w="75%"
                                _hover={{ bg: "gray.200" }}
                                borderRadius="1rem"
                            >
                                Buscar
                            </Button>
                        </Box>
                    </Flex>
                </Flex>
            </form>

            <Box w={["90%", "75%"]} mx="auto" mt={4}>
                {isLoading ? (
                    <SkeletonFeed count={3} />
                ) : (
                    <>
                        {resultados.map(post => (
                            <PublicationCard
                                key={post.id}
                                post={post}
                                onImageClick={setImagenSeleccionada}
                            />
                        ))}

                        {hasSearched && resultados.length === 0 && (
                            <Heading as="h1" color="white" textAlign="center" mt={5}>
                                No se encontraron publicaciones.
                            </Heading>
                        )}
                    </>
                )}
            </Box>

            <ImageModal
                image={imagenSeleccionada}
                onClose={() => setImagenSeleccionada(null)}
            />
        </Box>
    );
}

export default Search;
