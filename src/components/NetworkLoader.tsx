import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";
import type { PluginListenerHandle } from "@capacitor/core";
import { Flex, Box, Text, Heading } from "@chakra-ui/react";

export default function NetworkLoader() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let networkListener: PluginListenerHandle | undefined;
    let wasOffline = false;

    const checkStatus = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
      if (!status.connected) wasOffline = true;
    };

    const setupListener = async () => {
      networkListener = await Network.addListener("networkStatusChange", (status) => {
        setIsOffline(!status.connected);

        if (!status.connected) {
          wasOffline = true;
        } else if (status.connected && wasOffline) {
          window.location.reload();
        }
      });
    };

    void checkStatus();
    void setupListener();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Flex
      position="fixed"
      inset="0"
      zIndex="999999"
      direction="column"
      justify="center"
      align="center"
      bg="rgba(0, 0, 0, 0.9)"
      backdropFilter="blur(10px)"
      color="white"
      fontFamily='"Outfit", "Inter", sans-serif'
      transition="all 0.3s ease"
    >
      <style>
        {`
          @keyframes spinOffline {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulseOfflineText {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      <Flex direction="column" align="center">
        <Box
          w="60px"
          h="60px"
          border="4px solid rgba(255, 255, 255, 0.1)"
          borderTop="4px solid white"
          borderRadius="full"
          animation="spinOffline 1s linear infinite"
          mb={6}
          boxShadow="0 0 15px rgba(255, 255, 255, 0.2)"
        />

        <Heading fontSize="3xl" fontWeight="700" mb={3} letterSpacing="tight" color="white">
          Sin conexión
        </Heading>

        <Text
          fontSize="md"
          color="gray.400"
          animation="pulseOfflineText 2.5s ease-in-out infinite"
          textAlign="center"
          maxW="320px"
          lineHeight="1.6"
        >
          Verifica tu conexión a Wi-Fi o datos móviles. La aplicación se reanudará automáticamente cuando
          vuelvas a estar en línea.
        </Text>
      </Flex>
    </Flex>
  );
}
