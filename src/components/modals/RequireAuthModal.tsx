import { Box, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import AppButton from "../../shared/ui/AppButton";
import AppModal from "../../shared/ui/AppModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function RequireAuthModal({ isOpen, onClose, message }: Props) {
  const navigate = useNavigate();

  return (
    <AppModal isOpen={isOpen} onClose={onClose}>
      <Box display="flex" justifyContent="center" color="white" fontSize="36px" mb={5} aria-hidden="true">
        <FaLock />
      </Box>

      <Text fontSize="18px" fontWeight="700" mb={3}>
        Se requiere iniciar sesion
      </Text>

      <Text color="var(--text-muted)" fontSize="14px" lineHeight="1.5" mb={6}>
        {message || "Para interactuar con esta publicacion necesitas iniciar sesion en SkillSwap."}
      </Text>

      <Flex direction="column" gap={3}>
        <AppButton
          w="100%"
          onClick={() => {
            onClose();
            navigate("/login");
          }}
        >
          Iniciar sesion
        </AppButton>

        <AppButton tone="ghost" w="100%" onClick={onClose}>
          Seguir navegando
        </AppButton>
      </Flex>
    </AppModal>
  );
}
