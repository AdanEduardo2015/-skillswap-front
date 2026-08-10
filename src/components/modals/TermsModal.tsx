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
      title="Reglamento de la Comunidad y Términos de Uso"
      size="2xl"
      footer={
        <AppButton w="100%" onClick={onClose}>
          Entendido
        </AppButton>
      }
    >
      <Box
        maxH="65vh"
        overflowY="auto"
        p={4}
        textAlign="left"
        bg="var(--surface-muted)"
        borderRadius="md"
        border="1px solid var(--card-border)"
      >
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="var(--text-muted)">
            Última actualización: 06 de agosto de 2026
          </Text>

          <Text fontSize="sm">
            Bienvenido a SkillSwap, una plataforma de intercambio de conocimiento mediante videos educativos, diseñada para que estudiantes, docentes, profesionales y cualquier persona interesada en aprender puedan compartir conocimientos con una comunidad enfocada en la educación.
            <br /><br />
            Nuestra misión es ofrecer un espacio seguro, respetuoso y colaborativo donde el aprendizaje sea el principal objetivo.
            Al crear una cuenta o utilizar SkillSwap, el usuario acepta cumplir con este Reglamento de la Comunidad y los presentes Términos de Uso.
          </Text>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              1. Objetivo de SkillSwap
            </Heading>
            <Text fontSize="sm" mb={2}>
              SkillSwap tiene como finalidad facilitar el intercambio de conocimientos mediante videos educativos, promoviendo el aprendizaje colaborativo entre estudiantes, docentes, profesionales y cualquier persona interesada en compartir sus conocimientos.
            </Text>
            <Text fontSize="sm" mb={2}>
              Actualmente, SkillSwap permite exclusivamente la publicación de videos con fines educativos. No se admite la publicación de imágenes, publicaciones de texto, archivos u otros formatos de contenido.
            </Text>
            <Text fontSize="sm" mb={2}>
              Los videos podrán abordar diversas áreas del conocimiento, entre ellas:
            </Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Matemáticas.</li>
                <li>Ciencias.</li>
                <li>Tecnología.</li>
                <li>Programación.</li>
                <li>Inteligencia Artificial.</li>
                <li>Ingeniería.</li>
                <li>Historia.</li>
                <li>Geografía.</li>
                <li>Física.</li>
                <li>Química.</li>
                <li>Idiomas.</li>
                <li>Literatura.</li>
                <li>Arte.</li>
                <li>Diseño.</li>
                <li>Educación financiera.</li>
                <li>Tutoriales.</li>
                <li>Cursos.</li>
                <li>Explicaciones académicas.</li>
                <li>Cualquier otro tema cuyo propósito principal sea educativo.</li>
              </ul>
            </Box>
            <Text fontSize="sm">
              SkillSwap no es una plataforma destinada al entretenimiento ni a la difusión de contenido ajeno al ámbito educativo.
            </Text>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              2. Principios de la Comunidad
            </Heading>
            <Text fontSize="sm" mb={2}>
              Todos los miembros de SkillSwap deben contribuir a mantener una comunidad basada en:
            </Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>El respeto entre usuarios.</li>
                <li>La colaboración.</li>
                <li>El aprendizaje.</li>
                <li>La honestidad.</li>
                <li>La responsabilidad.</li>
                <li>El intercambio de conocimientos.</li>
              </ul>
            </Box>
            <Text fontSize="sm">
              Toda interacción dentro de SkillSwap deberá realizarse de forma respetuosa y con un lenguaje apropiado.
            </Text>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              3. Contenido Permitido
            </Heading>
            <Text fontSize="sm" mb={2}>
              Los usuarios podrán publicar únicamente videos educativos que aporten conocimiento o favorezcan el aprendizaje de la comunidad.
            </Text>
            <Text fontSize="sm" mb={2}>
              Entre los contenidos permitidos se incluyen:
            </Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Tutoriales paso a paso.</li>
                <li>Clases grabadas.</li>
                <li>Explicaciones de temas académicos.</li>
                <li>Resolución de ejercicios.</li>
                <li>Demostraciones prácticas.</li>
                <li>Experimentos científicos con fines educativos.</li>
                <li>Programación y desarrollo de software.</li>
                <li>Enseñanza de idiomas.</li>
                <li>Consejos de estudio.</li>
                <li>Educación financiera.</li>
                <li>Contenido tecnológico.</li>
                <li>Contenido científico.</li>
                <li>Material audiovisual relacionado con cualquier disciplina educativa.</li>
              </ul>
            </Box>
            <Text fontSize="sm" mb={2}>
              Todos los videos deberán cumplir con las siguientes condiciones:
            </Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Tener una finalidad educativa o formativa.</li>
                <li>Respetar las Normas de la Comunidad.</li>
                <li>No contener material prohibido.</li>
                <li>No infringir derechos de autor ni derechos de terceros.</li>
                <li>Mantener un lenguaje respetuoso y apropiado para toda la comunidad.</li>
              </ul>
            </Box>
            <Text fontSize="sm">
              Cualquier video cuyo propósito principal sea el entretenimiento o que incumpla este reglamento podrá ser eliminado por el equipo de administración de SkillSwap.
            </Text>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              4. Contenido Prohibido
            </Heading>
            <Text fontSize="sm" mb={2}>
              Con el objetivo de proteger a la comunidad, queda estrictamente prohibido publicar, compartir o difundir cualquiera de los siguientes contenidos.
            </Text>
            <Heading as="h4" size="xs" mt={3} mb={1}>4.1 Contenido Gore o Violento</Heading>
            <Text fontSize="sm" mb={2}>SkillSwap prohíbe completamente la publicación de:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Gore.</li>
                <li>Sangre explícita.</li>
                <li>Mutilaciones.</li>
                <li>Tortura.</li>
                <li>Cadáveres.</li>
                <li>Accidentes con imágenes o videos impactantes.</li>
                <li>Violencia extrema o gráfica.</li>
              </ul>
            </Box>

            <Heading as="h4" size="xs" mt={3} mb={1}>4.2 Contenido para Adultos (+18)</Heading>
            <Text fontSize="sm" mb={2}>No está permitido publicar:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Pornografía.</li>
                <li>Desnudos.</li>
                <li>Material sexual.</li>
                <li>Contenido erótico.</li>
                <li>Enlaces a sitios para adultos.</li>
                <li>Solicitudes o intercambio de contenido íntimo.</li>
              </ul>
            </Box>
            <Text fontSize="sm" mb={2}>SkillSwap es una plataforma educativa y este tipo de contenido está estrictamente prohibido.</Text>

            <Heading as="h4" size="xs" mt={3} mb={1}>4.3 Acoso y Falta de Respeto</Heading>
            <Text fontSize="sm" mb={2}>Se prohíbe:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Insultar.</li>
                <li>Amenazar.</li>
                <li>Hostigar.</li>
                <li>Burlarse de otros usuarios.</li>
                <li>Discriminar por cualquier motivo.</li>
                <li>Difundir discursos de odio.</li>
              </ul>
            </Box>

            <Heading as="h4" size="xs" mt={3} mb={1}>4.4 Spam</Heading>
            <Text fontSize="sm" mb={2}>No se permite:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Publicidad masiva.</li>
                <li>Publicaciones repetidas.</li>
                <li>Mensajes automatizados.</li>
                <li>Promoción no autorizada.</li>
                <li>Enlaces engañosos o maliciosos.</li>
              </ul>
            </Box>

            <Heading as="h4" size="xs" mt={3} mb={1}>4.5 Información Engañosa</Heading>
            <Text fontSize="sm" mb={2}>
              Está prohibido compartir contenido falso o manipulado con la intención de engañar a la comunidad o afectar el propósito educativo de SkillSwap.
            </Text>

            <Heading as="h4" size="xs" mt={3} mb={1}>4.6 Actividades Ilegales</Heading>
            <Text fontSize="sm" mb={2}>No está permitido publicar contenido relacionado con:</Text>
            <Box pl={4} fontSize="sm">
              <ul>
                <li>Fraudes.</li>
                <li>Estafas.</li>
                <li>Piratería.</li>
                <li>Malware.</li>
                <li>Venta de cuentas.</li>
                <li>Suplantación de identidad.</li>
                <li>Cualquier actividad que infrinja la legislación vigente.</li>
              </ul>
            </Box>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              5. Sistema de Reportes
            </Heading>
            <Text fontSize="sm">
              Todos los usuarios podrán reportar videos que consideren que incumplen las Normas de la Comunidad de SkillSwap.
              Cada reporte será revisado por el equipo de administración antes de aplicar cualquier medida disciplinaria.
              El envío de un reporte no garantiza automáticamente que el contenido sea eliminado, ya que cada caso será analizado individualmente.
            </Text>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              6. Sistema Progresivo de Sanciones
            </Heading>
            <Text fontSize="sm" mb={2}>
              Con el objetivo de mantener una comunidad segura y enfocada en la educación, SkillSwap aplica un sistema de sanciones progresivas.
              Las sanciones se determinarán considerando la gravedad de la infracción y los antecedentes del usuario.
            </Text>

            <Heading as="h4" size="xs" mt={3} mb={1}>6.1 Restricción de Contenido</Heading>
            <Text fontSize="sm" mb={2}>La Restricción de Contenido se aplicará cuando un video incumpla las Normas de la Comunidad. Al aplicarse esta sanción:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>El video será eliminado de SkillSwap.</li>
                <li>El contenido dejará de estar visible para los demás usuarios.</li>
                <li>El creador recibirá una notificación indicando el motivo de la sanción.</li>
                <li>El usuario podrá presentar una apelación para solicitar una revisión.</li>
              </ul>
            </Box>
            <Text fontSize="sm" mb={2}>
              <strong>Acumulación de sanciones:</strong> Cuando un usuario acumule tres (3) Restricciones de Contenido confirmadas, se le impondrá automáticamente un Baneo Temporal.
            </Text>

            <Heading as="h4" size="xs" mt={3} mb={1}>6.2 Baneo Temporal</Heading>
            <Text fontSize="sm" mb={2}>El Baneo Temporal tendrá una duración de cinco (5) días naturales. Durante este periodo el usuario no podrá:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>Publicar videos.</li>
                <li>Comentar videos.</li>
                <li>Dar "Me gusta" o "No me gusta" a los videos.</li>
                <li>Compartir videos.</li>
                <li>Interactuar con otros usuarios mediante las funciones disponibles en SkillSwap.</li>
              </ul>
            </Box>
            <Text fontSize="sm" mb={2}>El usuario únicamente podrá acceder a su cuenta para consultar el motivo de la sanción y presentar una apelación.</Text>
            <Text fontSize="sm" mb={2}>
              <strong>Acumulación de sanciones:</strong> Cuando un usuario acumule tres (3) Baneos Temporales confirmados, se aplicará un Baneo Permanente.
            </Text>

            <Heading as="h4" size="xs" mt={3} mb={1}>6.3 Baneo Permanente</Heading>
            <Text fontSize="sm" mb={2}>El Baneo Permanente constituye la sanción más grave dentro de SkillSwap. Esta medida implica:</Text>
            <Box pl={4} fontSize="sm" mb={2}>
              <ul>
                <li>La eliminación definitiva de la cuenta.</li>
                <li>La pérdida permanente del acceso a SkillSwap.</li>
                <li>La imposibilidad de recuperar la cuenta una vez confirmada la sanción.</li>
              </ul>
            </Box>
            <Text fontSize="sm" mb={2}>
              Asimismo, SkillSwap podrá aplicar un Baneo Permanente de forma inmediata, sin necesidad de cumplir el sistema progresivo de sanciones, cuando el usuario incurra en infracciones de extrema gravedad, tales como:
            </Text>
            <Box pl={4} fontSize="sm">
              <ul>
                <li>Publicar contenido pornográfico o sexual explícito.</li>
                <li>Publicar contenido gore o violencia extrema.</li>
                <li>Suplantar la identidad de otra persona.</li>
                <li>Participar en actividades fraudulentas o ilegales.</li>
                <li>Distribuir malware o software malicioso.</li>
                <li>Intentar comprometer la seguridad o el funcionamiento de SkillSwap.</li>
              </ul>
            </Box>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              7. Derecho de Apelación
            </Heading>
            <Text fontSize="sm">
              Todo usuario sancionado tendrá derecho a presentar una apelación cuando considere que la decisión fue incorrecta.
              La apelación deberá incluir una explicación clara de los hechos y será revisada por el equipo de administración de SkillSwap.
              Una vez concluida la revisión, la administración podrá:
              <br /><br />
              • Mantener la sanción.<br />
              • Reducir la sanción.<br />
              • Revocar la sanción.<br /><br />
              La resolución emitida será definitiva.
            </Text>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              8. Responsabilidad del Usuario
            </Heading>
            <Text fontSize="sm">
              Cada usuario es responsable del contenido que publica en SkillSwap. Al utilizar la plataforma, el usuario declara que:
            </Text>
            <Box pl={4} fontSize="sm" mt={2}>
              <ul>
                <li>Es titular del contenido publicado o cuenta con los permisos necesarios para compartirlo.</li>
                <li>No infringe derechos de autor ni derechos de terceros.</li>
                <li>No vulnera la privacidad de otras personas.</li>
                <li>Cumple con este Reglamento de la Comunidad y los Términos de Uso.</li>
              </ul>
            </Box>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              9. Actualización del Reglamento
            </Heading>
            <Text fontSize="sm">
              SkillSwap podrá modificar este Reglamento de la Comunidad y los Términos de Uso cuando resulte necesario para mejorar la seguridad, el funcionamiento de la plataforma o adaptarse a cambios legales.
              Las modificaciones serán publicadas dentro de SkillSwap antes de su entrada en vigor.
            </Text>
          </Box>

          <Box>
            <Heading as="h3" size="sm" mb={2}>
              10. Aceptación de los Términos
            </Heading>
            <Text fontSize="sm">
              Al crear una cuenta y utilizar SkillSwap, el usuario declara haber leído, comprendido y aceptado íntegramente este Reglamento de la Comunidad y los presentes Términos de Uso.
              El incumplimiento de cualquiera de las normas aquí establecidas podrá dar lugar a la aplicación de las sanciones correspondientes, con el propósito de preservar un entorno seguro, respetuoso y enfocado en el aprendizaje para todos los miembros de la comunidad de SkillSwap.
            </Text>
          </Box>

        </VStack>
      </Box>
    </AppModal>
  );
}
