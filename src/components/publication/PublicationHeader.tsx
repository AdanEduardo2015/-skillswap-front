import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatFecha } from "../../utils/GlobalVariables";
import { useUserData } from "../../utils/UserStore";
import { Flex, Image, Text } from "@chakra-ui/react";
import type { Publication } from "../../types";

interface PublicationHeaderProps {
  post: Publication;
  isPreview: boolean;
  onImageClick: (src: string) => void;
  onShowDeleteModal: () => void;
  onShowEditModal: () => void;
}

const isPlaceholderName = (value?: string | null) => !value || value.trim().toLowerCase() === "usuario";

const usernameFromEmail = (email: string) => {
  const localPart = email.split("@")[0]?.trim();
  return localPart || email;
};

export default function PublicationHeader({
  post,
  isPreview,
  onImageClick,
  onShowDeleteModal,
  onShowEditModal,
}: PublicationHeaderProps) {
  const navigate = useNavigate();
  const { role: globalRole } = useUserData();
  const isBannedUser = globalRole === "banned";
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const authorEmail = post.user?.email || post.authorEmail || post.creatorEmail || post.userEmail || "";
  const rawAuthorName = post.user?.username || post.authorUsername;
  const authorName = !isPlaceholderName(rawAuthorName)
    ? String(rawAuthorName).trim()
    : authorEmail
      ? usernameFromEmail(authorEmail)
      : "Usuario";
  const authorImage =
    post.user?.profilePicUrl || post.user?.profilePicture || post.authorProfilePicture || "/Profile.svg";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions]);

  const openUserProfile = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isPreview) {
      onImageClick(authorImage);
      return;
    }

    if (authorEmail) {
      navigate("/profile?user=" + authorEmail);
    }
  };

  return (
    <Flex justify="space-between" mb={3}>
      <Flex align="center" gap={3}>
        <Image
          src={authorImage}
          cursor="pointer"
          borderRadius="full"
          boxSize="1.5rem"
          alt={authorName ? `Perfil de ${authorName}` : "Perfil de usuario"}
          onClick={openUserProfile}
        />
        <Text
          as="a"
          color="var(--text-color)"
          fontWeight="bold"
          cursor={isPreview ? "default" : "pointer"}
          onClick={openUserProfile}
        >
          {authorName}
        </Text>
      </Flex>
      <Flex align="center" position="relative" ref={optionsRef}>
        <Text
          as="span"
          mr={(post.canDelete || globalRole === "admin") || (post.canUpdate || globalRole === "admin") ? 2 : 3}
          fontSize="sm"
          color="var(--text-subtle)"
        >
          {formatFecha(post.createdAt)}
        </Text>
        {((post.canDelete || globalRole === "admin") || (post.canUpdate || globalRole === "admin")) && !isBannedUser && (
          <>
            <Image
              src="/Show_Options.svg"
              cursor="pointer"
              height="1.2rem"
              alt="Opciones"
              onClick={(e) => {
                e.stopPropagation();
                if (!isPreview || globalRole === "admin") setShowOptions(!showOptions);
              }}
            />
            {showOptions && (!isPreview || globalRole === "admin") && (
              <Flex
                direction="column"
                position="absolute"
                right="0"
                top="100%"
                bg="var(--card-bg)"
                border="1px solid var(--input-border)"
                borderRadius="md"
                boxShadow="var(--modal-shadow)"
                zIndex={10}
                py={2}
                w="150px"
              >
                {(post.canUpdate || globalRole === "admin") && (
                  <Flex
                    align="center"
                    px={4}
                    py={2}
                    cursor={post.approvalStatus === "pending" && globalRole !== "admin" ? "not-allowed" : "pointer"}
                    opacity={post.approvalStatus === "pending" && globalRole !== "admin" ? 0.5 : 1}
                    _hover={{ bg: post.approvalStatus === "pending" && globalRole !== "admin" ? undefined : "var(--ghost-hover-bg)" }}
                    title={post.approvalStatus === "pending" && globalRole !== "admin" ? "No se puede editar mientras está en revisión" : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (post.approvalStatus === "pending" && globalRole !== "admin") return;
                      setShowOptions(false);
                      onShowEditModal();
                    }}
                  >
                    <Image src="/Edit.svg" width="20px" mr={3} alt="Editar" />
                    <Text fontSize="sm" color="var(--text-color)" fontWeight="bold">
                      Editar
                    </Text>
                  </Flex>
                )}
                {(post.canDelete || globalRole === "admin") && (
                  <Flex
                    align="center"
                    px={4}
                    py={2}
                    cursor="pointer"
                    _hover={{ bg: "var(--ghost-hover-bg)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptions(false);
                      onShowDeleteModal();
                    }}
                  >
                    <Image src="/Delete.svg" width="20px" mr={3} alt="Eliminar" />
                    <Text fontSize="sm" color="red.500" fontWeight="bold">
                      Eliminar
                    </Text>
                  </Flex>
                )}
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Flex>
  );
}
