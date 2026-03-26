import { useLocation, useNavigate } from "react-router-dom";
import { paths } from "../utils/GlobalVariables";
import { Flex, Image, Tooltip, Box } from "@chakra-ui/react";
import { useNotificationStore } from "../utils/NotificationStore";

const NavTooltip = ({ label, children }: { label: string, children: React.ReactNode }) => {
    return (
        <Tooltip.Root positioning={{ placement: "bottom" }} openDelay={200} closeDelay={0}>
            <Tooltip.Trigger asChild>
                {children}
            </Tooltip.Trigger>
            <Tooltip.Positioner>
                <Tooltip.Arrow>
                    <Tooltip.ArrowTip />
                </Tooltip.Arrow>
                <Tooltip.Content bg="#000000" color="white" px={2} py={1} borderRadius="md" fontSize="sm">
                    {label}
                </Tooltip.Content>
            </Tooltip.Positioner>
        </Tooltip.Root>
    );
};

function SideNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const hasUnreadNotifications = useNotificationStore((state) => state.hasUnreadNotifications);

    const isSideNavVisible = !paths.showLogoOnly && paths.showSideNav;

    return (
        <Flex
            direction="column"
            justify="space-around"
            align="center"
            w={paths.showLogoOnly ? "100%" : "20%"}
            py={4}
            userSelect="none"
            h={isSideNavVisible ? "100dvh" : "auto"}
            pos={isSideNavVisible ? "sticky" : "static"}
            top={0}
            bg="#000000"
            borderRight="none"
            borderColor="gray.200"
            mx={!isSideNavVisible ? "auto" : undefined}
        >
            {paths.showLogoOnly ? (
                <Image
                    src="Logo.svg"
                    alt="Logo"
                    mx="auto"
                    w="7rem"
                />
            ) : paths.showSideNav ? (
                <>
                    <NavTooltip label="Logo">
                        <Box w="100%" display="flex" justifyContent="center">
                            <Image
                                src="Logo.svg"
                                alt="Logo"
                                w="20%"
                            />
                        </Box>
                    </NavTooltip>

                    <Box pb={24}></Box>

                    <NavTooltip label="Buscar">
                        <Box w="100%" display="flex" justifyContent="center">
                            <Image
                                src={currentPath === "/search" ? "Search_Active.svg" : "Search.svg"}
                                alt="Search"
                                cursor="pointer"
                                onClick={() => navigate("/search")}
                                w="15%"
                            />
                        </Box>
                    </NavTooltip>

                    <NavTooltip label="Notificaciones">
                        <Box w="100%" display="flex" justifyContent="center" pos="relative">
                            <Box pos="relative" w="15%">
                                <Image
                                    src={currentPath === "/notifications" ? "Messages_Active.svg" : "Messages.svg"}
                                    alt="Messages"
                                    cursor="pointer"
                                    onClick={() => navigate("/notifications")}
                                    w="100%"
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
                                        border="2px solid black"
                                        animation="pulse-glow 2s infinite"
                                    />
                                )}
                            </Box>
                        </Box>
                    </NavTooltip>

                    <NavTooltip label="Crear publicación">
                        <Box w="100%" display="flex" justifyContent="center">
                            <Image
                                src={currentPath === "/create-publication" ? "AddPublication_Active.svg" : "AddPublication.svg"}
                                alt="AddPublication"
                                cursor="pointer"
                                onClick={() => navigate("/create-publication")}
                                w="15%"
                            />
                        </Box>
                    </NavTooltip>

                    <NavTooltip label="Inicio">
                        <Box w="100%" display="flex" justifyContent="center">
                            <Image
                                src={currentPath === "/" ? "Home_Active.svg" : "Home.svg"}
                                alt="Home"
                                cursor="pointer"
                                onClick={() => navigate("/")}
                                w="15%"
                            />
                        </Box>
                    </NavTooltip>

                    <NavTooltip label="Perfil">
                        <Box w="100%" display="flex" justifyContent="center">
                            <Image
                                src={currentPath === "/my-profile" ? "Profile_Active.svg" : "Profile.svg"}
                                alt="ProfileImage"
                                cursor="pointer"
                                onClick={() => navigate("/my-profile")}
                                w="15%"
                            />
                        </Box>
                    </NavTooltip>
                </>
            ) : null}
        </Flex>
    );
}

export default SideNav;
