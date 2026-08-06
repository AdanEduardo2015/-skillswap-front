import { useEffect, useState, type ReactNode } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { Navigate, useNavigate } from "react-router-dom";
import RequireAuthModal from "../../components/modals/RequireAuthModal";
import { AppButton, EmptyState } from "../../shared/ui";
import { useAuthSession } from "../auth/AuthSessionContext";
import { getRouteAccessDecision, type RouteAccessDecision } from "./routeAccess";
import { ROUTE_PATHS, type RouteDefinition } from "./routeConfig";

interface RouteGuardProps {
  routeDefinition: RouteDefinition;
  children: ReactNode;
}

function RouteLoadingState() {
  return (
    <Box minH="50vh" display="flex" alignItems="center" justifyContent="center">
      <Spinner color="white" />
    </Box>
  );
}

function AccessDeniedState({ decision }: { decision: Extract<RouteAccessDecision, { allowed: false }> }) {
  const navigate = useNavigate();
  const isBanned = decision.reason === "banned";

  return (
    <EmptyState
      title={isBanned ? "Cuenta restringida" : "Acceso restringido"}
      description={
        isBanned
          ? "Tu cuenta no puede realizar acciones privadas en este momento."
          : "Tu rol actual no tiene permisos para entrar a esta seccion."
      }
      action={<AppButton onClick={() => navigate(ROUTE_PATHS.home)}>Volver al inicio</AppButton>}
      minH="50vh"
    />
  );
}

export default function RouteGuard({ routeDefinition, children }: RouteGuardProps) {
  const authSession = useAuthSession();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const decision = getRouteAccessDecision(routeDefinition, {
    isAuthenticated: authSession.isAuthenticated,
    role: authSession.role,
  });
  const requiresAuth = !decision.allowed && decision.reason === "requires-auth";

  useEffect(() => {
    setShowAuthModal(requiresAuth);
  }, [requiresAuth]);

  if (authSession.isLoading && routeDefinition.access !== "public") {
    return <RouteLoadingState />;
  }

  if (!decision.allowed && decision.reason === "guest-only") {
    return <Navigate to={decision.redirectTo ?? ROUTE_PATHS.home} replace />;
  }

  if (!decision.allowed && decision.reason === "requires-auth") {
    return (
      <RequireAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          navigate(ROUTE_PATHS.home);
        }}
        message="Esta pagina es exclusiva para usuarios registrados. Inicia sesion para continuar."
      />
    );
  }

  if (!decision.allowed) {
    return <AccessDeniedState decision={decision} />;
  }

  return <>{children}</>;
}
