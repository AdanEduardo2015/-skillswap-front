import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUserData } from "../utils/UserStore";
import { usePublicationData } from "../utils/PublicationStore";
import { uploadFile } from "../utils/UploadUtils";
import LocationPicker from "./LocationPicker";
import ConfirmModal from "./modals/ConfirmModal";
import { Flex, Box, Heading, Text, Textarea, Image, Button, Spinner, Input } from "@chakra-ui/react";

function CreatePublication() {
    const navigate = useNavigate();
    const { name, profilePictureUrl } = useUserData();
    const {
        text, setText,
        image, setImage,
        video, setVideo,
        latitude, setLatitude,
        longitude, setLongitude,
        resetPublication
    } = usePublicationData();
    const [textMessage, setTextMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputVideoRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [isValidText, setIsValidText] = useState<boolean | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);
    const [imageError, setImageError] = useState("");
    const [videoError, setVideoError] = useState("");
    const [isValidImage, setIsValidImage] = useState<boolean | null>(null);
    const [isValidVideo, setIsValidVideo] = useState<boolean | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isSendingForm, setIsSendingForm] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [modalData, setModalData] = useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { }
    });

    useEffect(() => {
        if (text && textareaRef.current) {
            textareaRef.current.value = text;
            autoResize();
        }
        if (image) setPreviewImage(image);
        if (video) setPreviewVideo(video);
        if (latitude && longitude) setShowMap(true);
    }, []);

    useEffect(() => {
        if (text === null && image === null && video === null && latitude === null && longitude === null) {
            if (textareaRef.current) textareaRef.current.value = "";
            setPreviewImage(null);
            setPreviewVideo(null);
            setShowMap(false);
        }
    }, [text, image, video, latitude, longitude]);

    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const maxHeight = window.innerHeight * 0.5;
        const newHeight = el.scrollHeight;
        if (newHeight < maxHeight) {
            el.style.overflowY = "hidden";
            el.style.height = newHeight + "px";
        } else {
            el.style.overflowY = "auto";
            el.style.height = maxHeight + "px";
        }
    };

    const openImageSelector = () => fileInputRef.current?.click();
    const openVideoSelector = () => fileInputVideoRef.current?.click();

    const toggleLocation = () => {
        if (!showMap && (image || video)) {
            setModalData({
                isOpen: true,
                title: "¿Agregar ubicación?",
                description: `Al agregar una ubicación, se eliminará ${image ? "la foto" : "el video"} seleccionado.`,
                onConfirm: () => {
                    setImage(null);
                    setPreviewImage(null);
                    setVideo(null);
                    setPreviewVideo(null);
                    setShowMap(true);
                    setModalData(prev => ({ ...prev, isOpen: false }));
                }
            });
        } else {
            if (!showMap) {
                setImage(null);
                setPreviewImage(null);
                setVideo(null);
                setPreviewVideo(null);
            }
            setShowMap(!showMap);
        }
    };

    const handleAddImage = () => {
        if (video || showMap) {
            setModalData({
                isOpen: true,
                title: "¿Agregar foto?",
                description: `Al agregar una foto, se eliminará ${video ? "el video" : "la ubicación"} seleccionada.`,
                onConfirm: () => {
                    setVideo(null);
                    setPreviewVideo(null);
                    setShowMap(false);
                    setLatitude(null);
                    setLongitude(null);
                    openImageSelector();
                    setModalData(prev => ({ ...prev, isOpen: false }));
                }
            });
        } else {
            openImageSelector();
        }
    };

    const handleAddVideo = () => {
        if (image || showMap) {
            setModalData({
                isOpen: true,
                title: "¿Agregar video?",
                description: `Al agregar un video, se eliminará ${image ? "la foto" : "la ubicación"} seleccionada.`,
                onConfirm: () => {
                    setImage(null);
                    setPreviewImage(null);
                    setShowMap(false);
                    setLatitude(null);
                    setLongitude(null);
                    openVideoSelector();
                    setModalData(prev => ({ ...prev, isOpen: false }));
                }
            });
        } else {
            openVideoSelector();
        }
    };


    const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setImageError("La imagen está demasiado pesada (máx 10MB)");
            setIsValidImage(false);
            return;
        }

        setIsValidImage(true);
        setImageError("");

        setVideo(null);
        setPreviewVideo(null);
        setIsValidVideo(null);
        setVideoError("");

        setShowMap(false);
        setLatitude(null);
        setLongitude(null);

        const blobUrl = URL.createObjectURL(file);
        setPreviewImage(blobUrl);

        setIsUploadingImage(true);
        try {
            const fileUrl = await uploadFile(file, "publications");
            if (fileUrl) {
                setPreviewImage(fileUrl);
                setImage(fileUrl);
            }
        } catch {
            setImageError("Error subiendo imagen, intenta de nuevo");
            setIsValidImage(false);
            setPreviewImage(null);
            setImage(null);
        } finally {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            setIsUploadingImage(false);
        }
    };

    const handleVideoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            setVideoError("El video es demasiado pesado (máx 500MB)");
            setIsValidVideo(false);
            return;
        }

        setIsValidVideo(true);
        setVideoError("");

        setImage(null);
        setPreviewImage(null);
        setIsValidImage(null);
        setImageError("");

        setShowMap(false);
        setLatitude(null);
        setLongitude(null);

        const blobUrl = URL.createObjectURL(file);
        setPreviewVideo(blobUrl);

        setIsUploadingVideo(true);
        try {
            const fileUrl = await uploadFile(file, "publications");
            if (fileUrl) {
                setPreviewVideo(fileUrl);
                setVideo(fileUrl);
            }
        } catch {
            setVideoError("Error subiendo video, intenta de nuevo");
            setIsValidVideo(false);
            setPreviewVideo(null);
            setVideo(null);
        } finally {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            setIsUploadingVideo(false);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setPreviewImage(null);
        setIsValidImage(null);
        setImageError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveVideo = () => {
        setVideo(null);
        setPreviewVideo(null);
        setIsValidVideo(null);
        setVideoError("");
        if (fileInputVideoRef.current) fileInputVideoRef.current.value = "";
    };

    const handleRemoveLocation = () => {
        setLatitude(null);
        setLongitude(null);
        setShowMap(false);
    };

    const validateText = () => {
        const realText = textareaRef.current?.value || "";
        if (!realText.trim()) {
            setTextMessage("No ha colocado un texto para la publicación");
            setIsValidText(false);
            return false;
        }
        setTextMessage("");
        setIsValidText(true);
        return true;
    };

    const handleValidatePublicatePublication = async () => {
        const textIsValid = validateText();
        if (!textIsValid || isValidImage === false || isValidVideo === false) return;

        setIsSendingForm(true);
        try {
            const realText = textareaRef.current?.value || "";
            
            await api.publications.create({
                content: realText,
                imageUrl: image,
                videoUrl: video,
                lat: latitude,
                long: longitude
            });

            resetPublication();
            setPreviewImage(null);
            setPreviewVideo(null);
            setShowMap(false);
            navigate("/my-profile");
        } catch (error: any) {
            setErrorMessage(error.message || "Ocurrió un error al publicar.");
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setIsSendingForm(false);
        }
    };

    const handleValidatePreviewPublication = async () => {
        const textIsValid = validateText();
        if (!textIsValid || isValidImage === false || isValidVideo === false) return;
        navigate("/preview-publication");
    };

    const isDisabled = isSendingForm || isUploadingImage || isUploadingVideo;

    return (
        <Box className={`${isDisabled ? "disabled-form" : ""}`} userSelect="none">
            <Flex direction="column" minH="100vh" w={["90%", "75%"]} mx="auto">
                <Heading as="h1" size="4xl" textAlign="center" color="white" mb={4}>Nueva publicación</Heading>

                <Flex align="center" my={3}>
                    <Image
                        src={profilePictureUrl ?? "/Profile.svg"}
                        alt="Foto de perfil"
                        borderRadius="full"
                        mr={1}
                        boxSize="1.5rem"
                        userSelect="none"
                    />
                    <Text color="white">
                        {name ?? "Usuario"} &gt; <Text as="span" color="#616161">Publicación</Text>
                    </Text>
                </Flex>

                <Text color="red.500">{textMessage}</Text>
                <Textarea
                    ref={textareaRef}
                    className={`textarea-input ${isValidText === false ? "input-error" : ""}`}
                    placeholder="Expresa tu idea u opinión aquí"
                    onInput={autoResize}
                    onChange={(e) => { setIsValidText(null); setTextMessage(""); setText(e.target.value); }}
                    mb={3}
                    minH="80px"
                    resize="none"
                    overflow="hidden"
                    bg="#454545"
                    color="white"
                    borderColor={isValidText === false ? "red.500" : { base: "gray.300", _dark: "white" }}
                    borderRadius="1rem"
                    _placeholder={{ color: "gray.400" }}
                    _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                />

                <Flex align="center" mb={3} gap={4}>
                    <Image src="/AddImage.svg" alt="Agregar imagen" boxSize="1.5rem" cursor="pointer" onClick={handleAddImage} filter="none" />
                    <Image src="/AddVideo.svg" alt="Agregar video" boxSize="1.5rem" cursor="pointer" onClick={handleAddVideo} filter="none" />
                    <Image src="/AddLocation.svg" alt="Agregar ubicación" boxSize="1.5rem" cursor="pointer" onClick={toggleLocation} filter="none" />
                </Flex>

                {imageError && <Text color="red.500" textAlign="center" mt={2}>{imageError}</Text>}
                {videoError && <Text color="red.500" textAlign="center" mt={2}>{videoError}</Text>}
                {(isUploadingImage || isUploadingVideo) && <Text color="white" mt={2}>Subiendo archivo...</Text>}

                <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelected} display="none" />
                <Input type="file" accept="video/*" ref={fileInputVideoRef} onChange={handleVideoSelected} display="none" />

                {showMap && (
                    <Box mb={4} pos="relative">
                        <LocationPicker
                            latitude={latitude}
                            longitude={longitude}
                            setLocation={(lat: number | null, lng: number | null) => {
                                setLatitude(lat);
                                setLongitude(lng);
                            }}
                        />
                        <Button
                            size="sm"
                            pos="absolute"
                            top={0}
                            right={0}
                            m={2}
                            borderRadius="full"
                            onClick={handleRemoveLocation}
                            zIndex={1000}
                            bg="gray.100"
                            _hover={{ bg: "gray.200" }}
                            color="black"
                        >X</Button>
                    </Box>
                )}

                {previewImage && (
                    <Box pos="relative" w="75%" mx="auto" mt={4}>
                        <Image src={previewImage} alt="Vista previa" w="100%" borderRadius="md" maxH="15rem" objectFit="contain" display="block" />
                        <Button
                            size="sm"
                            pos="absolute"
                            top={0}
                            right={0}
                            m={2}
                            borderRadius="full"
                            onClick={handleRemoveImage}
                            bg="gray.100"
                            _hover={{ bg: "gray.200" }}
                            color="black"
                        >X</Button>
                    </Box>
                )}

                {previewVideo && (
                    <Box pos="relative" w="75%" mx="auto" mt={4}>
                        <video src={previewVideo} controls style={{ width: "100%", borderRadius: "0.25rem", display: "block" }} />
                        <Button
                            size="sm"
                            pos="absolute"
                            top={0}
                            right={0}
                            m={2}
                            borderRadius="full"
                            onClick={handleRemoveVideo}
                            zIndex={1}
                            bg="gray.100"
                            _hover={{ bg: "gray.200" }}
                            color="black"
                        >X</Button>
                    </Box>
                )}

                <Flex w="100%" mt={5} justify="center" align="center">
                    <Box w="50%" textAlign="start">
                        <Button
                            bg="white"
                            color="black"
                            _hover={{ bg: "gray.200" }}
                            onClick={handleValidatePreviewPublication}
                            disabled={isDisabled}
                            borderRadius="1rem"
                        >Previsualizar</Button>
                    </Box>
                    <Box w="50%" textAlign="end">
                        <Button
                            bg="white"
                            color="black"
                            _hover={{ bg: "gray.200" }}
                            onClick={handleValidatePublicatePublication}
                            disabled={isDisabled}
                            borderRadius="1rem"
                        >
                            {!isSendingForm ? "Publicar" : (<Flex justify="center" align="center"><Text mr={3}>Publicando...</Text><Spinner size="sm" color="black" /></Flex>)}
                        </Button>
                    </Box>
                </Flex>
            </Flex>

            <ConfirmModal
                isOpen={modalData.isOpen}
                title={modalData.title}
                description={modalData.description}
                onConfirm={modalData.onConfirm}
                onCancel={() => setModalData(prev => ({ ...prev, isOpen: false }))}
            />

            {errorMessage && (
                <Box
                    position="fixed"
                    bottom="90px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="white"
                    color="red.500"
                    px={5}
                    py={3}
                    borderRadius="xl"
                    fontWeight="bold"
                    fontSize="sm"
                    zIndex={9999}
                    boxShadow="0 4px 20px rgba(0,0,0,0.4)"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    textAlign="center"
                >
                    ⚠️ {errorMessage}
                </Box>
            )}
        </Box>
    );
}

export default CreatePublication;
