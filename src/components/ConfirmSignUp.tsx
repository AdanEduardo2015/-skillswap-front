import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserData } from "../utils/UserStore";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Box, Heading, Input, Button, Spinner, Text, Flex } from "@chakra-ui/react";

const getErrorName = (error: unknown) =>
  error && typeof error === "object" && "name" in error ? String(error.name) : "";

function ConfirmSignUp() {
  const [code, setCode] = useState("");
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const Correo_electronico =
    (location.state as { email?: string } | null)?.email ||
    useUserData.getState().email ||
    localStorage.getItem("pending_verification_email") ||
    "";

  const validateCode = (): boolean => {
    if (!/^\d{6}$/.test(code)) {
      setRequestMessage("El código debe tener 6 dígitos");
      setIsValidCode(false);
      return false;
    }
    setIsValidCode(true);
    return true;
  };

  const sendCode = async () => {
    if (!validateCode()) return;

    if (!Correo_electronico) {
      setRequestMessage("No se encontró el correo. Regístrate de nuevo.");
      return;
    }

    setIsSendingForm(true);
    setRequestMessage("");

    try {
      await confirmSignUp({
        username: Correo_electronico,
        confirmationCode: code,
      });

      setRequestMessage("Cuenta confirmada correctamente");
      localStorage.removeItem("pending_verification_email");
      navigate("/login");
    } catch (error: unknown) {
      switch (getErrorName(error)) {
        case "CodeMismatchException":
          setRequestMessage("El código ingresado es incorrecto");
          setIsValidCode(false);
          break;
        case "ExpiredCodeException":
          setRequestMessage("El código ha expirado");
          break;
        case "UserNotFoundException":
          setRequestMessage("Usuario no encontrado");
          break;
        default:
          setRequestMessage("Ocurrió un error al verificar el código");
      }
    } finally {
      setIsSendingForm(false);
    }
  };

  const handleResendCode = useCallback(async () => {
    if (!Correo_electronico) {
      setRequestMessage("No se encontró el correo. Regístrate de nuevo.");
      return;
    }

    setIsResending(true);
    setRequestMessage("");

    try {
      await resendSignUpCode({ username: Correo_electronico });
      setRequestMessage("Se ha enviado un nuevo código a tu correo");
      setIsValidCode(null);
    } catch {
      setRequestMessage("Error al reenviar el código. Inténtalo más tarde.");
    } finally {
      setIsResending(false);
    }
  }, [Correo_electronico]);

  useEffect(() => {
    if (location.state?.autoResend && Correo_electronico) {
      handleResendCode();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, Correo_electronico, handleResendCode]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
      <Box
        className={`${isSendingForm ? "disabled-form" : ""}`}
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
            _hover={{ color: "var(--text-color)" }}
            transition="color 0.2s"
          >
            ← Volver al inicio de sesión
          </Text>
        </Flex>

        <Heading as="h1" size="4xl" color="white" mb={4}>
          Verificar código
        </Heading>

        {requestMessage && (
          <Heading
            as="h3"
            size="md"
            textAlign="center"
            mb={4}
            color={isValidCode === false ? "red.500" : "yellow.400"}
          >
            {requestMessage}
          </Heading>
        )}

        <Box w={{ base: "90%", md: "50%" }} mx="auto" px={4}>
          <Input
            className="text-input"
            w="100%"
            mb={4}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ingresa tu código de 6 dígitos"
            borderColor={isValidCode === false ? "red.500" : { base: "gray.300", _dark: "inherit" }}
            bg="var(--input-bg)"
            color="var(--input-text)"
            _placeholder={{ color: "var(--input-placeholder)" }}
            borderRadius="1rem"
            _focus={{ border: "solid 0.05rem var(--input-focus-border)", boxShadow: "none", outline: "none" }}
          />

          <Button
            bg="var(--button-bg)"
            color="var(--button-text)"
            w="100%"
            my={4}
            type="submit"
            disabled={isSendingForm || isResending}
            _hover={{ bg: "var(--button-hover-bg)" }}
            borderRadius="1rem"
          >
            {!isSendingForm ? (
              "Verificar código"
            ) : (
              <Flex justify="center" align="center">
                <Text mr={3}>Verificando...</Text>
                <Spinner size="sm" color="var(--button-text)" />
              </Flex>
            )}
          </Button>

          <Flex justify="center" mt={2}>
            {isResending ? (
              <Spinner size="sm" color="var(--text-color)" />
            ) : (
              <Text
                color="var(--text-muted)"
                fontSize="sm"
                cursor="pointer"
                _hover={{ color: "var(--text-color)", textDecoration: "underline" }}
                onClick={handleResendCode}
              >
                ¿No recibiste el código? Reenviar código
              </Text>
            )}
          </Flex>
        </Box>
      </Box>
    </form>
  );
}

export default ConfirmSignUp;
