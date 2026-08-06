import { useState, type FormEvent } from "react";
import { signIn } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Image, Spinner, Text, Link } from "@chakra-ui/react";
import { useUserData } from "../utils/UserStore";
import { normalizeRole } from "../domain/roles";
import { AppButton, TextField } from "../shared/ui";
import ConfirmModal from "./modals/ConfirmModal";
import { IS_LOCAL_AUTH_ENABLED, LOCAL_AUTH_ROLE } from "../config/api";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import { clearAuthTokenCache } from "../utils/GlobalVariables";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorName = (error: unknown) => {
  if (error && typeof error === "object" && "name" in error) {
    return String((error as { name?: unknown }).name);
  }

  return "";
};

function Login() {
  const navigate = useNavigate();
  const authSession = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginFailedMessage, setLoginFailedMessage] = useState("");
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState<boolean | null>(null);
  const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
  const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
  const [passwordMessage, setPasswordMessage] = useState("Ingrese su contraseña");
  const [emailMessage, setEmailMessage] = useState("Ingrese su correo electronico");
  const [showUnconfirmedModal, setShowUnconfirmedModal] = useState(false);

  const {
    setEmail: setGlobalEmail,
    setName: setGlobalName,
    setRole: setGlobalRole,
    setProfilePictureUrl,
  } = useUserData();

  const validateEmail = (): boolean => {
    if (!emailRegex.test(email)) {
      setEmailMessage("El correo no es valido");
      setIsValidEmail(false);
      return false;
    }
    setEmailMessage("Enviando correo...");
    setIsValidEmail(true);
    return true;
  };

  const validatePassword = (): boolean => {
    if (!password.trim()) {
      setPasswordMessage("No ha ingresado su contraseña");
      setIsValidPassword(false);
      return false;
    }
    setPasswordMessage("Enviando contraseña...");
    setIsValidPassword(true);
    return true;
  };

  const login = async () => {
    setIsSendingForm(true);
    const trimmedEmail = email.trim();

    if (IS_LOCAL_AUTH_ENABLED) {
      setGlobalEmail(trimmedEmail);
      setGlobalName("Usuario Local");
      setGlobalRole(normalizeRole(LOCAL_AUTH_ROLE));
      setProfilePictureUrl(null);
      setIsSendingForm(false);
      setIsValidEmail(null);
      setIsValidPassword(null);
      setPasswordMessage("Ingrese una contraseña");
      setEmailMessage("Ingrese su correo electronico");
      setLoginFailedMessage("");
      setEmail("");
      setPassword("");
      await authSession.refresh();
      navigate("/");
      return;
    }

    try {
      const signInOutput = await signIn({
        username: trimmedEmail,
        password,
      });

      if (signInOutput.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        navigate("/verify-mfa");
        return;
      }

      if (signInOutput.nextStep.signInStep === "CONFIRM_SIGN_UP") {
        setGlobalEmail(trimmedEmail);
        setShowUnconfirmedModal(true);
        setLoginFailedMessage("Debes confirmar tu correo");
        setIsSendingForm(false);
        return;
      }

      clearAuthTokenCache();
      await authSession.refresh({ forceRefresh: true });

      setIsSendingForm(false);
      setIsValidEmail(null);
      setIsValidPassword(null);
      setPasswordMessage("Ingrese una contraseña");
      setEmailMessage("Ingrese su correo electronico");
      setLoginFailedMessage("");
      setEmail("");
      setPassword("");

      navigate("/");
    } catch (error: unknown) {
      setIsSendingForm(false);

      switch (getErrorName(error)) {
        case "UserNotConfirmedException":
          setGlobalEmail(trimmedEmail);
          setShowUnconfirmedModal(true);
          setLoginFailedMessage("Debes confirmar tu correo");
          break;
        case "NotAuthorizedException":
          setLoginFailedMessage("Correo o contraseña incorrectos");
          break;
        case "PasswordResetRequiredException":
          setLoginFailedMessage("Debes restablecer tu contraseña");
          break;
        case "UserNotFoundException":
          setLoginFailedMessage("El correo ingresado no está registrado");
          break;
        case "LimitExceededException":
          setLoginFailedMessage("Demasiados intentos. Inténtalo más tarde.");
          break;
        case "ResourceNotFoundException":
          setLoginFailedMessage("La configuracion de autenticacion no es valida");
          break;
        default:
          setLoginFailedMessage("Error al iniciar sesion");
      }
    }
  };

  const handleValidateForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailIsValid = validateEmail();
    const passwordIsValid = validatePassword();
    if (emailIsValid && passwordIsValid) void login();
  };

  return (
    <>
      <form onSubmit={handleValidateForm}>
        <Box
          className={`${isSendingForm ? "disabled-form no-select" : ""}`}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          color="white"
          mt={10}
        >
          <Heading as="h1" size="4xl" color="white" mb={4}>
            Iniciar sesion
          </Heading>
          <Heading as="h3" color="red.500" textAlign="center" mb={5} fontSize="lg">
            {loginFailedMessage}
          </Heading>

          <Box w={{ base: "90%", md: "50%" }} mx="auto" px={4}>
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
                  setPasswordMessage("Ingrese su contraseña");
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

            <Text mb={3}>
              Olvidaste tu contraseña?{" "}
              <Link
                as="span"
                cursor="pointer"
                color="white"
                textDecoration="underline"
                onClick={() => navigate("/forgot-password")}
              >
                Recuperala aqui
              </Link>
            </Text>

            <Text>
              Todavia no tienes una cuenta?{" "}
              <Link
                as="span"
                cursor="pointer"
                color="white"
                textDecoration="underline"
                onClick={() => navigate("/signUp")}
              >
                Registrate aqui
              </Link>
            </Text>

            <AppButton w="100%" my={4} type="submit">
              {!isSendingForm ? (
                "Iniciar sesion"
              ) : (
                <Flex justify="center" align="center">
                  <Text mr={3}>Autenticando...</Text>
                  <Spinner size="sm" />
                </Flex>
              )}
            </AppButton>
          </Box>
        </Box>
      </form>

      <ConfirmModal
        isOpen={showUnconfirmedModal}
        title="Cuenta sin verificar"
        description="Tu cuenta aun no ha sido confirmada. Confirma para enviar un codigo y verificarla ahora."
        onConfirm={() => {
          localStorage.setItem("pending_verification_email", email);
          navigate("/confirm-signup", { state: { autoResend: true, email } });
        }}
        onCancel={() => setShowUnconfirmedModal(false)}
      />
    </>
  );
}

export default Login;
