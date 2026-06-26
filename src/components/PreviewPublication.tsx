import { useState } from "react";
import { usePublicationData } from "../utils/PublicationStore";
import { api } from "../services/api";
import PublicationCard from "./PublicationCard";
import ImageModal from "./modals/ImageModal";
import { useUserData } from "../utils/UserStore";
import { useNavigate } from "react-router-dom";
import { Flex, Box, Button, Spinner, Text } from "@chakra-ui/react";

function PreviewPublication() {
    const navigate = useNavigate();
    const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
    const { text, image, video, latitude, longitude, resetPublication } = usePublicationData();
    const { email: userEmail, name: userName, profilePictureUrl } = useUserData();
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

    const handleValidatePublicationPublicate = async () => {
        if (!text?.trim()) return;

        setIsSendingForm(true);

        try {
            await api.publications.create({
                content: text,
                imageUrl: image,
                videoUrl: video,
                lat: latitude,
                long: longitude
            });
            resetPublication();
            navigate("/my-profile");
        } catch {
            // Error is handled by api interceptor/service
        } finally {
            setIsSendingForm(false);
        }
    };

    return (
        <Box minH="100vh" className={isSendingForm ? "disabled-form" : ""} userSelect="none">
            <Flex direction="column" w={["90%", "75%"]} minH="70vh" mx="auto" className="home-container">
                <PublicationCard
                    key={0}
                    isPreview={true}
                    post={{
                        id: '0',
                        user: {
                            email: userEmail ?? '',
                            username: userName ?? '',
                            profilePicUrl: profilePictureUrl ?? '',
                            role: 'user'
                        },
                        createdAt: new Date().toISOString().split("T")[0],
                        content: text ?? '',
                        imageUrl: image,
                        videoUrl: video,
                        lat: latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null,
                        long: longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null,
                        likesCount: 0,
                        sharesCount: 0,
                        isLiked: false,
                        comments: { total: 0, list: [] }
                    }}
                    onImageClick={setImagenSeleccionada}
                />

                <ImageModal
                    image={imagenSeleccionada}
                    onClose={() => setImagenSeleccionada(null)}
                />

                <Flex w="100%" mt="auto" justify="center" align="center">
                    <Box w="50%" textAlign="start">
                        <Button
                            bg="white"
                            color="black"
                            _hover={{ bg: "gray.200" }}
                            onClick={() => navigate("/create-publication")}
                            borderRadius="1rem"
                        >
                            Regresar
                        </Button>
                    </Box>
                    <Box w="50%" textAlign="end">
                        <Button
                            bg="white"
                            color="black"
                            _hover={{ bg: "gray.200" }}
                            onClick={handleValidatePublicationPublicate}
                            borderRadius="1rem"
                        >
                            {!isSendingForm ? "Publicar" : (
                                <Flex justify="center" align="center">
                                    <Text mr={3}>Publicando...</Text>
                                    <Spinner size="sm" color="black" />
                                </Flex>
                            )}
                        </Button>
                    </Box>
                </Flex>
            </Flex>
        </Box>
    );
}

export default PreviewPublication;
