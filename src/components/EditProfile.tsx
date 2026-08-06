import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { updateUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { Box, Flex, Heading, Image, Spinner, Text } from "@chakra-ui/react";
import { api, normalizeRole } from "../services/api";
import { uploadFile } from "../utils/UploadUtils";
import { useUserData } from "../utils/UserStore";
import { useSearchParamsGlobal } from "../utils/GlobalVariables";
import type { AuthContext } from "./layouts/LoggedLayout";
import type { UserSummary } from "../types";
import { AppButton, TextareaField, TextField } from "../shared/ui";
import {
  buildUpdateUserPayload,
  emptyProfileSnapshot,
  hasProfileChanges,
  normalizeProfileSnapshot,
  profileSnapshotFromUser,
  type ProfileFormSnapshot,
} from "../features/profiles/profileForm";

type EditProfileLocationState = {
  profile?: UserSummary;
  userName?: string;
  userPic?: string;
} | null;

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const errorMessageFrom = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

function EditProfile() {
  const navigate = useNavigate();
  const authContext = useOutletContext<AuthContext>();
  const routerLocation = useLocation();
  const searchParams = useSearchParamsGlobal();
  const storeName = useUserData((state) => state.name);
  const storeRole = useUserData((state) => state.role);
  const storeProfilePictureUrl = useUserData((state) => state.profilePictureUrl);
  const storeBio = useUserData((state) => state.bio);
  const storeSpecialty = useUserData((state) => state.specialty);
  const setProfileData = useUserData((state) => state.setProfileData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const targetUserEmail = searchParams.get("user");
  const isAdminEdit = Boolean(targetUserEmail);
  const locationState = routerLocation.state as EditProfileLocationState;

  const [formValues, setFormValues] = useState<ProfileFormSnapshot>(() =>
    normalizeProfileSnapshot(emptyProfileSnapshot)
  );
  const [originalValues, setOriginalValues] = useState<ProfileFormSnapshot>(() =>
    normalizeProfileSnapshot(emptyProfileSnapshot)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageError, setImageError] = useState("");
  const [isValidImage, setIsValidImage] = useState(true);

  const applySnapshot = (snapshot: Partial<ProfileFormSnapshot> | null | undefined) => {
    const safeSnapshot = normalizeProfileSnapshot(snapshot);
    setFormValues({ ...safeSnapshot });
    setOriginalValues({ ...safeSnapshot });
    setPreviewImage(safeSnapshot.profilePicture || null);
  };

  useEffect(() => {
    let mounted = true;

    if (isAdminEdit) {
      const snapshot = profileSnapshotFromUser(locationState?.profile, {
        username: locationState?.userName ?? "",
        profilePicture: locationState?.userPic ?? "",
      });
      applySnapshot(snapshot);

      const loadTargetProfile = async () => {
        if (!targetUserEmail) return;

        try {
          const response = await api.publications.listByUser(targetUserEmail, 1);
          if (mounted && response.userProfile) {
            applySnapshot(profileSnapshotFromUser(response.userProfile));
          }
        } catch {
          if (mounted && !locationState?.profile) {
            setErrorMessage("No se pudieron cargar los datos del perfil");
          }
        }
      };

      void loadTargetProfile();

      return () => {
        mounted = false;
      };
    }

    const fallbackSnapshot = profileSnapshotFromUser(null, {
      username: storeName ?? authContext.name ?? "",
      profilePicture: storeProfilePictureUrl ?? authContext.picture ?? "",
      bio: storeBio ?? "",
      specialty: storeSpecialty ?? "",
      role: normalizeRole(storeRole ?? authContext.role),
    });
    applySnapshot(fallbackSnapshot);

    const loadCurrentProfile = async () => {
      if (!authContext.email) return;

      try {
        const response = await api.publications.listByUser(authContext.email, 1);
        if (mounted && response.userProfile) {
          applySnapshot(profileSnapshotFromUser(response.userProfile));
        }
      } catch {
        if (mounted) {
          setErrorMessage("No se pudieron cargar todos los datos del perfil");
        }
      }
    };

    void loadCurrentProfile();

    return () => {
      mounted = false;
    };
  }, [
    authContext,
    isAdminEdit,
    locationState,
    storeBio,
    storeName,
    storeProfilePictureUrl,
    storeRole,
    storeSpecialty,
    targetUserEmail,
  ]);

  const updateFormField = (field: keyof Omit<ProfileFormSnapshot, "role">, value: string) => {
    setFormValues((current) => normalizeProfileSnapshot({ ...current, [field]: value ?? "" }));
    setErrorMessage("");
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleImage(file);
  };

  const handleImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("Selecciona una imagen valida");
      setIsValidImage(false);
      return;
    }

    if (file.size > MAX_BYTES) {
      setImageError(`La imagen supera ${MAX_MB}MB`);
      setIsValidImage(false);
      setPreviewImage(null);
      updateFormField("profilePicture", "");
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
        updateFormField("profilePicture", fileUrl);
      }
    } catch {
      setImageError("Error subiendo imagen, intenta de nuevo");
      setIsValidImage(false);
      setPreviewImage(null);
      updateFormField("profilePicture", "");
    } finally {
      URL.revokeObjectURL(blobUrl);
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
    const safeCurrentValues = normalizeProfileSnapshot(formValues);
    const safeOriginalValues = normalizeProfileSnapshot(originalValues);
    const currentValues = {
      ...safeCurrentValues,
      username: safeCurrentValues.username.trim(),
      profilePicture: safeCurrentValues.profilePicture.trim(),
    };
    const hasNameChange = currentValues.username !== safeOriginalValues.username;
    const hasPictureChange = currentValues.profilePicture !== safeOriginalValues.profilePicture;

    if (!hasProfileChanges(currentValues, safeOriginalValues)) {
      setErrorMessage("Debes cambiar al menos un dato antes de guardar");
      return;
    }

    if (currentValues.username.length > 0 && currentValues.username.length < 3) {
      setErrorMessage("El nombre debe tener al menos 3 caracteres");
      return;
    }

    setErrorMessage("");
    setIsSendingForm(true);

    try {
      const payload = buildUpdateUserPayload(currentValues);

      if (isAdminEdit && targetUserEmail) {
        await api.admin.updateUser(targetUserEmail, payload);
        navigate(`/profile?user=${targetUserEmail}`);
      } else {
        const userAttributes: Record<string, string> = {};
        if (hasNameChange) userAttributes.name = currentValues.username;
        if (hasPictureChange && currentValues.profilePicture) {
          userAttributes.picture = currentValues.profilePicture;
        }

        await api.users.update(payload);

        if (Object.keys(userAttributes).length > 0) {
          await updateUserAttributes({ userAttributes });
          await fetchAuthSession({ forceRefresh: true });
        }

        setProfileData({
          name: currentValues.username,
          profilePictureUrl: currentValues.profilePicture || null,
          bio: payload.bio ?? null,
          specialty: payload.specialty ?? null,
          role: currentValues.role,
        });

        navigate("/my-profile");
      }
    } catch (error: unknown) {
      setErrorMessage(errorMessageFrom(error, "Error al actualizar el perfil"));
    } finally {
      setIsSendingForm(false);
    }
  };

  const isFormDisabled = isSendingForm || isUploadingImage;
  const safeFormValues = normalizeProfileSnapshot(formValues);
  const safeOriginalValues = normalizeProfileSnapshot(originalValues);

  return (
    <Box className={`${isFormDisabled ? "disabled-form" : ""}`} userSelect="none">
      <Flex direction="column" minH="100vh" w={["90%", "75%"]} maxW="container.md" mx="auto">
        <Flex w="100%" mt={4} mb={2}>
          <Text
            color="var(--text-muted)"
            cursor="pointer"
            fontWeight="600"
            onClick={() => navigate(-1)}
            _hover={{ color: "var(--text-color)" }}
            transition="color 0.2s"
          >
            Volver
          </Text>
        </Flex>

        <Heading as="h1" textAlign="center" size="4xl" color="white" mb={4}>
          {isAdminEdit
            ? `Editar perfil de ${safeOriginalValues.username || "usuario"}`
            : "Actualizar mis datos"}
        </Heading>

        {errorMessage && (
          <Heading as="h6" size="sm" color="red.500" mb={3}>
            {errorMessage}
          </Heading>
        )}

        <Text color={!isValidImage ? "red.500" : "white"}>{imageError || "Foto de perfil"}</Text>

        <Box
          textAlign="center"
          mb={4}
          border="0.05rem solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          w="100%"
          cursor="pointer"
          onClick={openImageSelector}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDropImage}
          bg={isDragging ? "var(--surface-muted)" : "var(--surface-bg)"}
          borderStyle={isDragging ? "dashed" : "solid"}
          borderWidth={isDragging ? "2px" : "0.05rem"}
          transition="0.2s ease-in-out"
        >
          {isUploadingImage ? (
            <Flex direction="column" align="center" py={4}>
              <Spinner mb={2} color="white" />
              <Text color="white">Subiendo imagen...</Text>
            </Flex>
          ) : previewImage ? (
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
            <Box py={4}>
              <Text display="block" color="white">
                Haz click o arrastra una imagen aqui
              </Text>
              <Image src="/AddImage.svg" alt="Agregar imagen" w="4rem" mb={2} mx="auto" />
            </Box>
          )}
        </Box>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelected}
          style={{ display: "none" }}
        />

        <TextField
          label="Nombre"
          type="text"
          value={safeFormValues.username}
          placeholder={safeOriginalValues.username || "Nombre de usuario"}
          onChange={(event) => updateFormField("username", event.target.value)}
        />

        <TextareaField
          label="Biografia"
          value={safeFormValues.bio}
          minH="8rem"
          maxLength={280}
          helperText="Maximo 280 caracteres."
          onChange={(event) => updateFormField("bio", event.target.value)}
        />

        <TextField
          label="Area de especialidad"
          helperText="Opcional. Ejemplo: programacion, matematicas, diseno."
          value={safeFormValues.specialty}
          onChange={(event) => updateFormField("specialty", event.target.value)}
        />

        <Flex w="100%" justify="space-between" align="center" gap={3} wrap="wrap" mb={8}>
          {!isAdminEdit && (
            <AppButton tone="secondary" onClick={() => navigate("/edit-password")} disabled={isFormDisabled}>
              Cambiar contraseña
            </AppButton>
          )}
          <AppButton onClick={handleSave} disabled={isFormDisabled} ml="auto">
            {!isSendingForm ? (
              "Actualizar"
            ) : (
              <Flex justify="center" align="center">
                <Text mr={3}>Actualizando...</Text>
                <Spinner size="sm" />
              </Flex>
            )}
          </AppButton>
        </Flex>
      </Flex>
    </Box>
  );
}

export default EditProfile;
