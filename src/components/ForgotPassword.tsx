import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "aws-amplify/auth";
import { Flex, Heading, Text, Spinner, Box } from "@chakra-ui/react";
import { AppButton, TextField } from "../shared/ui";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorName = (error: unknown) => {
  if (error && typeof error === "object" && "name" in error) {
    return String((error as { name?: unknown }).name);
  }

  return "";
};

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("Ingrese su correo electronico");
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
  const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  const navigate = useNavigate();

  const validateEmail = (): boolean => {
    if (!emailRegex.test(email ?? "")) {
      setEmailMessage("El correo no es valido");
      setIsValidEmail(false);
      return false;
    }
    setEmailMessage("Enviando correo...");
    setIsValidEmail(true);
    return true;
  };

  const sendRecoveryEmail = async () => {
    setIsSendingForm(true);
    setRequestMessage("");

    try {
      await resetPassword({ username: email });
      const savedEmail = email;
      setIsValidEmail(null);
      setEmailMessage("Ingrese su correo electronico");
      setEmail("");
      navigate("/reset-password", { state: { Correo_electronico: savedEmail } });
    } catch (error: unknown) {
      const errorName = getErrorName(error);

      if (errorName === "UserNotFoundException") {
        setRequestMessage("No existe una cuenta con este correo.");
        setIsValidEmail(false);
        setEmailMessage("El correo no existe");
      } else if (errorName === "LimitExceededException") {
        setRequestMessage("Demasiados intentos. Por favor intente mas tarde.");
      } else {
        setRequestMessage("Ocurrio un error al enviar el correo.");
      }
    } finally {
      setIsSendingForm(false);
    }
  };

  const handleValidateForm = (event: FormEvent) => {
    event.preventDefault();
    if (validateEmail()) void sendRecoveryEmail();
  };

  return (
    <form onSubmit={handleValidateForm}>
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
            _hover={{ color: "white" }}
            transition="color 0.2s"
          >
            Volver al inicio de sesion
          </Text>
        </Flex>

        <Heading as="h1" size="4xl" color="white" mb={4}>
          Recuperar contraseña
        </Heading>

        {requestMessage && (
          <Heading as="h3" size="md" color="yellow.400" textAlign="center" mb={4}>
            {requestMessage}
          </Heading>
        )}

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

          <AppButton type="submit" w="100%" my={4}>
            {!isSendingForm ? (
              "Enviar codigo"
            ) : (
              <Flex justify="center" align="center">
                <Text mr={3}>Enviando correo...</Text>
                <Spinner size="sm" color="black" />
              </Flex>
            )}
          </AppButton>
        </Box>
      </Box>
    </form>
  );
}

export default ForgotPassword;
