import { useNavigate } from "react-router-dom";
import { Box, Flex, Image, chakra } from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useThemeStore } from "../utils/ThemeStore";
import { useAppNavigation, type AppNavigationItem } from "./navigation/useAppNavigation";

interface SideNavItemProps {
  item: AppNavigationItem;
  onClick: () => void;
  emphasis?: boolean;
}

function SideNavItem({ item, onClick, emphasis = false }: SideNavItemProps) {
  const Icon = item.Icon;

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
      w={emphasis ? "3.5rem" : "3.25rem"}
      h={emphasis ? "3.5rem" : "3.25rem"}
      borderRadius="control"
      cursor="pointer"
      bg={item.isActive ? "var(--nav-active-bg)" : "transparent"}
      border={emphasis ? "1px solid var(--nav-border)" : "1px solid transparent"}
      transition="background-color 0.2s ease, color 0.2s ease"
      _hover={{ color: "var(--bg-color)", bg: "var(--nav-hover-bg)" }}
      onClick={onClick}
    >
      <Icon size={emphasis ? 27 : 22} aria-hidden="true" />
      {item.hasIndicator && (
        <Box
          pos="absolute"
          top="7px"
          right="7px"
          w="10px"
          h="10px"
          bg="var(--text-color)"
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

export default function SideNav() {
  const navigate = useNavigate();
  const { desktopTopItems, desktopCreateItem, desktopBottomItems } = useAppNavigation();

  return (
    <Flex
      as="aside"
      direction="column"
      align="center"
      className="app-sidebar no-select"
      bg="var(--bg-color)"
      color="var(--text-color)"
      borderRight="1px solid var(--nav-border)"
      transition="background-color 0.3s ease, border-right-color 0.3s ease"
    >
      <Box pt={4} pb={6}>
        <Image
          src="/skillswap_logo_vector.svg"
          alt="Logo"
          w="4.25rem"
          maxW="4.25rem"
          cursor="pointer"
          className="brand-logo"
          onClick={() => navigate("/")}
        />
      </Box>

      <Flex direction="column" align="center" gap={3} flex="1" w="100%">
        {desktopTopItems.map((item) => (
          <SideNavItem key={item.id} item={item} onClick={() => navigate(item.path)} />
        ))}
        {desktopCreateItem && (
          <SideNavItem item={desktopCreateItem} emphasis onClick={() => navigate(desktopCreateItem.path)} />
        )}
      </Flex>

      <Flex direction="column" align="center" gap={3} w="100%" pb={4}>
        {desktopBottomItems.map((item) => (
          <SideNavItem key={item.id} item={item} onClick={() => navigate(item.path)} />
        ))}
        <ThemeToggle />
      </Flex>
    </Flex>
  );
}
