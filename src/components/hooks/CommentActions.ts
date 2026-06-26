import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useUserData } from "../../utils/UserStore";

export function useCommentActions(initialComments: any, publicationId: string, onSuccess?: () => void, onDeleteSuccess?: () => void) {
    const [comments, setComments] = useState(initialComments?.list || []);
    const [totalComments, setTotalComments] = useState(initialComments?.total || 0);
    const [isCreatingComment, setIsCreatingComment] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [nextToken, setNextToken] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const { name, profilePictureUrl } = useUserData();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMessage, setAuthMessage] = useState("");

    const triggerAuth = (message: string) => {
        setAuthMessage(message);
        setShowAuthModal(true);
    };

    const fetchComments = useCallback(async (token: string | null = null) => {
        setIsLoadingComments(true);
        try {
            const res = await api.comments.list(publicationId, 20, token);
            setComments((prev: any[]) => token ? [...prev, ...res.items] : res.items);
            setHasMore(res.hasMore);
            setNextToken(res.nextToken ?? null);
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setIsLoadingComments(false);
        }
    }, [publicationId]);

    useEffect(() => {
        if (publicationId) {
            fetchComments();
        }
    }, [publicationId, fetchComments]);

    const handleAddComment = async (content: string) => {
        if (!content.trim()) return false;
        setIsCreatingComment(true);

        try {
            const res = await api.comments.create(publicationId, content);

            if (res.id) {
                const newComm = {
                    id: res.id,
                    content: content,
                    createdAt: new Date().toISOString(),
                    canDelete: true,
                    user: {
                        username: name ?? "Usuario",
                        profilePicUrl: profilePictureUrl ?? "/Profile.svg"
                    }
                };

                setComments((prev: any[]) => [newComm, ...prev]);
                setTotalComments((prev: number) => prev + 1);
                if (onSuccess) onSuccess();
                return true;
            }
        } catch (err: any) {
            if (err.message.includes("401")) triggerAuth("Para comentar necesitas iniciar sesión en Comunired.");
            else if (err.message.includes("403")) triggerAuth("Usted está baneado, no puede comentar.");
            return false;
        } finally {
            setIsCreatingComment(false);
        }
        return false;
    };

    const handleEditComment = async (commentId: string, newContent: string) => {
        if (!newContent.trim()) return false;

        try {
            await api.comments.edit(commentId, newContent);
            setComments((prev: any[]) => prev.map((c: any) =>
                c.id === commentId ? { ...c, content: newContent } : c
            ));
            return true;
        } catch (err: any) {
            if (err.message.includes("401")) triggerAuth("Para editar un comentario necesitas iniciar sesión.");
            else if (err.message.includes("403")) triggerAuth("No tienes permiso para editar este comentario.");
        }
        return false;
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.comments.delete(commentId);
            setComments((prev: any[]) => prev.filter((c: any) => c.id !== commentId));
            setTotalComments((prev: number) => prev - 1);
            if (onDeleteSuccess) onDeleteSuccess();
            return true;
        } catch (err: any) {
            if (err.message.includes("401")) triggerAuth("Para eliminar un comentario necesitas iniciar sesión.");
            else if (err.message.includes("403")) triggerAuth("No tienes permiso para eliminar este comentario.");
            return false;
        }
    };

    return {
        comments,
        totalComments,
        isCreatingComment,
        isLoadingComments,
        nextToken,
        hasMore,
        fetchComments,
        showAuthModal,
        setShowAuthModal,
        authMessage,
        handleAddComment,
        handleEditComment,
        handleDeleteComment
    };
}
