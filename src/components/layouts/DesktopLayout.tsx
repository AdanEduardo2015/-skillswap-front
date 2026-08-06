import { Box, Flex } from "@chakra-ui/react";
import ComuniRed from "../../ComuniRed";
import type { RouteLayoutState } from "../../app/router/routeLayout";

interface LegacyLayoutProps {
  pathsState: RouteLayoutState;
}

/**
 * @deprecated RootLayout is the active layout entry point after Phase 1.
 */
export default function DesktopLayout({ pathsState }: LegacyLayoutProps) {
  if (pathsState.showLogoOnly) {
    return <DesktopLogoOnlyLayout />;
  }

  return <DesktopFullLayout />;
}

function DesktopFullLayout() {
  return (
    <Flex minH="100vh">
      <Box flexGrow={1} w="100%">
        <ComuniRed />
      </Box>
    </Flex>
  );
}

function DesktopLogoOnlyLayout() {
  return (
    <Flex direction="column" minH="100vh">
      <Box flexGrow={1}>
        <ComuniRed />
      </Box>
    </Flex>
  );
}
