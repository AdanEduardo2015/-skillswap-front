import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicationActions } from "./hooks/PublicationsActions";
import { useUserData } from "../utils/UserStore";
import { Box, Flex } from "@chakra-ui/react";
import type { Publication, PublicationCardProps } from "../types";

import PublicationHeader from "./publication/PublicationHeader";
import PublicationContent from "./publication/PublicationContent";
import PublicationActions from "./publication/PublicationActions";
import ConfirmModal from "./modals/ConfirmModal";
import RequireAuthModal from "./modals/RequireAuthModal";
import EditPublicationModal from "./modals/EditPublicationModal";

export default function PublicationCard({ post: initialPost, onImageClick, onClickComent, isPreview = false }: PublicationCardProps) {
    const [post, setPost] = useState<Publication>(initialPost);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { role: globalRole } = useUserData();
    const isBannedUser = globalRole === "banned";
    const navigate = useNavigate();

    useEffect(() => {
        setPost(initialPost);
    }, [initialPost]);

    const { isLiked, likes, sharedCount, showCopied, showAuthModal, setShowAuthModal, authMessage, handleLike, handleShare, handleDelete } =
        usePublicationActions(post);

    return (
        <Box>
            {showCopied && (
                <Box
                    position="fixed"
                    bottom="90px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="white"
                    color="black"
                    px={5}
                    py={3}
                    borderRadius="xl"
                    fontWeight="bold"
                    fontSize="sm"
                    zIndex={9999}
                    boxShadow="0 4px 20px rgba(0,0,0,0.4)"
                >
                    ✅ URL copiada al portapapeles
                </Box>
            )}

            <Flex
                my={3}
                userSelect="none"
                onClick={() => !isBannedUser && !isPreview && navigate("/publication?post=" + post.Id_publicacion)}
                alignItems="flex-start"
            >
                <Box color="white" flex="1">
                    <PublicationHeader
                        post={post}
                        isPreview={isPreview}
                        onImageClick={onImageClick}
                        onShowDeleteModal={() => setShowDeleteModal(true)}
                        onShowEditModal={() => setShowEditModal(true)}
                    />

                    <PublicationContent
                        post={post}
                        onImageClick={onImageClick}
                    />

                    <PublicationActions
                        isLiked={isLiked}
                        likes={likes}
                        commentCount={post.comentarios?.total ?? 0}
                        sharedCount={sharedCount}
                        isPreview={isPreview}
                        onLike={handleLike}
                        onComment={onClickComent}
                        onShare={handleShare}
                    />
                </Box>
            </Flex>

            <Box as="hr" borderColor="gray.600" m={0} />

            <ConfirmModal
                isOpen={showDeleteModal}
                title="¿Estás seguro de que deseas eliminar esta publicación?"
                isLoading={isDeleting}
                onConfirm={async () => {
                    setIsDeleting(true);
                    await handleDelete();
                    setIsDeleting(false);
                    setShowDeleteModal(false);
                }}
                onCancel={() => setShowDeleteModal(false)}
            />

            <RequireAuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                message={authMessage}
            />

            {showEditModal && (
                <EditPublicationModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    post={post}
                    onSuccess={(updatedPost: Publication) => {
                        setPost(updatedPost);
                    }}
                />
            )}
        </Box>
    );
}
