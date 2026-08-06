import { useState, useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { usePublicationActions } from "./hooks/PublicationsActions";
import { useUserData } from "../utils/UserStore";
import { Box, Flex, Text } from "@chakra-ui/react";
import type { Publication, PublicationCardProps } from "../types";
import { AppButton } from "../shared/ui";

import PublicationHeader from "./publication/PublicationHeader";
import PublicationContent from "./publication/PublicationContent";
import PublicationActions from "./publication/PublicationActions";
import ConfirmModal from "./modals/ConfirmModal";
import RequireAuthModal from "./modals/RequireAuthModal";
import EditPublicationModal from "./modals/EditPublicationModal";
import ReportTargetModal from "./modals/ReportTargetModal";
import ShareModal from "./modals/ShareModal";

export default function PublicationCard({
  post: initialPost,
  onImageClick,
  onClickComent,
  onPostDelete,
  isPreview = false,
}: PublicationCardProps) {
  const [post, setPost] = useState<Publication>(initialPost);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const recordedViewPublicationIds = useRef<Set<string>>(new Set());
  const articleTitleId = useId();
  const { email: globalEmail, role: globalRole } = useUserData();
  const isBannedUser = globalRole === "banned";
  const navigate = useNavigate();

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const {
    isLiked,
    likes,
    isDisliked,
    dislikes,
    sharedCount,
    isSaved,
    savedCount,
    isFollowingCreator,
    followersCount,
    showCopied,
    showAuthModal,
    setShowAuthModal,
    authMessage,
    handleLike,
    handleDislike,
    handleShare,
    handleSave,
    handleFollowCreator,
    handleDelete,
  } = usePublicationActions(post);

  const handleCommentClick = () => {
    if (onClickComent) {
      onClickComent();
    } else if (!isPreview && !isBannedUser) {
      navigate(`/publication?post=${post.id}&focusComment=true`);
    }
  };

  const creatorEmail = post.creatorEmail ?? post.userEmail ?? post.user?.email;
  const isCreatorViewingOwnPost = Boolean(
    creatorEmail && globalEmail && creatorEmail.toLowerCase() === globalEmail.toLowerCase()
  );
  const handleVideoPlay = async () => {
    if (isPreview || isBannedUser || !globalEmail || !post.id || !post.videoUrl || isCreatorViewingOwnPost) {
      return;
    }

    const viewKey = `${globalEmail.toLowerCase()}:${post.id}`;
    if (recordedViewPublicationIds.current.has(viewKey)) return;

    recordedViewPublicationIds.current.add(viewKey);

    try {
      const result = await api.publications.recordView(post.id);
      if (!result.counted) return;

      setPost((currentPost) => ({
        ...currentPost,
        viewsCount: result.viewsCount ?? (currentPost.viewsCount ?? 0) + 1,
      }));
    } catch (error) {
      recordedViewPublicationIds.current.delete(viewKey);
      console.error("No se pudo registrar la vista de la publicacion", error);
    }
  };
  const canFollowCreator = Boolean(
    creatorEmail && creatorEmail !== globalEmail && !post.canUpdate && !isPreview
  );
  const canReportPublication = Boolean(
    post.id && globalEmail && !post.canUpdate && !isPreview && !isBannedUser
  );
  const reportTargetLabel = post.title || post.content.slice(0, 80);
  const articleLabel = post.title ? undefined : "Publicacion";
  const displayPost: Publication = {
    ...post,
    isSaved,
    savedCount,
    user: post.user
      ? {
          ...post.user,
          followersCount,
          isFollowed: isFollowingCreator,
        }
      : post.user,
  };

  if (isRemoved) return null;

  return (
    <Box as="article" aria-labelledby={post.title ? articleTitleId : undefined} aria-label={articleLabel}>
      {showCopied && (
        <Box
          position="fixed"
          bottom="90px"
          left="50%"
          transform="translateX(-50%)"
          bg="var(--toast-bg)"
          color="var(--toast-text)"
          px={5}
          py={3}
          borderRadius="xl"
          fontWeight="bold"
          fontSize="sm"
          zIndex={9999}
          boxShadow="var(--modal-shadow)"
          role="status"
          aria-live="polite"
        >
          ✅ URL copiada al portapapeles
        </Box>
      )}

      {toastMessage && (
        <Box
          position="fixed"
          bottom="90px"
          left="50%"
          transform="translateX(-50%)"
          bg="var(--toast-bg)"
          color="var(--toast-text)"
          px={5}
          py={3}
          borderRadius="xl"
          fontWeight="bold"
          fontSize="sm"
          zIndex={9999}
          boxShadow="var(--modal-shadow)"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </Box>
      )}

      <Flex
        my={3}
        userSelect="none"
        onClick={() => !isBannedUser && !isPreview && navigate("/publication?post=" + post.id)}
        alignItems="flex-start"
      >
        <Box color="var(--text-color)" flex="1">
          <PublicationHeader
            post={post}
            isPreview={isPreview}
            onImageClick={onImageClick}
            onShowDeleteModal={() => setShowDeleteModal(true)}
            onShowEditModal={() => setShowEditModal(true)}
          />

          {post.approvalStatus === "pending" && (
            <Box bg="rgba(245, 158, 11, 0.15)" border="1px solid #f59e0b" borderRadius="md" px={3} py={2} mb={3}>
              <Flex align="center" justify="space-between">
                <Text fontSize="xs" fontWeight="bold" color="yellow.400">
                  ⏳ En revisión
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Pendiente de aprobación por un administrador
                </Text>
              </Flex>
            </Box>
          )}

          {post.approvalStatus === "rejected" && (
            <Box bg="rgba(239, 68, 68, 0.15)" border="1px solid #ef4444" borderRadius="md" px={3} py={2} mb={3}>
              <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                <Text fontSize="xs" fontWeight="bold" color="red.400">
                  🚫 Rechazado
                </Text>
                {post.rejectionReason && (
                  <AppButton
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRejectionReason(!showRejectionReason);
                    }}
                  >
                    {showRejectionReason ? "Ocultar explicación" : "Explicación del administrador"}
                  </AppButton>
                )}
              </Flex>
              {showRejectionReason && post.rejectionReason && (
                <Box mt={2} pt={2} borderTop="1px solid rgba(239, 68, 68, 0.3)" fontSize="xs" color="gray.200">
                  <strong>Motivo del rechazo:</strong> {post.rejectionReason}
                </Box>
              )}
            </Box>
          )}

          <PublicationContent
            post={displayPost}
            titleId={post.title ? articleTitleId : undefined}
            onVideoPlay={() => void handleVideoPlay()}
          />

          <PublicationActions
            isLiked={isLiked}
            likes={likes}
            isDisliked={isDisliked}
            dislikes={dislikes}
            commentCount={post.comments?.total ?? post.commentsCount ?? 0}
            sharedCount={sharedCount}
            isSaved={isSaved}
            savedCount={savedCount}
            isFollowingCreator={isFollowingCreator}
            followersCount={followersCount}
            canFollowCreator={canFollowCreator}
            canReport={canReportPublication}
            isPreview={isPreview}
            onLike={handleLike}
            onDislike={handleDislike}
            onComment={handleCommentClick}
            onShare={() => setShowShareModal(true)}
            onSave={handleSave}
            onFollowCreator={handleFollowCreator}
            onReport={() => setShowReportModal(true)}
          />
        </Box>
      </Flex>

      <Box as="hr" borderColor="var(--card-border)" m={0} />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="¿Estás seguro de que deseas eliminar esta publicación?"
        isLoading={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          const wasDeleted = await handleDelete();
          setIsDeleting(false);
          setShowDeleteModal(false);
          if (wasDeleted) {
            setIsRemoved(true);
            onPostDelete?.(post.id);
          }
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

      <ReportTargetModal
        isOpen={showReportModal}
        targetType="publication"
        targetId={post.id}
        targetLabel={reportTargetLabel}
        onClose={() => setShowReportModal(false)}
        onDuplicate={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        onShare={handleShare}
        onShowToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    </Box>
  );
}
