import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { normalizeRole } from "../../domain/roles";
import { useUserData } from "../../utils/UserStore";
import type { CommentData, CommentsSummary } from "../../types";

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "");

export type CommentSortFilter = "relevant" | "recent" | "all";

export function useCommentActions(
  initialComments: CommentsSummary | undefined,
  publicationId: string,
  onSuccess?: () => void,
  onDeleteSuccess?: () => void
) {
  const [comments, setComments] = useState<CommentData[]>(initialComments?.list ?? []);
  const [totalComments, setTotalComments] = useState(initialComments?.total ?? 0);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sortFilter, setSortFilterState] = useState<CommentSortFilter>("relevant");

  const { name, profilePictureUrl, email, role } = useUserData();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const triggerAuth = (message: string) => {
    setAuthMessage(message);
    setShowAuthModal(true);
  };

  const fetchComments = useCallback(
    async (token: string | null = null, sortOverride?: CommentSortFilter) => {
      setIsLoadingComments(true);
      const activeSort = sortOverride ?? sortFilter;
      try {
        const res = await api.comments.list(publicationId, 20, token, activeSort);
        setComments((prev) => (token ? [...prev, ...res.items] : res.items));
        setHasMore(res.hasMore);
        setNextToken(res.nextToken ?? null);
      } catch (error: unknown) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [publicationId, sortFilter]
  );

  const setSortFilter = useCallback(
    (newSort: CommentSortFilter) => {
      setSortFilterState(newSort);
      void fetchComments(null, newSort);
    },
    [fetchComments]
  );

  useEffect(() => {
    if (publicationId) {
      void fetchComments();
    }
  }, [publicationId, fetchComments]);

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return false;
    setIsCreatingComment(true);

    try {
      const res = await api.comments.create(publicationId, content, parentId);

      if (res.id) {
        const newComm: CommentData = {
          id: res.id,
          publicationId,
          content,
          parentId,
          createdAt: new Date().toISOString(),
          canDelete: true,
          canUpdate: true,
          user: {
            email: email ?? "",
            username: name ?? "Usuario",
            profilePicUrl: profilePictureUrl ?? "/Profile.svg",
            role: normalizeRole(role),
          },
        };

        setComments((prev) => [newComm, ...prev]);
        setTotalComments((prev) => prev + 1);
        onSuccess?.();
        return true;
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes("401")) triggerAuth("Para comentar necesitas iniciar sesion en Comunired.");
      else if (message.includes("403")) triggerAuth("Usted esta baneado, no puede comentar.");
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
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? { ...comment, content: newContent } : comment))
      );
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes("401")) triggerAuth("Para editar un comentario necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permiso para editar este comentario.");
    }
    return false;
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.comments.delete(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setTotalComments((prev) => Math.max(0, prev - 1));
      onDeleteSuccess?.();
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes("401")) triggerAuth("Para eliminar un comentario necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permiso para eliminar este comentario.");
      return false;
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.isLiked ?? false;
    const wasDisliked = comment.isDisliked ?? false;
    const previousLikes = comment.likesCount ?? 0;
    const previousDislikes = comment.dislikesCount ?? 0;

    let nextLikes = previousLikes;
    let nextDislikes = previousDislikes;

    if (wasLiked) {
      nextLikes = Math.max(0, nextLikes - 1);
    } else {
      nextLikes = nextLikes + 1;
      if (wasDisliked) {
        nextDislikes = Math.max(0, nextDislikes - 1);
      }
    }

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !wasLiked,
              isDisliked: wasLiked ? wasDisliked : false,
              likesCount: nextLikes,
              dislikesCount: nextDislikes,
            }
          : c
      )
    );

    try {
      if (wasLiked) {
        await api.comments.unlike(commentId);
      } else {
        await api.comments.like(commentId);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: wasLiked,
                isDisliked: wasDisliked,
                likesCount: previousLikes,
                dislikesCount: previousDislikes,
              }
            : c
        )
      );

      if (message.includes("401")) triggerAuth("Para dar me gusta a un comentario necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permisos o estas baneado.");
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.isLiked ?? false;
    const wasDisliked = comment.isDisliked ?? false;
    const previousLikes = comment.likesCount ?? 0;
    const previousDislikes = comment.dislikesCount ?? 0;

    let nextLikes = previousLikes;
    let nextDislikes = previousDislikes;

    if (wasDisliked) {
      nextDislikes = Math.max(0, nextDislikes - 1);
    } else {
      nextDislikes = nextDislikes + 1;
      if (wasLiked) {
        nextLikes = Math.max(0, nextLikes - 1);
      }
    }

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isDisliked: !wasDisliked,
              isLiked: wasDisliked ? wasLiked : false,
              likesCount: nextLikes,
              dislikesCount: nextDislikes,
            }
          : c
      )
    );

    try {
      if (wasDisliked) {
        await api.comments.undislike(commentId);
      } else {
        await api.comments.dislike(commentId);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: wasLiked,
                isDisliked: wasDisliked,
                likesCount: previousLikes,
                dislikesCount: previousDislikes,
              }
            : c
        )
      );

      if (message.includes("401"))
        triggerAuth("Para dar no me gusta a un comentario necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permisos o estas baneado.");
    }
  };

  return {
    sortFilter,
    setSortFilter,
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
    handleDeleteComment,
    handleLikeComment,
    handleDislikeComment,
  };
}
