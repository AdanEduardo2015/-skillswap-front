import { Dialog, Image, Button } from "@chakra-ui/react";

interface Props {
  image: string | null;
  onClose: () => void;
}

export default function ImageModal({ image, onClose }: Props) {
  return (
    <Dialog.Root open={!!image} onOpenChange={(e) => !e.open && onClose()} size="xl" placement="center">
      <Dialog.Backdrop bg="rgba(0,0,0,0.9)" />
      <Dialog.Positioner>
        <Dialog.Content bg="transparent" boxShadow="none" p={0}>
          <Dialog.Body p={0} position="relative" textAlign="center">
            {image && <Image src={image} borderRadius="md" mx="auto" maxH="80vh" objectFit="contain" />}
            <Button
              size="sm"
              pos="absolute"
              top={0}
              right={0}
              m={2}
              borderRadius="full"
              onClick={onClose}
              zIndex={1000}
              bg="gray.100"
              _hover={{ bg: "gray.200" }}
              color="black"
            >
              X
            </Button>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
