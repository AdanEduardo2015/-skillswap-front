import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import type { Publication } from "../../types";
import { applyCountDelta, calculateOptimisticRatingSummary } from "../../features/social/socialInteractions";
import { useUserData } from "../../utils/UserStore";

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "");

export function usePublicationActions(post: Publication) {
  const { email: globalEmail } = useUserData();
  const [isLiked, setIsLiked] = useState(post?.isLiked ?? false);
  const [likes, setLikes] = useState(post.likesCount ?? 0);
  const [isDisliked, setIsDisliked] = useState(post?.isDisliked ?? false);
  const [dislikes, setDislikes] = useState(post.dislikesCount ?? 0);
  const [sharedCount, setSharedCount] = useState(post.sharesCount ?? 0);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [savedCount, setSavedCount] = useState(post.savedCount ?? 0);
  const [ratingAvg, setRatingAvg] = useState(post.ratingAvg ?? 0);
  const [ratingCount, setRatingCount] = useState(post.ratingCount ?? 0);
  const [userRating, setUserRating] = useState<number | null>(post.userRating ?? null);
  const [isFollowingCreator, setIsFollowingCreator] = useState(
    post.isFollowingCreator ?? post.user?.isFollowed ?? false
  );
  const [followersCount, setFollowersCount] = useState(post.user?.followersCount ?? 0);

  const shareLock = useRef(false);
  const processingLikes = useRef(false);
  const processingSave = useRef(false);
  const processingRating = useRef(false);
  const processingFollow = useRef(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const prevPostRef = useRef(post);

  useEffect(() => {
    const prev = prevPostRef.current;
    prevPostRef.current = post;

    if (prev.id !== post.id) {
      setIsLiked(post?.isLiked ?? false);
      setLikes(post.likesCount ?? 0);
      setIsDisliked(post?.isDisliked ?? false);
      setDislikes(post.dislikesCount ?? 0);
      setSharedCount(post.sharesCount ?? 0);
      setIsSaved(post.isSaved ?? false);
      setSavedCount(post.savedCount ?? 0);
      setRatingAvg(post.ratingAvg ?? 0);
      setRatingCount(post.ratingCount ?? 0);
      setUserRating(post.userRating ?? null);
      setIsFollowingCreator(post.isFollowingCreator ?? post.user?.isFollowed ?? false);
      setFollowersCount(post.user?.followersCount ?? 0);
      return;
    }

    if (post.isLiked !== prev.isLiked) {
      setIsLiked(post.isLiked ?? false);
    }
    if (post.likesCount !== prev.likesCount) {
      setLikes(post.likesCount ?? 0);
    }
    if (post.isDisliked !== prev.isDisliked) {
      setIsDisliked(post.isDisliked ?? false);
    }
    if (post.dislikesCount !== prev.dislikesCount) {
      setDislikes(post.dislikesCount ?? 0);
    }
    if (post.sharesCount !== prev.sharesCount) {
      setSharedCount(post.sharesCount ?? 0);
    }
    if (post.isSaved !== prev.isSaved) {
      setIsSaved(post.isSaved ?? false);
    }
    if (post.savedCount !== prev.savedCount) {
      setSavedCount(post.savedCount ?? 0);
    }
    if (post.ratingAvg !== prev.ratingAvg) {
      setRatingAvg(post.ratingAvg ?? 0);
    }
    if (post.ratingCount !== prev.ratingCount) {
      setRatingCount(post.ratingCount ?? 0);
    }
    if (post.userRating !== prev.userRating) {
      setUserRating(post.userRating ?? null);
    }
    const postFollowing = post.isFollowingCreator ?? post.user?.isFollowed ?? false;
    const prevFollowing = prev.isFollowingCreator ?? prev.user?.isFollowed ?? false;
    if (postFollowing !== prevFollowing) {
      setIsFollowingCreator(postFollowing);
    }
    const postFollowers = post.user?.followersCount ?? 0;
    const prevFollowers = prev.user?.followersCount ?? 0;
    if (postFollowers !== prevFollowers) {
      setFollowersCount(postFollowers);
    }
  }, [post]);

  const triggerAuth = (message: string) => {
    setAuthMessage(message);
    setShowAuthModal(true);
  };

  const handleLike = async () => {
    if (!globalEmail) {
      triggerAuth("Para dar me gusta a una publicación necesitas iniciar sesión.");
      return;
    }
    if (processingLikes.current) return;
    processingLikes.current = true;

    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    const previousLikes = likes;
    const previousDislikes = dislikes;

    if (isLiked) {
      setIsLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikes((prev) => prev + 1);
      if (isDisliked) {
        setIsDisliked(false);
        setDislikes((prev) => Math.max(0, prev - 1));
      }
    }

    try {
      if (wasLiked) {
        await api.social.unlike(post.id);
      } else {
        await api.social.like(post.id);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setIsLiked(wasLiked);
      setLikes(previousLikes);
      setIsDisliked(wasDisliked);
      setDislikes(previousDislikes);

      if (message.includes("401"))
        triggerAuth("Para dar me gusta a una publicacion necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("Parece que no tienes permisos o estas baneado.");
    } finally {
      processingLikes.current = false;
    }
  };

  const handleDislike = async () => {
    if (!globalEmail) {
      triggerAuth("Para dar no me gusta a una publicación necesitas iniciar sesión.");
      return;
    }
    if (processingLikes.current) return;
    processingLikes.current = true;

    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    const previousLikes = likes;
    const previousDislikes = dislikes;

    if (isDisliked) {
      setIsDisliked(false);
      setDislikes((prev) => Math.max(0, prev - 1));
    } else {
      setIsDisliked(true);
      setDislikes((prev) => prev + 1);
      if (isLiked) {
        setIsLiked(false);
        setLikes((prev) => Math.max(0, prev - 1));
      }
    }

    try {
      if (wasDisliked) {
        await api.social.undislike(post.id);
      } else {
        await api.social.dislike(post.id);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setIsLiked(wasLiked);
      setLikes(previousLikes);
      setIsDisliked(wasDisliked);
      setDislikes(previousDislikes);

      if (message.includes("401"))
        triggerAuth("Para dar no me gusta a una publicacion necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("Parece que no tienes permisos o estas baneado.");
    } finally {
      processingLikes.current = false;
    }
  };

  const handleShare = async () => {
    if (shareLock.current) return;
    shareLock.current = true;

    const previousValue = sharedCount;

    setSharedCount((prev) => prev + 1);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);

    try {
      await api.social.share(post.id);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setSharedCount(previousValue);
      if (message.includes("401") || message.includes("403")) {
        triggerAuth(
          "Tu compartido no se ha registrado porque no tienes sesion iniciada, pero aun puedes compartir el enlace."
        );
      }
    } finally {
      setTimeout(() => {
        shareLock.current = false;
      }, 600);
    }
  };

  const handleSave = async () => {
    if (!globalEmail) {
      triggerAuth("Para guardar publicaciones necesitas iniciar sesión.");
      return;
    }
    if (processingSave.current) return;
    processingSave.current = true;

    const previousSaved = isSaved;
    const previousCount = savedCount;
    const nextSaved = !isSaved;

    setIsSaved(nextSaved);
    setSavedCount((current) => applyCountDelta(current, nextSaved ? 1 : -1));

    try {
      if (nextSaved) {
        await api.publications.save(post.id);
      } else {
        await api.publications.unsave(post.id);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      if (message.includes("409")) {
        setIsSaved(true);
      } else if (message.includes("404")) {
        setIsSaved(false);
      } else {
        setIsSaved(previousSaved);
        setSavedCount(previousCount);
      }

      if (message.includes("401")) triggerAuth("Para guardar publicaciones necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permisos para guardar esta publicacion.");
    } finally {
      processingSave.current = false;
    }
  };

  const handleRate = async (rating: number) => {
    if (!globalEmail) {
      triggerAuth("Para calificar una publicación necesitas iniciar sesión.");
      return;
    }
    if (processingRating.current) return;
    processingRating.current = true;
    setIsRatingLoading(true);

    const previousAvg = ratingAvg;
    const previousCount = ratingCount;
    const previousUserRating = userRating;
    const optimistic = calculateOptimisticRatingSummary(ratingAvg, ratingCount, rating, userRating);

    setUserRating(rating);
    setRatingAvg(optimistic.ratingAvg);
    setRatingCount(optimistic.ratingCount);

    try {
      const response = await api.ratings.create({
        targetType: "publication",
        targetId: post.id,
        rating,
      });

      if (response.summary) {
        setRatingAvg(response.summary.ratingAvg);
        setRatingCount(response.summary.ratingCount);
      }
      setUserRating(response.rating?.rating ?? rating);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setRatingAvg(previousAvg);
      setRatingCount(previousCount);
      setUserRating(previousUserRating);

      if (message.includes("401")) triggerAuth("Para calificar una publicacion necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permisos para calificar esta publicacion.");
    } finally {
      processingRating.current = false;
      setIsRatingLoading(false);
    }
  };

  const handleFollowCreator = async () => {
    if (!globalEmail) {
      triggerAuth("Para seguir creadores necesitas iniciar sesión.");
      return;
    }
    const creatorEmail = post.creatorEmail ?? post.userEmail ?? post.user?.email;
    if (!creatorEmail || processingFollow.current) return;
    processingFollow.current = true;

    const previousFollowing = isFollowingCreator;
    const previousCount = followersCount;
    const nextFollowing = !isFollowingCreator;

    setIsFollowingCreator(nextFollowing);
    setFollowersCount((current) => applyCountDelta(current, nextFollowing ? 1 : -1));

    try {
      if (nextFollowing) {
        await api.social.followCreator(creatorEmail);
      } else {
        await api.social.unfollowCreator(creatorEmail);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      if (message.includes("409")) {
        setIsFollowingCreator(true);
      } else if (message.includes("404")) {
        setIsFollowingCreator(false);
      } else {
        setIsFollowingCreator(previousFollowing);
        setFollowersCount(previousCount);
      }

      if (message.includes("401")) triggerAuth("Para seguir creadores necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permisos para seguir creadores.");
    } finally {
      processingFollow.current = false;
    }
  };

  const handleDelete = async () => {
    try {
      await api.publications.delete(post.id);
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes("401")) triggerAuth("Para eliminar una publicacion necesitas iniciar sesion.");
      else if (message.includes("403")) triggerAuth("No tienes permisos para eliminar esta publicacion.");
      return false;
    }
  };

  return {
    isLiked,
    likes,
    isDisliked,
    dislikes,
    sharedCount,
    isSaved,
    savedCount,
    ratingAvg,
    ratingCount,
    userRating,
    isRatingLoading,
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
    handleRate,
    handleFollowCreator,
    handleDelete,
  };
}
