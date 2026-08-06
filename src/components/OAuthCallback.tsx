import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { ROUTE_PATHS } from "../app/router/routeConfig";
import { useAuthSession } from "../app/auth/AuthSessionContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { refresh } = useAuthSession();

  useEffect(() => {
    const resolveCallback = async () => {
      try {
        const snapshot = await refresh({ forceRefresh: true });
        navigate(snapshot.isAuthenticated ? ROUTE_PATHS.myProfile : ROUTE_PATHS.login, { replace: true });
      } catch {
        navigate(ROUTE_PATHS.login, { replace: true });
      }
    };

    void resolveCallback();
  }, [navigate, refresh]);

  return (
    <Box minH="50vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={3}>
        <Spinner color="white" />
        <Text color="white">Validando sesion...</Text>
      </VStack>
    </Box>
  );
}
