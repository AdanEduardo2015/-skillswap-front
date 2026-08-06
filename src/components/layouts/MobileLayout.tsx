import { Flex, Box } from "@chakra-ui/react";
import ComuniRed from "../../ComuniRed";
import Footer from "../Footer";
import NavBar from "../NavBar";
import type { RouteLayoutState } from "../../app/router/routeLayout";

interface LegacyLayoutProps {
  pathsState: RouteLayoutState;
}

/**
 * @deprecated RootLayout is the active layout entry point after Phase 1.
 */
export default function MobileLayout({ pathsState }: LegacyLayoutProps) {
  return (
    <Flex direction="column" minH="100dvh">
      {pathsState.showNavBar && <NavBar />}
      <Box flexGrow={1}>
        <ComuniRed />
      </Box>
      {pathsState.showFooter && <Footer />}
    </Flex>
  );
}
