import { useRef, useState, useEffect } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { uploadFile } from "../utils/UploadUtils";
import { updateUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { api } from "../services/api";
import { useUserData } from "../utils/UserStore";
import type { AuthContext } from "./layouts/LoggedLayout";
import { useSearchParamsGlobal } from "../utils/GlobalVariables";
import { Box, Flex, Heading, Text, Input, Button, Spinner, Image } from "@chakra-ui/react";

function EditProfile() {
    const navigate = useNavigate();
    const authContext = useOutletContext<AuthContext>();
    const location = useLocation();
    const searchParams = useSearchParamsGlobal();
    const { setName: setGlobalName, setProfilePictureUrl } = useUserData();

    const targetUserEmail = searchParams.get("user");
    const isAdminEdit = !!targetUserEmail;

    const locationState = location.state as { userName?: string; userPic?: string } | null;

    const [name, setName] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSendingForm, setIsSendingForm] = useState<boolean>(false);
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [imageError, setImageError] = useState<string>("");
    const [isValidImage, setIsValidImage] = useState<boolean>(true);

    const [originalName, setOriginalName] = useState<string>("");
    const [originalPicture, setOriginalPicture] = useState<string>("");

    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    useEffect(() => {
        if (isAdminEdit && locationState) {
            const stateName = locationState.userName || "";
            const statePic = locationState.userPic || "";

            setName(stateName);
            setOriginalName(stateName);
            setOriginalPicture(statePic);
            if (statePic) {
                setPreviewImage(statePic);
                setProfileImage(statePic);
            }
        } else if (!isAdminEdit) {
            if (authContext.name) {
                setName(authContext.name);
                setOriginalName(authContext.name);
            }
            if (authContext.picture) {
                setPreviewImage(authContext.picture);
                setProfileImage(authContext.picture);
                setOriginalPicture(authContext.picture);
            }
        }
    }, [authContext, isAdminEdit, locationState]);

    const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleImage(file);
    };

    const handleImage = async (file: File) => {
        if (!file) return;

        if (file.size > MAX_BYTES) {
            setImageError(`La imagen supera ${MAX_MB}MB`);
            setIsValidImage(false);
            setPreviewImage(null);
            setProfileImage(null);
            return;
        }

        setIsValidImage(true);
        setImageError("");

        const blobUrl = URL.createObjectURL(file);
        setPreviewImage(blobUrl);

        setIsUploadingImage(true);
        try {
            const fileUrl = await uploadFile(file, "profile");
            if (fileUrl) {
                setPreviewImage(fileUrl);
                setProfileImage(fileUrl);
            }
        } catch {
            setImageError("Error subiendo imagen, intenta de nuevo");
            setIsValidImage(false);
            setPreviewImage(null);
            setProfileImage(null);
        } finally {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            setIsUploadingImage(false);
        }
    };

    const openImageSelector = () => fileInputRef.current?.click();

    const handleDropImage = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (!file) return;
        await handleImage(file);
    };

    const handleSave = async () => {
        const trimmedName = name.trim();
        const hasNameChange = trimmedName && trimmedName !== originalName;
        const hasPictureChange = profileImage && profileImage !== originalPicture;

        if (!hasNameChange && !hasPictureChange) {
            setErrorMessage("Debes cambiar el nombre o actualizar la foto antes de guardar");
            return;
        }

        if (trimmedName.length > 0 && trimmedName.length < 3) {
            setErrorMessage("El nombre debe tener al menos 3 caracteres");
            return;
        }

        setErrorMessage("");
        setIsSendingForm(true);

        try {
            if (isAdminEdit && targetUserEmail) {
                await api.admin.updateUser(targetUserEmail, {
                    username: trimmedName,
                    profilePicUrl: profileImage || undefined
                });
                navigate(`/profile?user=${targetUserEmail}`);
            } else {
                const userAttributes: Record<string, string> = {};
                if (hasNameChange) userAttributes.name = trimmedName;
                if (hasPictureChange && profileImage) userAttributes.picture = profileImage;

                await api.users.update({
                    username: trimmedName,
                    profilePicUrl: profileImage || undefined
                });

                await updateUserAttributes({ userAttributes });
                await fetchAuthSession({ forceRefresh: true });

                if (hasNameChange) setGlobalName(trimmedName);
                if (hasPictureChange && profileImage) setProfilePictureUrl(profileImage);

                navigate("/my-profile");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Error al actualizar el perfil");
        } finally {
            setIsSendingForm(false);
        }
    };

    const isFormDisabled = isSendingForm || isUploadingImage;


    return (
        <Box className={`${isFormDisabled ? "disabled-form" : ""}`} userSelect="none">
            <Flex direction="column" minH="100vh" w={["90%", "75%"]} mx="auto">
                <Flex w="100%" mt={4} mb={2}>
                    <Text
                        color="#aaa"
                        cursor="pointer"
                        fontWeight="600"
                        onClick={() => navigate(-1)}
                        _hover={{ color: "white" }}
                        transition="color 0.2s"
                    >
                        ← Volver
                    </Text>
                </Flex>

                <Heading as="h1" textAlign="center" size="4xl" color="white" mb={4}>
                    {isAdminEdit ? `Editar perfil de ${originalName}` : "Actualizar mis datos"}
                </Heading>

                {errorMessage && <Heading as="h6" size="sm" color="red.500">{errorMessage}</Heading>}

                <Text color={!isValidImage ? "red.500" : { base: "black", _dark: "white" }}>
                    {imageError || "Foto de perfil"}
                </Text>

                <Box
                    textAlign="center"
                    mb={4}
                    border="0.05rem solid"
                    borderColor="#ffffff"
                    borderRadius="0.5rem"
                    w="100%"
                    cursor="pointer"
                    onClick={openImageSelector}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDropImage}
                    bg={isDragging ? (false ? "rgba(0,0,0,0.1)" : "rgba(255, 255, 255, 0.1)") : { base: "gray.100", _dark: "#454545" }}
                    borderStyle={isDragging ? "dashed" : "solid"}
                    borderWidth={isDragging ? "2px" : "0.05rem"}
                    transition="0.2s ease-in-out"
                >
                    {isUploadingImage ? (
                        <Flex direction="column" align="center" py={4}>
                            <Spinner mb={2} color="white" />
                            <Text color="white">Subiendo imagen...</Text>
                        </Flex>
                    ) : (
                        previewImage ? (
                            <Image
                                src={previewImage}
                                alt="Vista previa"
                                display="block"
                                w="75%"
                                mx="auto"
                                borderRadius="md"
                                maxH="15rem"
                                objectFit="contain"
                            />
                        ) : (
                            <>
                                <Text display="block" color="white">Haz click o arrastra una imagen aquí</Text>
                                <Image src="/AddImage.svg" alt="Agregar imagen" w="4rem" mb={2} mx="auto" filter="none" />
                            </>
                        )
                    )}
                </Box>

                <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelected}
                    display="none"
                />

                <Text color="white">Nombre</Text>
                <Input
                    w="100%"
                    mb={4}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={originalName || "Nombre de usuario"}
                    bg="#454545"
                    color="white"
                    _placeholder={{ color: "gray.400" }}
                    borderColor="white"
                    borderRadius="1rem"
                    _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                />

                <Flex w="100%" justify="center" align="center">
                    {!isAdminEdit && (
                        <Box w="50%" textAlign="start">
                            <Button
                                bg="white"
                                color="black"
                                _hover={{ bg: "gray.200" }}
                                onClick={() => navigate("/edit-password")}
                                borderRadius="1rem"
                            >
                                Cambiar contraseña
                            </Button>
                        </Box>
                    )}
                    <Box w={isAdminEdit ? "100%" : "50%"} textAlign="end">
                        <Button
                            bg="white"
                            color="black"
                            _hover={{ bg: "gray.200" }}
                            onClick={handleSave}
                            disabled={isFormDisabled}
                            borderRadius="1rem"
                        >
                            {!isSendingForm ? (
                                "Actualizar"
                            ) : (
                                <Flex justify="center" align="center">
                                    <Text mr={3}>Actualizando...</Text>
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

export default EditProfile;
