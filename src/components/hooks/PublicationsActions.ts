import { useRef, useState } from "react";
import { api } from "../../services/api";

export function usePublicationActions(post: any) {
    const [isLiked, setIsLiked] = useState(
        post?.isLiked ?? false
    );
    const [likes, setLikes] = useState(post.likesCount ?? 0);
    const [sharedCount, setSharedCount] = useState(post.sharesCount ?? 0);

    const shareLock = useRef(false);
    const processingLikes = useRef(false);
    const [showCopied, setShowCopied] = useState(false);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMessage, setAuthMessage] = useState("");

    const triggerAuth = (message: string) => {
        setAuthMessage(message);
        setShowAuthModal(true);
    };

    const handleLike = async () => {
        if (processingLikes.current) return;
        processingLikes.current = true;

        const change = isLiked ? -1 : 1;

        setIsLiked((prev: any) => !prev);
        setLikes((prev: any) => Number(prev) + change);

        try {
            if (isLiked) {
                await api.social.unlike(post.id);
            } else {
                await api.social.like(post.id);
            }
        } catch (err: any) {
            setIsLiked((prev: any) => !prev);
            setLikes((prev: any) => Number(prev) - change);

            if (err.message.includes("401")) triggerAuth("Para dar me gusta a una publicación necesitas iniciar sesión.");
            else if (err.message.includes("403")) triggerAuth("Parece que no tienes permisos o estás baneado.");
        } finally {
            processingLikes.current = false;
        }
    };

    const handleShare = async () => {
        if (shareLock.current) return;
        shareLock.current = true;

        const previousValue = sharedCount;

        setSharedCount((prev: number) => prev + 1);
        navigator.clipboard.writeText(
            "https://comuni-red.com/publication?post=" + post.id
        );
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);

        try {
            await api.social.share(post.id);
        } catch (err: any) {
            setSharedCount(previousValue);
            if (err.message.includes("401") || err.message.includes("403")) {
                triggerAuth("Tu compartido no se ha registrado porque no tienes sesión iniciada, pero aún puedes compartir el enlace.");
            }
        } finally {
            setTimeout(() => {
                shareLock.current = false;
            }, 600);
        }
    };

    const handleDelete = async () => {
        try {
            await api.publications.delete(post.id);
            window.location.reload();
        } catch (err: any) {
            if (err.message.includes("401")) triggerAuth("Para eliminar una publicación necesitas iniciar sesión.");
            else if (err.message.includes("403")) triggerAuth("No tienes permisos para eliminar esta publicación.");
        }
    };

    return {
        isLiked,
        likes,
        sharedCount,
        showCopied,
        showAuthModal,
        setShowAuthModal,
        authMessage,
        handleLike,
        handleShare,
        handleDelete
    };
}
