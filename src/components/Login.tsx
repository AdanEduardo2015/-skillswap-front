import { useState } from "react";
import { signIn, fetchAuthSession } from "aws-amplify/auth";
import { useUserData } from "../utils/UserStore";
import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, Input, Spinner, Text, Link } from "@chakra-ui/react";
import ConfirmModal from "./modals/ConfirmModal";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginFailedMessage, setLoginFailedMessage] = useState("");
    const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
    const [showPassword, setShowPassword] = useState<boolean | null>(null);
    const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
    const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);
    const [passwordMessage, setPasswordMessage] = useState("Ingrese su contraseña");
    const [emailMessage, setEmailMessage] = useState("Ingrese su correo electrónico");
    const [showUnconfirmedModal, setShowUnconfirmedModal] = useState(false);

    const {
        setEmail: setGlobalEmail,
        setName: setGlobalName,
        setRole: setGlobalRole,
        setProfilePictureUrl,
    } = useUserData();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateEmail = (): boolean => {
        if (!emailRegex.test(email)) {
            setEmailMessage("El correo no es válido");
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

    const handleTogglePassword = () => {
        setShowPassword(prev => !prev);
    };

    const login = async () => {
        setIsSendingForm(true);

        try {
            const signInOutput = await signIn({
                username: email,
                password: password,
            });

            if (signInOutput.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
                navigate("/verify-mfa");
                return;
            }

            if (signInOutput.nextStep.signInStep === "CONFIRM_SIGN_UP") {
                setGlobalEmail(email);
                setShowUnconfirmedModal(true);
                setLoginFailedMessage("Debes confirmar tu correo");
                setIsSendingForm(false);
                return;
            }

            const session = await fetchAuthSession();
            const idToken = session.tokens?.idToken;
            const accessToken = session.tokens?.accessToken;

            if (!idToken || !accessToken) {
                throw new Error("No se pudieron obtener los tokens");
            }

            const claims = idToken.payload;
            const groups = claims["cognito:groups"] as string[] | undefined;

            setGlobalEmail(claims.email as string);
            setGlobalName((claims.name as string) ?? "");
            setGlobalRole(groups && groups.length > 0 ? groups[0] : "user");

            setProfilePictureUrl(null);

            setIsSendingForm(false);
            setIsValidEmail(null);
            setIsValidPassword(null);
            setPasswordMessage("Ingrese una contraseña");
            setEmailMessage("Ingrese su correo electrónico");
            setLoginFailedMessage("");
            setEmail("");
            setPassword("");

            navigate("/");

        } catch (error: any) {
            setIsSendingForm(false);
            console.log("Login error:", error);

            switch (error.name) {
                case "NotAuthorizedException":
                    setLoginFailedMessage("Correo o contraseña incorrectos");
                    break;

                case "PasswordResetRequiredException":
                    setLoginFailedMessage("Debes restablecer tu contraseña");
                    break;

                default:
                    setLoginFailedMessage("Error al iniciar sesión");
            }
        }
    };

    const handleValidateForm = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const emailIsValid = validateEmail();
        const passwordIsValid = validatePassword();
        if (emailIsValid && passwordIsValid) login();
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
                    <Heading as="h1" size="4xl" color="white" mb={4}>Iniciar sesión</Heading>
                    <Heading as="h3" color="red.500" textAlign="center" mb={5} fontSize="lg">{loginFailedMessage}</Heading>

                    <Box w={{ base: "90%", md: "50%" }} mx="auto" px={4}>
                        <Text mb={2} color={isValidEmail === false ? "red.500" : "inherit"}>
                            {emailMessage}
                        </Text>

                        <Input
                            mb={4}
                            bg="#454545"
                            border="solid 0.05rem"
                            borderColor={isValidEmail === false ? "red.500" : { base: "gray.300", _dark: "#ffffff" }}
                            borderRadius="1rem"
                            color="white"
                            _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (isValidEmail === false) {
                                    setIsValidEmail(null);
                                    setEmailMessage("Ingrese su correo electrónico");
                                }
                            }}
                        />

                        <Text mb={2} color={isValidPassword === false ? "red.500" : "inherit"}>
                            {passwordMessage}
                        </Text>

                        <Box position="relative" mb={4}>
                            <Input
                                bg="#454545"
                                border="solid 0.05rem"
                                borderColor={isValidPassword === false ? "red.500" : { base: "gray.300", _dark: "#ffffff" }}
                                borderRadius="1rem"
                                color="white"
                                _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (isValidPassword === false) {
                                        setIsValidPassword(null);
                                        setPasswordMessage("Ingrese su contraseña");
                                    }
                                }}
                            />

                            <Image
                                position="absolute"
                                right="1rem"
                                top="50%"
                                transform="translateY(-50%)"
                                width="1.5rem"
                                cursor="pointer"
                                src={!showPassword ? "Text.svg" : "Password.svg"}
                                alt="Mostrar u ocultar contraseña"
                                onClick={handleTogglePassword}
                            />
                        </Box>

                        <Text mb={3}>
                            ¿Olvidaste tu contraseña?{" "}
                            <Link as="span" cursor="pointer" color="white" textDecoration="underline" onClick={() => navigate("/forgot-password")}>
                                ¡Recupérala!
                            </Link>
                        </Text>

                        <Text>
                            ¿Todavía no tienes una cuenta?{" "}
                            <Link as="span" cursor="pointer" color="white" textDecoration="underline" onClick={() => navigate("/signUp")}>
                                Regístrate aquí
                            </Link>
                        </Text>

                        <Button
                            w="100%"
                            my={4}
                            bg="white"
                            color="black"
                            type="submit"
                            borderRadius="1rem"
                            _hover={{ bg: "gray.200" }}
                        >
                            {!isSendingForm ? (
                                "Iniciar sesión"
                            ) : (
                                <Flex justify="center" align="center">
                                    <Text mr={3}>Autenticándote...</Text>
                                    <Spinner size="sm" />
                                </Flex>
                            )}
                        </Button>
                    </Box>
                </Box>
            </form>

            <ConfirmModal
                isOpen={showUnconfirmedModal}
                title="Usted no está verificado"
                description="Su cuenta aún no ha sido confirmada. Haga clic en confirmar para enviarle un código y verificar su cuenta ahora."
                onConfirm={() => navigate("/confirm-signup", { state: { autoResend: true } })}
                onCancel={() => setShowUnconfirmedModal(false)}
            />
        </>
    );
}

export default Login;
