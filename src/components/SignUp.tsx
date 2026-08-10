import { useState, type FormEvent } from "react";
import { signUp } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Image, Spinner, Text, Checkbox } from "@chakra-ui/react";
import { api } from "../services/api";
import { useUserData } from "../utils/UserStore";
import { AppButton, TextareaField, TextField } from "../shared/ui";


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorName = (error: unknown) => {
  if (error && typeof error === "object" && "name" in error) {
    return String((error as { name?: unknown }).name);
  }

  return "";
};

type SignUpProfileField = "username" | "bio" | "specialty";

type SignUpProfileValues = {
  username: string;
  bio: string;
  specialty: string;
};

const emptyProfileValues: SignUpProfileValues = {
  username: "",
  bio: "",
  specialty: "",
};

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileValues, setProfileValues] = useState<SignUpProfileValues>(emptyProfileValues);


  const {
    setEmail: setGlobalEmail,
    setName: setGlobalName,
    setRole: setGlobalRole,
    setProfileData,
  } = useUserData();

  const [isValidName, setIsValidName] = useState<boolean | null>(null);
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState<boolean | null>(null);
  const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
  const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
  const [isPasswordsMatch, setIsPasswordsMatch] = useState<boolean | null>(null);
  const [profileMessage, setProfileMessage] = useState("");

  const [nameMessage, setNameMessage] = useState("Ingrese un nombre de usuario");
  const [passwordMessage, setPasswordMessage] = useState("Ingrese una contraseña");
  const [confirmPasswordMessage, setConfirmPasswordMessage] = useState("Repita la contraseña");
  const [emailMessage, setEmailMessage] = useState("Ingrese su correo electronico");

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&._-]/.test(password),
  };

  const updateProfileField = (field: SignUpProfileField, value: string) => {
    setProfileValues((current) => ({ ...current, [field]: value }));
    if (profileMessage) setProfileMessage("");
  };

  const validateEmail = (): boolean => {
    if (!emailRegex.test(email)) {
      setEmailMessage("El correo no es valido");
      setIsValidEmail(false);
      return false;
    }
    setEmailMessage("Correo valido");
    setIsValidEmail(true);
    return true;
  };

  const validateName = (): boolean => {
    if (!profileValues.username.trim()) {
      setNameMessage("No ha colocado un nombre de usuario");
      setIsValidName(false);
      return false;
    }
    setNameMessage("Nombre de usuario valido");
    setIsValidName(true);
    return true;
  };

  const validatePassword = (): boolean => {
    if (!Object.values(passwordRequirements).every(Boolean)) {
      setPasswordMessage("La contraseña no cumple los requisitos");
      setIsValidPassword(false);
      return false;
    }
    setPasswordMessage("Contraseña valida");
    setIsValidPassword(true);
    return true;
  };

  const validatePasswordConfirmation = (): boolean => {
    if (password !== confirmPassword) {
      setConfirmPasswordMessage("Las contraseñas no coinciden");
      setIsPasswordsMatch(false);
      return false;
    }
    setConfirmPasswordMessage("Contraseñas coinciden");
    setIsPasswordsMatch(true);
    return true;
  };

  const validateProfile = (): boolean => {
    setProfileMessage("");
    return true;
  };

  const signUpUser = async () => {
    setIsSendingForm(true);

    try {
      const username = profileValues.username.trim();

      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: username,
          },
        },
      });

      const payload = {
        email,
        username,
        role: "consumer" as const,
        bio: profileValues.bio.trim(),
        specialty: profileValues.specialty.trim() || null,
      };
      await api.users.create(payload);

      setGlobalEmail(email);
      setGlobalName(username);
      setGlobalRole("consumer");
      setProfileData({
        email,
        name: username,
        role: "consumer",
        bio: payload.bio ?? null,
        location: null,
        interests: [],
        specialty: payload.specialty ?? null,
        isBanned: false,
        isVerified: false,
      });

      setIsSendingForm(false);
      setIsValidName(null);
      setIsValidEmail(null);
      setIsValidPassword(null);
      setIsPasswordsMatch(null);
      setPasswordMessage("Ingrese una contraseña");
      setConfirmPasswordMessage("Repita la contraseña");
      setNameMessage("Ingrese un nombre de usuario");
      setEmailMessage("Ingrese su correo electronico");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setProfileValues(emptyProfileValues);

      localStorage.setItem("pending_verification_email", email);

      navigate("/confirm-signup", {
        state: { email },
      });
    } catch (error: unknown) {
      setIsSendingForm(false);
      console.error("SignUp error detailed:", error);

      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : null;
      const responseData =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: Record<string, unknown> } }).response?.data
          : null;
      const responseMessage =
        responseData && typeof responseData === "object" && "message" in responseData
          ? String((responseData as Record<string, unknown>).message)
          : "";

      const errorName = getErrorName(error);
      if (
        errorName === "UsernameExistsException" ||
        status === 409 ||
        responseMessage.includes("ya existe")
      ) {
        setEmailMessage("Este usuario ya existe, prueba iniciar sesión o recuperar contraseña");
        setIsValidEmail(false);
      } else if (errorName === "InvalidPasswordException") {
        setPasswordMessage("La contraseña no cumple la política de seguridad");
        setIsValidPassword(false);
      } else {
        setEmailMessage("Error al registrar el usuario");
        setIsValidEmail(false);
      }
    }
  };

  const handleValidateForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailIsValid = validateEmail();
    const nameIsValid = validateName();
    const passwordIsValid = validatePassword();
    const passwordsMatch = validatePasswordConfirmation();
    const profileIsValid = validateProfile();

    if (emailIsValid && nameIsValid && passwordIsValid && passwordsMatch && profileIsValid) {
      void signUpUser();
    }
  };

  return (
    <form onSubmit={handleValidateForm}>
      <Box
        className={isSendingForm ? "disabled-form" : ""}
        userSelect="none"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        color="white"
        mt={10}
      >
        <Flex w={{ base: "90%", md: "50%" }} mb={2}>
          <Text
            color="var(--text-muted)"
            cursor="pointer"
            fontWeight="600"
            onClick={() => navigate("/login")}
            _hover={{ color: "white" }}
            transition="color 0.2s"
          >
            Volver al inicio de sesion
          </Text>
        </Flex>

        <Heading as="h1" size="4xl" color="white" mb={4}>
          Registrarse
        </Heading>

        <Box w={{ base: "90%", md: "50%" }} mx="auto" px={4}>
          <TextField
            label={nameMessage}
            isInvalid={isValidName === false}
            type="text"
            value={profileValues.username}
            onChange={(event) => {
              updateProfileField("username", event.target.value);
              if (isValidName === false) {
                setIsValidName(null);
                setNameMessage("Ingrese un nombre de usuario");
              }
            }}
          />

          <TextField
            label={emailMessage}
            isInvalid={isValidEmail === false}
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (isValidEmail === false) {
                setIsValidEmail(null);
                setEmailMessage("Ingrese su correo electronico");
              }
            }}
          />

          <TextField
            label={passwordMessage}
            isInvalid={isValidPassword === false}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (isValidPassword === false) {
                setIsValidPassword(null);
                setPasswordMessage("Ingrese una contraseña");
              }
              if (isPasswordsMatch !== null) {
                setIsPasswordsMatch(null);
                setConfirmPasswordMessage("Repita la contraseña");
              }
            }}
            rightElement={
              <Image
                width="1.5rem"
                cursor="pointer"
                src={!showPassword ? "Text.svg" : "Password.svg"}
                alt="Mostrar u ocultar contraseña"
                onClick={() => setShowPassword((current) => !current)}
              />
            }
          />

          <TextField
            label={confirmPasswordMessage}
            errorText={
              confirmPassword.length > 0 && password !== confirmPassword
                ? "Las contraseñas no coinciden"
                : undefined
            }
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
          />

          <Box
            p={3}
            mb={4}
            borderRadius="panel"
            className="no-select-no-click"
            bg="var(--surface-muted)"
            color="white"
          >
            <Text mb={2}>La contraseña debe contener:</Text>

            <Flex direction="column" gap={1}>
              <PasswordRequirement checked={passwordRequirements.length} label="Al menos 8 caracteres" />
              <PasswordRequirement
                checked={passwordRequirements.uppercase}
                label="Al menos una letra mayuscula"
              />
              <PasswordRequirement
                checked={passwordRequirements.lowercase}
                label="Al menos una letra minuscula"
              />
              <PasswordRequirement checked={passwordRequirements.number} label="Al menos un numero" />
              <PasswordRequirement
                checked={passwordRequirements.special}
                label="Al menos un caracter especial (@$!%*?&._-)"
              />
            </Flex>
          </Box>

          <TextareaField
            label="Biografia"
            value={profileValues.bio}
            minH="7rem"
            maxLength={280}
            helperText="Opcional. Maximo 280 caracteres."
            onChange={(event) => updateProfileField("bio", event.target.value)}
          />

          <TextField
            label="Área de especialidad (Opcional)"
            placeholder="Ej. Desarrollo Web, Diseño Gráfico, Fotografía..."
            value={profileValues.specialty}
            onChange={(e) => updateProfileField("specialty", e.target.value)}
          />

          <AppButton w="100%" my={4} type="submit" disabled={Boolean(isSendingForm)}>
            {!isSendingForm ? (
              "Registrarse"
            ) : (
              <Flex justify="center" align="center">
                <Text mr={3}>Registrando...</Text>
                <Spinner size="sm" />
              </Flex>
            )}
          </AppButton>
        </Box>
      </Box>
    </form>
  );
}

function PasswordRequirement({ checked, label }: { checked: boolean; label: string }) {
  return (
    <Checkbox.Root disabled checked={checked} colorPalette="green">
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  );
}

export default SignUp;
