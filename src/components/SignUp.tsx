import { useState } from "react";
import { signUp } from "aws-amplify/auth";
import { useUserData } from "../utils/UserStore";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Box, Flex, Heading, Text, Input, Button, Spinner, Checkbox, Image } from "@chakra-ui/react";

function SignUp() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const setGlobalEmail = useUserData((state) => state.setEmail);
    const setGlobalName = useUserData((state) => state.setName);

    const [isValidName, setIsValidName] = useState<boolean | null>(null);
    const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
    const [showPassword, setShowPassword] = useState<boolean | null>(null);
    const [isSendingForm, setIsSendingForm] = useState<boolean | null>(null);
    const [isValidPassword, setIsValidPassword] = useState<boolean | null>(null);

    const [nameMessage, setNameMessage] = useState("Ingrese un nombre de usuario");
    const [passwordMessage, setPasswordMessage] = useState("Ingrese una contraseña");
    const [emailMessage, setEmailMessage] = useState("Ingrese su correo electrónico");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const require = {
        length: password.length >= 8,
        mayuscula: /[A-Z]/.test(password),
        minuscula: /[a-z]/.test(password),
        numero: /\d/.test(password),
        especial: /[@$!%*?&._-]/.test(password),
    };

    const navigate = useNavigate();

    const handleTogglePassword = () => setShowPassword(prev => !prev);

    const validateEmail = (): boolean => {
        if (!emailRegex.test(email)) {
            setEmailMessage("El correo no es válido");
            setIsValidEmail(false);
            return false;
        }
        setEmailMessage("Correo válido");
        setIsValidEmail(true);
        return true;
    };

    const validateName = (): boolean => {
        if (!username.trim()) {
            setNameMessage("No ha colocado un nombre de usuario");
            setIsValidName(false);
            return false;
        }
        setNameMessage("Nombre de usuario válido");
        setIsValidName(true);
        return true;
    };

    const validatePassword = (): boolean => {
        if (!Object.values(require).every(Boolean)) {
            setPasswordMessage("La contraseña no cumple los requisitos");
            setIsValidPassword(false);
            return false;
        }
        setPasswordMessage("Contraseña válida");
        setIsValidPassword(true);
        return true;
    };

    const signUpUser = async () => {
        setIsSendingForm(true);

        try {
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

            setGlobalEmail(email);
            setGlobalName(username);

            await api.users.create({
                email: email,
                username: username
            });

            setIsSendingForm(false);
            setIsValidName(null);
            setIsValidEmail(null);
            setIsValidPassword(null);

            setPasswordMessage("Ingrese una contraseña");
            setNameMessage("Ingrese un nombre de usuario");
            setEmailMessage("Ingrese su correo electrónico");

            setEmail("");
            setUsername("");
            setPassword("");

            navigate("/confirm-signup", {
                state: { email: email }
            });
        } catch (error: any) {
            setIsSendingForm(false);

            switch (error.name) {
                case "UsernameExistsException":
                    setEmailMessage("Este usuario ya existe, prueba iniciar sesión");
                    setIsValidEmail(false);
                    break;
                case "InvalidPasswordException":
                    setPasswordMessage("La contraseña no cumple la política de seguridad");
                    setIsValidPassword(false);
                    break;
                default:
                    setEmailMessage("Error al registrar el usuario");
            }
        }
    };

    const handleValidateForm = () => {
        const emailIsValid = validateEmail();
        const nameIsValid = validateName();
        const passwordIsValid = validatePassword();

        if (emailIsValid && nameIsValid && passwordIsValid) {
            signUpUser();
        }
    };

    return (
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
                    color="#aaa"
                    cursor="pointer"
                    fontWeight="600"
                    onClick={() => navigate("/login")}
                    _hover={{ color: "white" }}
                    transition="color 0.2s"
                >
                    ← Volver al inicio de sesión
                </Text>
            </Flex>

            <Heading as="h1" size="4xl" color="white" mb={4}>Registrarse</Heading>

            <Box w={{ base: "90%", md: "50%" }} mx="auto" px={4}>
                <Text color={isValidName === false ? "red.500" : "inherit"} mb={2}>{nameMessage}</Text>
                <Input
                    type="text"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (isValidName === false) {
                            setIsValidName(null);
                            setNameMessage("Ingrese un nombre de usuario");
                        }
                    }}
                    bg="#454545"
                    color="white"
                    border="solid 0.05rem"
                    borderColor={isValidName === false ? "red.500" : { base: "gray.300", _dark: "#ffffff" }}
                    borderRadius="1rem"
                    _placeholder={{ color: "gray.400" }}
                    mb={4}
                    _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                />

                <Text color={isValidEmail === false ? "red.500" : "inherit"} mb={2}>{emailMessage}</Text>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (isValidEmail === false) {
                            setIsValidEmail(null);
                            setEmailMessage("Ingrese su correo electrónico");
                        }
                    }}
                    bg="#454545"
                    color="white"
                    border="solid 0.05rem"
                    borderColor={isValidEmail === false ? "red.500" : { base: "gray.300", _dark: "#ffffff" }}
                    borderRadius="1rem"
                    _placeholder={{ color: "gray.400" }}
                    mb={4}
                    _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                />

                <Text color={isValidPassword === false ? "red.500" : "inherit"} mb={2}>{passwordMessage}</Text>
                <Box pos="relative" display="flex" alignItems="center" mb={4}>
                    <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (isValidPassword === false) {
                                setIsValidPassword(null);
                                setPasswordMessage("Ingrese su contraseña");
                            }
                        }}
                        bg="#454545"
                        color="white"
                        border="solid 0.05rem"
                        borderColor={isValidPassword === false ? "red.500" : { base: "gray.300", _dark: "#ffffff" }}
                        borderRadius="1rem"
                        _placeholder={{ color: "gray.400" }}
                        _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
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

                <Box p={2} mb={4} borderRadius="md" className="no-select-no-click" bg="gray.800" color="white">
                    <Text mb={2}>La contraseña debe contener:</Text>

                    <Flex direction="column" gap={1}>
                        <Checkbox.Root disabled checked={require.length} colorPalette="green">
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>Al menos 8 caracteres</Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root disabled checked={require.mayuscula} colorPalette="green">
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>Al menos una letra mayúscula</Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root disabled checked={require.minuscula} colorPalette="green">
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>Al menos una letra minúscula</Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root disabled checked={require.numero} colorPalette="green">
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>Al menos un número</Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root disabled checked={require.especial} colorPalette="green">
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>Al menos un carácter especial (@$!%*?&._-)</Checkbox.Label>
                        </Checkbox.Root>
                    </Flex>
                </Box>

                <Button
                    bg="white"
                    color="black"
                    w="100%"
                    my={4}
                    _hover={{ bg: "gray.200" }}
                    onClick={handleValidateForm}
                    borderRadius="1rem"
                >
                    {!isSendingForm ? (
                        "Registrarse"
                    ) : (
                        <Flex justify="center" align="center">
                            <Text mr={3}>Registrándote...</Text>
                            <Spinner size="sm" color="black" />
                        </Flex>
                    )}
                </Button>
            </Box>
        </Box>
    );
}

export default SignUp;
