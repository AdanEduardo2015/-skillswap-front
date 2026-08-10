import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { AppModal } from "../../shared/ui";
import { AppButton } from "../../shared/ui";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reglamento SkillSwap"
      size="xl"
      footer={
        <AppButton w="100%" onClick={onClose}>
          Entendido
        </AppButton>
      }
    >
      <Box
        maxH="60vh"
        overflowY="auto"
        p={4}
        textAlign="left"
        bg="var(--surface-muted)"
        borderRadius="md"
        border="1px solid var(--card-border)"
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              1. Objetivo de SkillSwap
            </Heading>
            <Text fontSize="sm">
              SkillSwap permite exclusivamente la publicación de videos con fines educativos. No se admite la publicación de imágenes, textos u otros formatos que no sean video con propósito de enseñanza.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              2. Principios de la Comunidad
            </Heading>
            <Text fontSize="sm">
              Todos los miembros deben basarse en el respeto, colaboración, honestidad, responsabilidad y el intercambio de conocimientos.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              3. Contenido Permitido
            </Heading>
            <Text fontSize="sm">
              Solo videos educativos que aporten conocimiento: tutoriales, clases grabadas, experimentos, programación, idiomas, etc.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              4. Contenido Prohibido
            </Heading>
            <Text fontSize="sm">
              - Gore o violencia gráfica.<br />
              - Contenido para Adultos (+18).<br />
              - Acoso, odio y falta de respeto.<br />
              - Spam y promoción no autorizada.<br />
              - Fraudes o actividades ilegales.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              5. Sistema de Reportes
            </Heading>
            <Text fontSize="sm">
              Los usuarios pueden reportar contenido. Cada reporte es analizado individualmente por la administración.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              6. Sistema Progresivo de Sanciones
            </Heading>
            <Text fontSize="sm">
              <strong>Restricción de Contenido:</strong> Eliminación del video.<br />
              <strong>Baneo Temporal (5 días):</strong> Tras 3 restricciones. Impide publicar o interactuar.<br />
              <strong>Baneo Permanente:</strong> Tras 3 baneos temporales o por infracciones graves.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              7. Derecho de Apelación
            </Heading>
            <Text fontSize="sm">
              Todo usuario puede apelar una sanción. La resolución de la administración será definitiva.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              8. Responsabilidad del Usuario
            </Heading>
            <Text fontSize="sm">
              El usuario garantiza tener los permisos para compartir el contenido y respetar derechos de autor.
            </Text>
          </Box>
          <Box>
            <Heading as="h3" size="sm" mb={2}>
              10. Aceptación de los Términos
            </Heading>
            <Text fontSize="sm">
              Al crear una cuenta, el usuario acepta íntegramente este Reglamento. El incumplimiento dará lugar a sanciones.
            </Text>
          </Box>
        </VStack>
      </Box>
    </AppModal>
  );
}
