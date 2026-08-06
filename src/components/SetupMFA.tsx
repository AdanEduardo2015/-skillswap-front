import { useEffect, useState } from "react";
import { setUpTOTP, updateMFAPreference, verifyTOTPSetup } from "aws-amplify/auth";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Code, Flex, Heading, Input, Spinner, Text } from "@chakra-ui/react";
import { useUserData } from "../utils/UserStore";

type TOTPSetupDetails = Awaited<ReturnType<typeof setUpTOTP>>;

function SetupMFA() {
  const navigate = useNavigate();
  const { email } = useUserData();
  const [totpCode, setTotpCode] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [accountName, setAccountName] = useState(email ?? "Usuario");
  const [setupDetails, setSetupDetails] = useState<TOTPSetupDetails | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const setupTOTPAsync = async () => {
      try {
        const totpSetupDetails = await setUpTOTP();
        setSetupDetails(totpSetupDetails);
        setSecretKey(totpSetupDetails.sharedSecret);
      } catch {
        setError("Error al configurar MFA. Por favor, intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    void setupTOTPAsync();
  }, []);

  useEffect(() => {
    if (!setupDetails) return;
    const appName = "ComuniRed";
    const nameToUse = accountName.trim() || "Usuario";
    const url = setupDetails.getSetupUri(appName, nameToUse);
    setQrCodeUrl(url.href);
  }, [accountName, setupDetails]);

  const handleVerifyCode = async () => {
    if (!totpCode.trim() || totpCode.length !== 6) {
      setError("Por favor, ingresa un codigo valido de 6 digitos");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await verifyTOTPSetup({ code: totpCode });
      await updateMFAPreference({ totp: "PREFERRED" });

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/my-profile");
      }, 2000);
    } catch {
      setError("Codigo invalido. Por favor, verifica e intenta de nuevo.");
      setIsVerifying(false);
    }
  };

  const inputStyles = {
    bg: "var(--input-bg)",
    color: "var(--input-text)",
    borderColor: "var(--input-border)",
    borderRadius: "1rem",
    _placeholder: { color: "var(--input-placeholder)" },
    _focus: {
      border: "solid 0.05rem var(--input-focus-border)",
      boxShadow: "none",
      outline: "none",
    },
  };

  const buttonStyles = {
    bg: "var(--button-bg)",
    color: "var(--button-text)",
    _hover: { bg: "var(--button-hover-bg)" },
    borderRadius: "1rem",
  };

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="100vh" color="var(--text-color)">
        <Spinner size="xl" boxSize="15rem" borderWidth="8px" mb={4} />
        <Heading as="h3" mt={4}>
          Configurando MFA...
        </Heading>
      </Flex>
    );
  }

  return (
    <Box
      className={isVerifying ? "disabled-form" : ""}
      userSelect="none"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      color="var(--text-color)"
      mt={10}
    >
      <Flex w={{ base: "90%", md: "50%" }} mb={2}>
        <Text
          color="var(--text-muted)"
          cursor="pointer"
          fontWeight="600"
          onClick={() => navigate("/my-profile")}
          _hover={{ color: "var(--text-color)" }}
          transition="color 0.2s"
        >
          Volver a mi perfil
        </Text>
      </Flex>

      <Heading as="h1" size="4xl" textAlign="center" color="var(--text-color)" mb={4}>
        Configurar autenticacion de dos factores (MFA)
      </Heading>

      <Box w={{ base: "90%", md: "50%" }} mx="auto" px={4}>
        <Box mb={4}>
          <Heading as="h4" color="var(--text-color)" mb={3} size="md">
            Paso 1: Configura el identificador
          </Heading>
          <Text color="var(--text-color)" mb={2}>
            Este nombre aparecera en tu aplicacion de autenticacion:
          </Text>
          <Input
            mb={3}
            type="text"
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            placeholder="Ej: juan@comunired.com"
            {...inputStyles}
          />

          <Heading as="h4" color="var(--text-color)" mb={3} size="md">
            Paso 2: Escanea el codigo QR
          </Heading>
          <Text color="var(--text-color)" mb={3}>
            Usa una aplicacion de autenticacion como Google Authenticator, Microsoft Authenticator o Authy.
          </Text>

          {qrCodeUrl && (
            <Flex justify="center" mb={3} bg="#ffffff" p={3} borderRadius="md">
              <QRCodeSVG value={qrCodeUrl} size={200} />
            </Flex>
          )}
        </Box>

        <Box mb={4}>
          <Heading as="h4" color="var(--text-color)" mb={3} size="md">
            Paso 3: Clave de configuracion manual
          </Heading>
          <Text color="var(--text-color)" mb={2}>
            Si no puedes escanear el codigo QR, ingresa esta clave manualmente en tu aplicacion:
          </Text>
          <Box bg="var(--surface-muted)" color="var(--text-color)" p={3} borderRadius="md" textAlign="center">
            <Code
              fontSize="16px"
              wordBreak="break-word"
              letterSpacing="2px"
              bg="transparent"
              color="var(--text-color)"
              userSelect="text"
            >
              {secretKey}
            </Code>
          </Box>
        </Box>

        <Box mb={4}>
          <Heading as="h4" color="var(--text-color)" mb={3} size="md">
            Paso 4: Verifica el codigo
          </Heading>
          <Text color="var(--text-color)" mb={3}>
            Ingresa el codigo de 6 digitos que aparece en tu aplicacion de autenticacion:
          </Text>

          {error && (
            <Text color="red.500" mb={3}>
              {error}
            </Text>
          )}
          {isSuccess && (
            <Text color="green.500" mb={3} textAlign="center" fontWeight="bold">
              MFA configurado exitosamente.
            </Text>
          )}

          <Input
            mb={3}
            type="text"
            maxLength={6}
            placeholder="000000"
            value={totpCode}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "");
              setTotpCode(value);
              if (error) setError("");
            }}
            textAlign="center"
            fontSize="24px"
            letterSpacing="8px"
            {...inputStyles}
          />
        </Box>

        <Button
          w="100%"
          mb={3}
          onClick={handleVerifyCode}
          disabled={isVerifying || totpCode.length !== 6 || isSuccess}
          {...buttonStyles}
        >
          {isSuccess ? (
            "Exito. Redirigiendo..."
          ) : !isVerifying ? (
            "Verificar y activar MFA"
          ) : (
            <Flex justify="center" align="center">
              <Text mr={3}>Verificando...</Text>
              <Spinner size="sm" color="var(--button-text)" />
            </Flex>
          )}
        </Button>

        <Button w="100%" onClick={() => navigate("/my-profile")} {...buttonStyles}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}

export default SetupMFA;
