import { useNavigate, useLocation } from "react-router-dom";
import { paths } from "../utils/GlobalVariables";
import { Box, Flex, Image } from "@chakra-ui/react";
import { useNotificationStore } from "../utils/NotificationStore";

function Footer() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const hasUnreadNotifications = useNotificationStore((state) => state.hasUnreadNotifications);

    return (
        paths.showFooter && (
            <Box
                position="sticky"
                bottom={0}
                borderTop="0.1rem solid var(--text-color)"
                py={2}
                bg="var(--bg-color)"
                textAlign="center"
                zIndex={10}
                userSelect="none"
                w="100%"
                transition="background-color 0.3s ease, border-top-color 0.3s ease"
            >
                <Flex justify="space-around" align="center">
                    <Image
                        src={currentPath === "/" ? "Home_Active.svg" : "Home.svg"}
                        alt="Home"
                        cursor="pointer"
                        boxSize="8%"
                        maxW="3.5rem"
                        p="1%"
                        borderRadius="0.5rem"
                        onClick={() => navigate("/")}
                    />
                    <Image
                        src={currentPath === "/create-publication" ? "AddPublication_Active.svg" : "AddPublication.svg"}
                        alt="AddPublication"
                        cursor="pointer"
                        boxSize="8%"
                        maxW="3.5rem"
                        p="1%"
                        borderRadius="0.5rem"
                        onClick={() => navigate("/create-publication")}
                    />
                    <Box pos="relative" boxSize="8%" maxW="3.5rem">
                        <Image
                            src={currentPath === "/notifications" ? "Messages_Active.svg" : "Messages.svg"}
                            alt="Messages"
                            cursor="pointer"
                            p="10%"
                            w="100%"
                            h="100%"
                            borderRadius="0.5rem"
                            onClick={() => navigate("/notifications")}
                        />
                        {hasUnreadNotifications && (
                            <Box
                                pos="absolute"
                                top="-2px"
                                right="-2px"
                                w="10px"
                                h="10px"
                                bg="#3b82f6"
                                borderRadius="full"
                                border="2px solid var(--bg-color)"
                                animation="pulse-glow 2s infinite"
                            />
                        )}
                    </Box>
                </Flex>
            </Box>
        )
    );
}
export default Footer;
