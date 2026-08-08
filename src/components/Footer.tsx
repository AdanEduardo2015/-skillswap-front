import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { paths } from "../utils/GlobalVariables";
import { Box, Flex, chakra } from "@chakra-ui/react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useAppNavigation, type AppNavigationItem } from "./navigation/useAppNavigation";
import { useAuthSession } from "../app/auth/AuthSessionContext";
import { normalizeRole } from "../domain/roles";

interface FooterItemProps {
  item: AppNavigationItem;
  onClick: () => void;
}

function FooterItem({ item, onClick }: FooterItemProps) {
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
      w="3rem"
      h="3rem"
      borderRadius="control"
      cursor="pointer"
      bg={item.isActive ? "var(--nav-active-bg)" : "transparent"}
      transition="background-color 0.2s ease, color 0.2s ease"
      _hover={{ color: "var(--bg-color)", bg: "var(--nav-hover-bg)" }}
      onClick={onClick}
    >
      <Icon size={22} aria-hidden="true" />
      {item.hasIndicator && (
        <Box
          pos="absolute"
          top="8px"
          right="8px"
          w="10px"
          h="10px"
          bg="#3b82f6"
          borderRadius="full"
          border="2px solid var(--bg-color)"
          animation="pulse-glow 2s infinite"
        />
      )}
      {item.isActive && (
        <Box
          pos="absolute"
          bottom="4px"
          left="50%"
          w="4px"
          h="4px"
          bg="currentColor"
          borderRadius="full"
          transform="translateX(-50%)"
        />
      )}
    </chakra.button>
  );
}

function Footer() {
  const navigate = useNavigate();
  const { mobileFooterItems, desktopBottomItems } = useAppNavigation();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const authSession = useAuthSession();

  const normalizedRole = authSession.isAuthenticated ? normalizeRole(authSession.role) : "guest";
  const isAdmin = normalizedRole === "admin";

  const adminItems = desktopBottomItems.filter((item) =>
    [
      "admin-reports",
      "admin-sanctions",
      "admin-categories",
      "admin-publications",
      "admin-appeals",
    ].includes(item.id)
  );

  return (
    paths.showFooter && (
      <>
        <Box
          as="footer"
          display={{ base: "block", md: "none" }}
          position="fixed"
          bottom={0}
          left={0}
          borderTop="0.1rem solid var(--nav-border)"
          pt={2}
          pb="max(0.5rem, env(safe-area-inset-bottom))"
          bg="var(--bg-color)"
          color="var(--text-color)"
          textAlign="center"
          zIndex={10}
          userSelect="none"
          w="100%"
          transition="background-color 0.3s ease, border-top-color 0.3s ease"
        >
          <Flex justify="space-evenly" align="center" maxW="32rem" mx="auto" px={2} gap={1}>
            {mobileFooterItems.map((item) => {
              const isProfile = item.id === "profile";
              return (
                <React.Fragment key={item.id}>
                  <FooterItem item={item} onClick={() => navigate(item.path)} />
                  {isProfile && isAdmin && (
                    <chakra.button
                      onClick={() => setIsAdminMenuOpen(true)}
                      type="button"
                      p={2}
                      w="3rem"
                      h="3rem"
                      borderRadius="control"
                      color={isAdminMenuOpen ? "var(--bg-color)" : "var(--nav-muted)"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={isAdminMenuOpen ? "var(--nav-active-bg)" : "transparent"}
                      transition="background-color 0.2s ease, color 0.2s ease"
                      _hover={{ color: "var(--bg-color)", bg: "var(--nav-hover-bg)" }}
                      aria-expanded={isAdminMenuOpen}
                      aria-label="Abrir menú administrador"
                    >
                      <FaBars size={22} aria-hidden="true" />
                    </chakra.button>
                  )}
                </React.Fragment>
              );
            })}
          </Flex>
        </Box>

        {/* Admin Menu Drawer overlay */}
        {isAdmin && isAdminMenuOpen && (
          <Box
            position="fixed"
            top={0}
            left={0}
            w="100vw"
            h="100vh"
            bg="rgba(0, 0, 0, 0.45)"
            backdropFilter="blur(4px)"
            zIndex={100}
            onClick={() => setIsAdminMenuOpen(false)}
          >
            <Box
              position="fixed"
              left="50%"
              bottom="calc(4.75rem + env(safe-area-inset-bottom))"
              w="calc(100vw - 1.5rem)"
              maxW="28rem"
              maxH="min(26rem, calc(100vh - 7rem))"
              bg="var(--bg-color)"
              color="var(--text-color)"
              boxShadow="var(--modal-shadow)"
              zIndex={101}
              transform="translateX(-50%)"
              onClick={(e) => e.stopPropagation()}
              display="flex"
              flexDirection="column"
              p={4}
              border="1px solid var(--nav-border)"
              borderRadius="panel"
            >
              <Flex
                justify="space-between"
                align="center"
                mb={3}
                pb={3}
                borderBottom="1px solid var(--nav-border)"
              >
                <chakra.span fontWeight="bold" fontSize="lg">
                  Panel de Administración
                </chakra.span>
                <chakra.button
                  onClick={() => setIsAdminMenuOpen(false)}
                  p={2}
                  w="2.25rem"
                  h="2.25rem"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="control"
                  _hover={{ bg: "var(--nav-hover-bg)" }}
                  aria-label="Cerrar menú administrador"
                >
                  <FaTimes size={16} aria-hidden="true" />
                </chakra.button>
              </Flex>

              <Box
                display="grid"
                gridTemplateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }}
                gap={2.5}
                overflowY="auto"
                flex={1}
                p={1}
              >
                {adminItems.map((item, index) => {
                  const Icon = item.Icon;
                  const isLastSingle = index === 4;
                  return (
                    <chakra.button
                      key={item.id}
                      onClick={() => {
                        setIsAdminMenuOpen(false);
                        navigate(item.path);
                      }}
                      gridColumn={isLastSingle ? { base: "span 2", sm: "span 1" } : undefined}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      gap={2}
                      p={3}
                      minH="5.5rem"
                      w="100%"
                      borderRadius="control"
                      bg={item.isActive ? "var(--nav-active-bg)" : "var(--surface-elevated)"}
                      color={item.isActive ? "var(--bg-color)" : "var(--text-color)"}
                      border="1px solid"
                      borderColor={item.isActive ? "var(--nav-active)" : "var(--card-border)"}
                      _hover={{ bg: "var(--nav-hover-bg)", color: "var(--bg-color)", transform: "translateY(-1px)" }}
                      textAlign="center"
                      transition="all 0.2s ease"
                    >
                      <Icon size={24} aria-hidden="true" />
                      <chakra.span fontWeight="medium" fontSize="sm" lineHeight="1.2">
                        {item.label}
                      </chakra.span>
                    </chakra.button>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </>
    )
  );
}

export default Footer;
