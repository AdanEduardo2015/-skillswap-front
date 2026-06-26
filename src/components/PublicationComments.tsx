import { useRef, useState, useEffect } from "react";
import { formatFecha } from "../utils/GlobalVariables";
import { useUserData } from "../utils/UserStore";
import { useCommentActions } from "./hooks/CommentActions";
import ConfirmModal from "./modals/ConfirmModal";
import RequireAuthModal from "./modals/RequireAuthModal";
import { Box, Flex, Text, Textarea, Button, Spinner, Image, Link } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function PublicationComments({ publication, showInput, setShowInput, onImageClick, onCommentAdded, onCommentDeleted }: any) {
    const { 
        comments, 
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
        handleDeleteComment 
    } = useCommentActions(publication.comments, publication.id, onCommentAdded, onCommentDeleted);
    const { name, profilePictureUrl, email: globalEmail, role: globalRole } = useUserData();
    const isBannedUser = globalRole === "banned";
    const [newComment, setNewComment] = useState("");
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
    const [isDeletingComment, setIsDeletingComment] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [isEditingComment, setIsEditingComment] = useState(false);

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
        if (!editingContent.trim() || editingContent === comments.find((c: any) => c.id === id)?.content) {
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

    return (
        <Box>
            {showInput && !isBannedUser && (
                <Flex my={3} className={isCreatingComment ? "disabled-form" : ""} userSelect="none">
                    <Box>
                        <Image
                            src={profilePictureUrl ?? "/Profile.svg"}
                            alt={name ?? "Usuario"}
                            cursor="pointer"
                            userSelect="none"
                            borderRadius="full"
                            mr={1}
                            boxSize="1rem"
                            objectFit="cover"
                            onClick={() => onImageClick(profilePictureUrl ?? "/Profile.svg")}
                        />
                    </Box>

                    <Box color="white" flexGrow={1}>
                        <Flex justify="space-between" align="center" mb={2}>
                            <Text userSelect="none">{name ?? "Usuario"}</Text>
                        </Flex>

                        <Textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={e => {
                                setNewComment(e.target.value);
                                autoResize();
                            }}
                            onKeyDown={async e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();

                                    if (!newComment.trim() || isCreatingComment) return;

                                    await submitComment();
                                }
                            }}
                            placeholder="Escribe un comentario..."
                            mb={2}
                            bg="#454545"
                            color="white"
                            borderRadius="0.5rem"
                            borderColor="white"
                            _placeholder={{ color: "gray.400" }}
                            minH="80px"
                            overflow="hidden"
                            resize="none"
                            _focus={{ border: "solid 0.05rem #7e7e7e", boxShadow: "none", outline: "none" }}
                        />

                        <Button
                            bg="white"
                            color="black"
                            width="100%"
                            _hover={{ bg: "gray.200" }}
                            onClick={submitComment}
                            borderRadius="1rem"
                        >
                            {!isCreatingComment
                                ? "Comentar"
                                : (
                                    <Flex justify="center" align="center">
                                        <Text mr={3}>Creando comentario...</Text>
                                        <Spinner size="sm" color="black" />
                                    </Flex>
                                )
                            }
                        </Button>
                    </Box>
                </Flex>
            )}

            {isLoadingComments && comments.length === 0 && (
                <Flex justify="center" my={5}>
                    <Spinner color="white" />
                </Flex>
            )}

            {(!comments || comments.length === 0) && !isLoadingComments && (!showInput || isBannedUser) && (
                <Text as="h4" color="white" textAlign="center" mb={3} fontSize="lg" fontWeight="bold">
                    No hay comentarios en la publicación
                </Text>
            )}

            {comments.map((c: any, index: number) => (
                <Box key={c.id || `comment-${index}`}>
                    <Flex my={3}>
                        <Box>
                            <Image
                                src={c.user?.profilePicUrl ?? "/Profile.svg"}
                                alt={c.user?.username ?? "Usuario"}
                                cursor="pointer"
                                userSelect="none"
                                borderRadius="full"
                                mr={1}
                                boxSize="1rem"
                                objectFit="cover"
                                onClick={() =>
                                    onImageClick(
                                        c.user?.profilePicUrl ??
                                        "/Profile.svg"
                                    )
                                }
                            />
                        </Box>

                        <Box color="white" flexGrow={1}>
                            <Flex justify="space-between" align="center" mb={2}>
                                <Text userSelect="none">
                                    <Link
                                        color="white"
                                        onClick={() => navigate("/profile?user=" + c.user?.email)}
                                        _hover={{ textDecoration: "underline" }}
                                    >
                                        {c.user?.username ?? "Usuario"}
                                    </Link>
                                </Text>
                                <Flex align="center" gap={3} position="relative" ref={showOptionsId === c.id ? optionsRef : null}>
                                    <Text>{formatFecha(c.createdAt)}</Text>
                                    {c.canDelete && !isBannedUser && (
                                        <>
                                            <Image
                                                src="/Show_Options.svg"
                                                alt="Opciones"
                                                cursor="pointer"
                                                filter="invert(0)"
                                                height="1.2rem"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowOptionsId(showOptionsId === c.id ? null : c.id);
                                                }}
                                            />
                                            {showOptionsId === c.id && (
                                                <Flex
                                                    direction="column"
                                                    position="absolute"
                                                    right="0"
                                                    top="100%"
                                                    bg="#2d2d2d"
                                                    borderRadius="md"
                                                    boxShadow="0 4px 12px rgba(0,0,0,0.5)"
                                                    zIndex={10}
                                                    py={2}
                                                    w="150px"
                                                >
                                                    {c.canUpdate && (
                                                        <Flex
                                                            align="center"
                                                            px={4}
                                                            py={2}
                                                            cursor="pointer"
                                                            _hover={{ bg: "#3d3d3d" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowOptionsId(null);
                                                                setEditingCommentId(c.id);
                                                                setEditingContent(c.content);
                                                            }}
                                                        >
                                                            <Image src="/Edit.svg" width="20px" mr={3} alt="Editar" filter="none" />
                                                            <Text fontSize="sm" color="white" fontWeight="bold">Editar</Text>
                                                        </Flex>
                                                    )}
                                                    <Flex
                                                        align="center"
                                                        px={4}
                                                        py={2}
                                                        cursor="pointer"
                                                        _hover={{ bg: "#3d3d3d" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowOptionsId(null);
                                                            openDeleteModal(c.id);
                                                        }}
                                                    >
                                                        <Image src="/Delete.svg" width="20px" mr={3} alt="Eliminar" />
                                                        <Text fontSize="sm" color="red.500" fontWeight="bold">Eliminar</Text>
                                                    </Flex>
                                                </Flex>
                                            )}
                                        </>
                                    )}
                                </Flex>
                            </Flex>

                            {editingCommentId === c.id ? (
                                <Box mb={3} mt={1}>
                                    <Textarea
                                        value={editingContent}
                                        onChange={e => setEditingContent(e.target.value)}
                                        bg="#2d2d2d"
                                        color="white"
                                        borderRadius="0.5rem"
                                        borderColor="transparent"
                                        _focus={{ borderColor: "gray.400", boxShadow: "none", outline: "none" }}
                                        autoFocus
                                        minH="60px"
                                        resize="none"
                                        mb={2}
                                    />
                                    <Flex justify="flex-end" gap={2}>
                                        <Button size="sm" bg="transparent" color="gray.400" _hover={{ color: "white" }} onClick={() => setEditingCommentId(null)} disabled={isEditingComment}>
                                            Cancelar
                                        </Button>
                                        <Button size="sm" bg="white" color="black" _hover={{ opacity: 0.8 }} onClick={() => submitEditComment(c.id)} disabled={isEditingComment}>
                                            {isEditingComment ? <Spinner size="xs" color="black" /> : "Guardar"}
                                        </Button>
                                    </Flex>
                                </Box>
                            ) : (
                                <Text mb={3} whiteSpace="pre-wrap">{c.content}</Text>
                            )}
                        </Box>
                    </Flex>
                    <Box as="hr" borderColor="white" mb={3} m={0} />
                </Box>
            ))
            }

            {hasMore && (
                <Flex justify="center" my={4}>
                    <Button
                        size="sm"
                        variant="ghost"
                        color="white"
                        onClick={() => fetchComments(nextToken)}
                        loading={isLoadingComments}
                        _hover={{ bg: "whiteAlpha.200" }}
                    >
                        Cargar más comentarios
                    </Button>
                </Flex>
            )}
            <ConfirmModal
                isOpen={commentToDeleteId !== null}
                title={
                    commentToDeleteId && comments.find((c: any) => c.id === commentToDeleteId)?.user?.email === globalEmail
                        ? "¿Estás seguro de que deseas eliminar tu comentario?"
                        : "¿Estás seguro de que deseas eliminar el comentario de este usuario?"
                }
                isLoading={isDeletingComment}
                onConfirm={handleConfirmDelete}
                onCancel={() => { commentToDeleteIdRef.current = null; setCommentToDeleteId(null); }}
            />
            <RequireAuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                message={authMessage}
            />
        </Box >
    );
}
