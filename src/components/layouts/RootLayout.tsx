import { useState } from "react";
import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { signOut } from "aws-amplify/auth";
import AppRoutes from "../../app/router/AppRoutes";
import type { RouteLayoutState } from "../../app/router/routeLayout";
import Footer from "../Footer";
import NavBar from "../NavBar";
import SideNav from "../SideNav";
import { useUserData } from "../../utils/UserStore";
import { AppButton } from "../../shared/ui";

interface RootLayoutProps {
  pathsState: RouteLayoutState;
}

export default function RootLayout({ pathsState }: RootLayoutProps) {
  const { activeSanctions, resetUser } = useUserData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const permanentBan = activeSanctions?.find((s) => s.type === "permanent_ban");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out from banned screen:", err);
    } finally {
      resetUser();
      setIsLoggingOut(false);
      window.location.href = "/";
    }
  };

  if (permanentBan) {
    return (
      <Flex
        w="100vw"
        h="100vh"
        bg="var(--app-bg)"
        justify="center"
        align="center"
        p={4}
        color="var(--text-color)"
      >
        <Box
          bg="var(--surface-bg)"
          border="2px solid"
          borderColor="red.500"
          borderRadius="panel"
          p={8}
          maxW="500px"
          w="100%"
          textAlign="center"
          boxShadow="var(--modal-shadow)"
        >
          <VStack gap={5}>
            <Heading as="h2" size="xl" color="red.500">
              Cuenta Suspendida
            </Heading>
            <Text fontSize="md">
              Tu cuenta ha sido baneada permanentemente por infringir las normas de la comunidad.
            </Text>
            <Box
              w="100%"
              p={4}
              bg="rgba(239, 68, 68, 0.1)"
              borderRadius="control"
              border="1px solid"
              borderColor="red.900"
              textAlign="left"
            >
              <Text fontWeight="bold" mb={1} color="red.400">
                Motivo de la sanción:
              </Text>
              <Text fontSize="sm">{permanentBan.description || "No especificado"}</Text>
            </Box>
            <AppButton
              type="button"
              tone="ghost"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              w="100%"
            >
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </AppButton>
          </VStack>
        </Box>
      </Flex>
    );
  }

  const showSideNav = pathsState.showNavBar && !pathsState.showLogoOnly;
  const showTopNav = pathsState.showNavBar;

  return (
    <Flex minH="100dvh" className="app-shell">
      {showTopNav && <NavBar />}
      {showSideNav && <SideNav />}

      <Box
        className={[
          "app-shell-main",
          showSideNav ? "app-shell-main--with-sidebar" : "",
          showTopNav ? "app-shell-main--with-navbar" : "",
          pathsState.showLogoOnly ? "app-shell-main--with-logo-navbar" : "",
          pathsState.showFooter ? "app-shell-main--with-footer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        flexGrow={1}
        w="100%"
        overflowY="auto"
      >
        <AppRoutes />

        {pathsState.showFooter && <Footer />}
      </Box>
    </Flex>
  );
}
