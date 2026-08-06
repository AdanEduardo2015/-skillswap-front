import { Box, Button, Text, Dialog } from "@chakra-ui/react";

export default function PushErrorPrompt({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="center">
      <Dialog.Backdrop bg="rgba(0,0,0,0.85)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="linear-gradient(145deg, #1a1a1a, #111)"
          border="1px solid #333"
          boxShadow="0 20px 60px rgba(0,0,0,0.6)"
          borderRadius="20px"
          p="28px 24px"
          maxW="340px"
          w="100%"
          textAlign="center"
        >
          <Dialog.Body p={0}>
            <Text fontSize="48px" mb={4}>
              ⚠️
            </Text>

            <Text color="white" fontSize="18px" fontWeight="700" mb={2}>
              Error de Notificaciones
            </Text>

            <Text color="#aaa" fontSize="14px" lineHeight="1.5" mb={3}>
              Lo sentimos, hubo un error al configurar las notificaciones en tu dispositivo.
            </Text>

            <Box
              bg="#0d0d0d"
              borderRadius="12px"
              p="14px 16px"
              mb={6}
              textAlign="left"
              border="1px solid #222"
            >
              <Text
                color="#888"
                fontSize="12px"
                mb={2}
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Intenta lo siguiente:
              </Text>
              <Text color="#ccc" fontSize="13px" mb={2} lineHeight="1.4">
                • Borrar el caché de <strong>Servicios de Google Play</strong> o &quot;Servicios del
                Proveedor&quot;.
              </Text>
              <Text color="#ccc" fontSize="13px" mb={2} lineHeight="1.4">
                • Asegurarte de tener conexión a Internet estable.
              </Text>
              <Text color="#ccc" fontSize="13px" lineHeight="1.4">
                • Reiniciar la aplicación e intentarlo más tarde.
              </Text>
            </Box>

            <Button
              w="100%"
              py={3}
              bg="white"
              color="black"
              borderRadius="12px"
              fontSize="15px"
              fontWeight="700"
              onClick={onClose}
              _hover={{ opacity: 0.9 }}
            >
              Entendido
            </Button>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
