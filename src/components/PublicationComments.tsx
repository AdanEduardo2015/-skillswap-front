import { useRef, useState, useEffect } from "react";
import { formatFecha } from "../utils/GlobalVariables";
import { useUserData } from "../utils/UserStore";
import { useCommentActions } from "./hooks/CommentActions";
import ConfirmModal from "./modals/ConfirmModal";
import RequireAuthModal from "./modals/RequireAuthModal";
import { Box, Flex, Text, Textarea, Button, Spinner, Image, Link, chakra } from "@chakra-ui/react";
import { FaThumbsUp, FaRegThumbsUp, FaThumbsDown, FaRegThumbsDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { type PublicationCommentsProps, type CommentData } from "../types";

export default function PublicationComments({
  publication,
  showInput,
  setShowInput,
  onImageClick,
  onCommentAdded,
  onCommentDeleted,
}: PublicationCommentsProps) {
  const {
    sortFilter,
    setSortFilter,
    comments,
    totalComments,
    isCreatingComment,
    isLoadingComments,
    hasMore,
    nextToken,
    fetchComments,
    showAuthModal,
    setShowAuthModal,
    authMessage,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    handleLikeComment,
    handleDislikeComment,
  } = useCommentActions(publication.comments, publication.id, onCommentAdded, onCommentDeleted);
  const { name, profilePictureUrl, email: globalEmail, role: globalRole } = useUserData();
  const isBannedUser = globalRole === "banned";
  const [newComment, setNewComment] = useState("");
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);

  const commentToDeleteIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptionsId(null);
      }
    };
    if (showOptionsId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptionsId]);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const submitComment = async () => {
    const success = await handleAddComment(newComment);
    if (success) {
      setNewComment("");
    }
    setShowInput(false);
  };

  const submitReply = async (parentId: string) => {
    if (!replyContent.trim() || isCreatingComment) return;
    const success = await handleAddComment(replyContent, parentId);
    if (success) {
      setReplyContent("");
      setReplyingToId(null);
    }
  };

  const openDeleteModal = (id: string) => {
    commentToDeleteIdRef.current = id;
    setCommentToDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    const id = commentToDeleteIdRef.current;
    if (!id) return;
    setIsDeletingComment(true);
    await handleDeleteComment(id);
    setIsDeletingComment(false);
    commentToDeleteIdRef.current = null;
    setCommentToDeleteId(null);
  };

  const submitEditComment = async (id: string) => {
    if (
      !editingContent.trim() ||
      editingContent === comments.find((c: CommentData) => c.id === id)?.content
    ) {
      setEditingCommentId(null);
      return;
    }
    setIsEditingComment(true);
    const success = await handleEditComment(id, editingContent);
    setIsEditingComment(false);
    if (success) {
      setEditingCommentId(null);
      setEditingContent("");
    }
  };

  const topLevelComments = comments.filter((c: CommentData) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c: CommentData) => c.parentId === parentId);

  const renderComment = (c: CommentData, isReply: boolean = false) => (
    <Box key={c.id} mb={4} ml={isReply ? 8 : 0}>
      <Flex align="flex-start" gap={2}>
        <Image
          src={c.user?.profilePicUrl ?? "/Profile.svg"}
          alt={c.user?.username ?? "Usuario"}
          cursor="pointer"
          userSelect="none"
          borderRadius="full"
          boxSize={isReply ? "24px" : "32px"}
          objectFit="cover"
          mt={1}
          onClick={() => onImageClick(c.user?.profilePicUrl ?? "/Profile.svg")}
        />

        <Box flex="1">
          <Flex align="center" gap={2} wrap="wrap">
            <Box
              bg="var(--surface-muted)"
              borderRadius="2xl"
              px={4}
              py={2}
              maxW="fit-content"
              color="var(--text-color)"
            >
              <Text fontWeight="bold" fontSize={isReply ? "xs" : "sm"} mb={0.5}>
                <Link
                  color="var(--text-color)"
                  onClick={() => navigate("/profile?user=" + c.user?.email)}
                  _hover={{ textDecoration: "underline", color: "var(--text-color)" }}
                >
                  {c.user?.username ?? "Usuario"}
                </Link>
              </Text>
              {editingCommentId === c.id ? (
                <Box mt={1} minW="200px">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    bg="var(--input-bg)"
                    color="var(--input-text)"
                    borderRadius="md"
                    borderColor="transparent"
                    _focus={{ borderColor: "var(--input-focus-border)", boxShadow: "none" }}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    minH="60px"
                    resize="none"
                    maxLength={300}
                    mb={2}
                    size="sm"
                  />
                  <Flex justify="flex-end" gap={2}>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="var(--text-muted)"
                      _hover={{ color: "var(--text-color)" }}
                      onClick={() => setEditingCommentId(null)}
                      disabled={isEditingComment}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="xs"
                      bg="var(--button-bg)"
                      color="var(--button-text)"
                      _hover={{ bg: "var(--button-hover-bg)" }}
                      onClick={() => submitEditComment(c.id)}
                      disabled={isEditingComment}
                    >
                      {isEditingComment ? <Spinner size="xs" color="var(--button-text)" /> : "Guardar"}
                    </Button>
                  </Flex>
                </Box>
              ) : (
                <Text fontSize="sm" whiteSpace="pre-wrap" color="var(--text-color)">
                  {c.content}
                </Text>
              )}
            </Box>

            {(c.canDelete || globalRole === "admin") && !isBannedUser && (
              <Box position="relative" ref={showOptionsId === c.id ? optionsRef : null}>
                <Image
                  src="/Show_Options.svg"
                  alt="Opciones"
                  cursor="pointer"
                  height="1.2rem"
                  opacity={0.6}
                  _hover={{ opacity: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsId(showOptionsId === c.id ? null : c.id);
                  }}
                  style={{ filter: "var(--svg-filter)" }}
                />
                {showOptionsId === c.id && (
                  <Flex
                    position="absolute"
                    top="24px"
                    right="0"
                    bg="var(--surface-bg)"
                    boxShadow="var(--modal-shadow)"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="var(--card-border)"
                    direction="column"
                    zIndex={100}
                    py={1}
                    w="120px"
                  >
                    {(c.canUpdate || globalRole === "admin") && (
                      <Flex
                        className="dropdown-item"
                        align="center"
                        px={3}
                        py={1.5}
                        color="var(--text-color)"
                        cursor="pointer"
                        _hover={{ bg: "var(--ghost-hover-bg)", color: "var(--bg-color)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptionsId(null);
                          setEditingCommentId(c.id);
                          setEditingContent(c.content);
                        }}
                      >
                        <Image
                          src="/Edit.svg"
                          width="16px"
                          mr={2}
                          alt="Editar"
                          style={{ filter: "var(--svg-filter)" }}
                        />
                        <Text fontSize="xs" color="inherit" fontWeight="bold">
                          Editar
                        </Text>
                      </Flex>
                    )}
                    <Flex
                      className="dropdown-item"
                      align="center"
                      px={3}
                      py={1.5}
                      color="red.500"
                      cursor="pointer"
                      _hover={{ bg: "var(--ghost-hover-bg)", color: "var(--bg-color)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsId(null);
                        openDeleteModal(c.id);
                      }}
                    >
                      <Image src="/Delete.svg" width="16px" mr={2} alt="Eliminar" />
                      <Text fontSize="xs" color="inherit" fontWeight="bold">
                        Eliminar
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Box>
            )}
          </Flex>

          <Flex align="center" gap={2} mt={1} ml={2}>
            <chakra.button
              type="button"
              display="flex"
              alignItems="center"
              gap={1}
              color="var(--text-color)"
              fontSize="xs"
              fontWeight="semibold"
              px={2}
              py={1}
              borderRadius="md"
              _hover={{ bg: "var(--ghost-hover-bg)" }}
              opacity={isBannedUser ? 0.5 : 1}
              cursor={isBannedUser ? "default" : "pointer"}
              onClick={() => !isBannedUser && handleLikeComment(c.id)}
              aria-label="Like"
            >
              {c.isLiked ? (
                <FaThumbsUp size={14} color="var(--nav-active)" />
              ) : (
                <FaRegThumbsUp size={14} />
              )}
              <Text>{c.likesCount ?? 0}</Text>
            </chakra.button>

            <chakra.button
              type="button"
              display="flex"
              alignItems="center"
              gap={1}
              color="var(--text-color)"
              fontSize="xs"
              fontWeight="semibold"
              px={2}
              py={1}
              borderRadius="md"
              _hover={{ bg: "var(--ghost-hover-bg)" }}
              opacity={isBannedUser ? 0.5 : 1}
              cursor={isBannedUser ? "default" : "pointer"}
              onClick={() => !isBannedUser && handleDislikeComment(c.id)}
              aria-label="Dislike"
            >
              {c.isDisliked ? (
                <FaThumbsDown size={14} color="var(--nav-active)" />
              ) : (
                <FaRegThumbsDown size={14} />
              )}
              <Text>{c.dislikesCount ?? 0}</Text>
            </chakra.button>

            <Text fontSize="xx-small" color="var(--text-subtle)" opacity={0.8} ml={1}>
              •
            </Text>
            <Text fontSize="xs" color="var(--text-subtle)" ml={1}>
              {formatFecha(c.createdAt)}
            </Text>
            
            {!isReply && !isBannedUser && (
              <>
                <Text fontSize="xx-small" color="var(--text-subtle)" opacity={0.8} ml={1}>
                  •
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  color="var(--text-color)"
                  _hover={{ bg: "var(--ghost-hover-bg)" }}
                  onClick={() => {
                    setReplyingToId(replyingToId === c.id ? null : c.id);
                    setReplyContent("");
                  }}
                >
                  Responder
                </Button>
              </>
            )}
          </Flex>

          {replyingToId === c.id && (
            <Flex mt={3} ml={4} gap={2} align="flex-start">
              <Image
                src={profilePictureUrl ?? "/Profile.svg"}
                alt={name ?? "Usuario"}
                borderRadius="full"
                boxSize="24px"
                objectFit="cover"
              />
              <Box flex="1">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  bg="var(--surface-muted)"
                  color="var(--text-color)"
                  borderRadius="2xl"
                  py={2}
                  px={4}
                  minH="40px"
                  maxH="120px"
                  rows={1}
                  resize="none"
                  maxLength={300}
                  borderColor="var(--input-border)"
                  _focus={{ border: "1px solid var(--input-focus-border)", boxShadow: "none", outline: "none" }}
                />
                <Flex justify="flex-end" mt={2} gap={2}>
                  <Button size="xs" variant="ghost" onClick={() => setReplyingToId(null)}>
                    Cancelar
                  </Button>
                  <Button size="xs" bg="var(--button-bg)" color="var(--button-text)" _hover={{ bg: "var(--button-hover-bg)" }} onClick={() => submitReply(c.id)} disabled={!replyContent.trim() || isCreatingComment}>
                    {isCreatingComment ? <Spinner size="xs" color="var(--button-text)" /> : "Publicar"}
                  </Button>
                </Flex>
              </Box>
            </Flex>
          )}

          {!isReply && getReplies(c.id).length > 0 && (
            <Box mt={3}>
              {getReplies(c.id).map((reply) => renderComment(reply, true))}
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );

  return (
    <Box>
      {showInput && !isBannedUser && (
        <Flex my={4} gap={2} align="flex-start" className={isCreatingComment ? "disabled-form" : ""}>
          <Image
            src={profilePictureUrl ?? "/Profile.svg"}
            alt={name ?? "Usuario"}
            cursor="pointer"
            userSelect="none"
            borderRadius="full"
            boxSize="32px"
            objectFit="cover"
            onClick={() => onImageClick(profilePictureUrl ?? "/Profile.svg")}
          />

          <Box flex="1">
            <Flex gap={2} align="flex-end">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  autoResize();
                }}
                placeholder="Escribe un comentario..."
                bg="var(--surface-muted)"
                color="var(--text-color)"
                borderRadius="2xl"
                py={2}
                px={4}
                minH="40px"
                maxH="120px"
                rows={1}
                resize="none"
                maxLength={300}
                borderColor="var(--input-border)"
                _focus={{ border: "1px solid var(--input-focus-border)", boxShadow: "none", outline: "none" }}
                _placeholder={{ color: "var(--text-subtle)" }}
              />

              <Button
                size="sm"
                bg="var(--button-bg)"
                color="var(--button-text)"
                _hover={{ bg: "var(--button-hover-bg)" }}
                onClick={submitComment}
                borderRadius="2xl"
                px={4}
                h="40px"
                disabled={!newComment.trim() || isCreatingComment}
              >
                {isCreatingComment ? <Spinner size="xs" color="var(--button-text)" /> : "Publicar"}
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {isLoadingComments && comments.length === 0 && (
        <Flex justify="center" my={5}>
          <Spinner color="var(--text-color)" />
        </Flex>
      )}

      {(!comments || comments.length === 0) && !isLoadingComments && (!showInput || isBannedUser) && (
        <Text as="h4" color="var(--text-color)" textAlign="center" mb={3} fontSize="lg" fontWeight="bold">
          No hay comentarios en la publicación
        </Text>
      )}

      {/* Facebook-style Comments Filter Selector */}
      {comments && comments.length > 0 && (
        <Flex justify="space-between" align="center" my={3} px={1} wrap="wrap" gap={2}>
          <Text fontSize="xs" fontWeight="bold" color="var(--text-muted)">
            {totalComments > 0 ? `${totalComments} comentarios` : "Comentarios"}
          </Text>

          <Flex align="center" gap={2}>
            <chakra.label htmlFor="comment-sort-filter" fontSize="xs" fontWeight="bold" color="var(--text-muted)">
              Filtro:
            </chakra.label>
            <chakra.select
              id="comment-sort-filter"
              aria-label="Filtro de comentarios"
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value as "relevant" | "recent" | "all")}
              bg="var(--surface-muted)"
              color="var(--text-color)"
              border="1px solid"
              borderColor="var(--input-border)"
              borderRadius="control"
              fontSize="xs"
              fontWeight="semibold"
              py={1}
              px={2}
              minH="32px"
              cursor="pointer"
              _focus={{ borderColor: "var(--input-focus-border)", boxShadow: "none" }}
            >
              <option value="relevant" style={{ background: "var(--surface-bg)", color: "var(--text-color)" }}>
                Más relevantes
              </option>
              <option value="recent" style={{ background: "var(--surface-bg)", color: "var(--text-color)" }}>
                Más recientes
              </option>
              <option value="all" style={{ background: "var(--surface-bg)", color: "var(--text-color)" }}>
                Todos los comentarios
              </option>
            </chakra.select>
          </Flex>
        </Flex>
      )}

      {topLevelComments.map((c: CommentData) => renderComment(c, false))}

      {hasMore && (
        <Flex justify="center" my={4}>
          <Button
            size="sm"
            variant="ghost"
            color="var(--text-color)"
            onClick={() => fetchComments(nextToken)}
            loading={isLoadingComments}
            _hover={{ bg: "var(--ghost-hover-bg)" }}
          >
            Cargar más comentarios
          </Button>
        </Flex>
      )}
      <ConfirmModal
        isOpen={commentToDeleteId !== null}
        title={
          commentToDeleteId &&
          comments.find((c: CommentData) => c.id === commentToDeleteId)?.user?.email === globalEmail
            ? "¿Estás seguro de que deseas eliminar tu comentario?"
            : "¿Estás seguro de que deseas eliminar el comentario de este usuario?"
        }
        isLoading={isDeletingComment}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          commentToDeleteIdRef.current = null;
          setCommentToDeleteId(null);
        }}
      />
      <RequireAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authMessage}
      />
    </Box>
  );
}
