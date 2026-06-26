import { Box, Flex } from "@chakra-ui/react";
import ComuniRed from "../../ComuniRed";
import SideNav from "../SideNav";
import Footer from "../Footer";
import NavBar from "../NavBar";

export default function RootLayout({ isDesktop, pathsState }: any) {
  return (
    <Flex direction="column" minH="100dvh">
      {/* Mobile-only Nav */}
      {!isDesktop && pathsState.showNavBar && <NavBar />}

      <Flex flexGrow={1} minH="0">
        {/* Desktop-only Sidebar */}
        {isDesktop && pathsState.showSideNav && <SideNav />}

        <Box flexGrow={1} w="100%" overflowY="auto">
          <ComuniRed />
        </Box>
      </Flex>

      {/* Mobile-only Footer */}
      {!isDesktop && pathsState.showFooter && <Footer />}
    </Flex>
  );
}
