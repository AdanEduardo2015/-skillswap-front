import { useNavigate } from "react-router-dom";
import { Box, Flex, Image, chakra } from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";
import { paths } from "../utils/GlobalVariables";
import { useThemeStore } from "../utils/ThemeStore";
import { useAppNavigation, type AppNavigationItem } from "./navigation/useAppNavigation";

interface NavItemProps {
  item: AppNavigationItem;
  onClick: () => void;
  variant?: "topbar" | "sidebar";
  emphasis?: boolean;
}

function NavItem({ item, onClick, variant = "topbar", emphasis = false }: NavItemProps) {
  const Icon = item.Icon;
  const isSidebar = variant === "sidebar";

  return (
    <chakra.button
      type="button"
      aria-label={item.label}
      aria-current={item.isActive ? "page" : undefined}
      title={item.label}
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color={item.isActive ? "var(--bg-color)" : "var(--nav-muted)"}
      minW={isSidebar ? (emphasis ? "3.5rem" : "3.25rem") : { base: "2.5rem", md: "3rem" }}
      w={isSidebar ? (emphasis ? "3.5rem" : "3.25rem") : undefined}
      h={isSidebar ? (emphasis ? "3.5rem" : "3.25rem") : { base: "2.5rem", md: "3rem" }}
      borderRadius="control"
      cursor="pointer"
      bg={item.isActive ? "var(--nav-active-bg)" : "transparent"}
      border={emphasis ? "1px solid var(--nav-border)" : "1px solid transparent"}
      transition="background-color 0.2s ease, color 0.2s ease"
      _hover={{ color: "var(--bg-color)", bg: "var(--nav-hover-bg)" }}
      onClick={onClick}
    >
      <Icon size={emphasis ? 27 : isSidebar ? 22 : 20} aria-hidden="true" />
      {item.hasIndicator && (
        <Box
          pos="absolute"
          top="6px"
          right="6px"
          w="10px"
          h="10px"
          bg="#3b82f6"
          borderRadius="full"
          border="2px solid var(--bg-color)"
          animation="pulse-glow 2s infinite"
        />
      )}
    </chakra.button>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const nextThemeLabel = theme === "dark" ? "modo claro" : "modo oscuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Cambiar a ${nextThemeLabel}`}
      title={`Cambiar a ${nextThemeLabel}`}
      aria-pressed={theme === "light"}
    >
      {theme === "dark" ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
    </button>
  );
}

function NavBar() {
  const navigate = useNavigate();
  const { desktopItems, mobileHeaderItems } = useAppNavigation();

  if (!paths.showLogoOnly && !paths.showNavBar) {
    return null;
  }

  if (paths.showLogoOnly) {
    return (
      <Flex
        as="nav"
        align="center"
        gap={3}
        w="100%"
        px={{ base: 3, md: 6 }}
        py={3}
        bg="var(--bg-color)"
        color="var(--text-color)"
        zIndex={10}
        position="sticky"
        top={0}
        borderBottom="none"
        className="app-navbar app-navbar--logo-only no-select"
        transition="background-color 0.3s ease"
      >
        <Image
          src="/skillswap_logo_vector.svg"
          alt="Logo"
          w={{ base: "3.5rem", md: "4.25rem" }}
          maxW="4.25rem"
          className="app-navbar-logo brand-logo"
        />
        <Box className="app-navbar-menu">
          <ThemeToggle />
        </Box>
      </Flex>
    );
  }

  return (
    <>
      <Flex
        as="nav"
        align="center"
        justify="flex-start"
        gap={3}
        w="100%"
        px={3}
        py={3}
        bg="var(--bg-color)"
        color="var(--text-color)"
        zIndex={10}
        position="sticky"
        top={0}
        borderBottom="1px solid var(--nav-border)"
        className="app-navbar app-navbar--mobile no-select"
        transition="background-color 0.3s ease, border-bottom-color 0.3s ease"
      >
        <Image
          src="/skillswap_logo_vector.svg"
          alt="Logo"
          w="3.5rem"
          maxW="3.5rem"
          cursor="pointer"
          className="app-navbar-logo brand-logo"
          onClick={() => navigate("/")}
        />

        <Flex align="center" gap={1} ml="auto" className="app-navbar-menu">
          {mobileHeaderItems.map((item) => (
            <NavItem key={item.id} item={item} onClick={() => navigate(item.path)} />
          ))}
          <ThemeToggle />
        </Flex>
      </Flex>

      <Flex
        as="nav"
        align="center"
        justify="flex-start"
        gap={3}
        w="100%"
        px={6}
        py={3}
        bg="var(--bg-color)"
        color="var(--text-color)"
        zIndex={10}
        position="sticky"
        top={0}
        borderBottom="1px solid var(--nav-border)"
        className="app-navbar app-navbar--desktop no-select"
        transition="background-color 0.3s ease, border-bottom-color 0.3s ease"
      >
        <Image
          src="/skillswap_logo_vector.svg"
          alt="Logo"
          w="4.25rem"
          maxW="4.25rem"
          cursor="pointer"
          className="app-navbar-logo brand-logo"
          onClick={() => navigate("/")}
        />

        <Flex align="center" gap={2} ml="auto" className="app-navbar-menu app-navbar-menu--desktop">
          {desktopItems.map((item) => (
            <NavItem key={item.id} item={item} onClick={() => navigate(item.path)} />
          ))}
          <ThemeToggle />
        </Flex>
      </Flex>
    </>
  );
}

export default NavBar;
