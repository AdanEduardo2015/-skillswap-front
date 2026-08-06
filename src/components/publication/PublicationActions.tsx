import type { ReactNode } from "react";
import { Flex, Text, chakra } from "@chakra-ui/react";
import {
  FaBookmark,
  FaFlag,
  FaRegBookmark,
  FaUserCheck,
  FaUserPlus,
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaRegComment,
  FaShare,
} from "react-icons/fa";
import { useUserData } from "../../utils/UserStore";
import { AppButton } from "../../shared/ui";
import type { UserRole } from "../../types";

interface PublicationActionsProps {
  isLiked: boolean;
  likes: number;
  isDisliked: boolean;
  dislikes: number;
  commentCount: number;
  sharedCount: number;
  isSaved: boolean;
  savedCount: number;
  isFollowingCreator: boolean;
  followersCount: number;
  canFollowCreator: boolean;
  canReport: boolean;
  isPreview: boolean;
  onLike: () => void;
  onDislike: () => void;
  onComment?: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollowCreator: () => void;
  onReport: () => void;
}

const isBannedRole = (role: string | null): role is UserRole => role === "banned";

export default function PublicationActions({
  isLiked,
  likes,
  isDisliked,
  dislikes,
  commentCount,
  sharedCount,
  isSaved,
  savedCount,
  isFollowingCreator,
  followersCount,
  canFollowCreator,
  canReport,
  isPreview,
  onLike,
  onDislike,
  onComment,
  onShare,
  onSave,
  onFollowCreator,
  onReport,
}: PublicationActionsProps) {
  const { role: globalRole } = useUserData();
  const isBannedUser = isBannedRole(globalRole);
  const isDisabled = isPreview || isBannedUser;

  return (
    <Flex direction="column" gap={2} mt={2} onClick={(event) => event.stopPropagation()}>
      <Flex justify="space-between" gap={3} wrap="wrap">
        <ActionMetric
          icon={isLiked ? <FaThumbsUp size={18} color="var(--nav-active)" /> : <FaRegThumbsUp size={18} />}
          label="Me gusta"
          count={likes}
          disabled={isDisabled}
          onClick={onLike}
        />

        <ActionMetric
          icon={
            isDisliked ? <FaThumbsDown size={18} color="var(--nav-active)" /> : <FaRegThumbsDown size={18} />
          }
          label="No me gusta"
          count={dislikes}
          disabled={isDisabled}
          onClick={onDislike}
        />

        <ActionMetric
          icon={<FaRegComment size={18} />}
          label="Comentarios"
          count={commentCount}
          disabled={isDisabled || !onComment}
          onClick={() => onComment?.()}
        />

        <ActionMetric
          icon={<FaShare size={18} />}
          label="Compartidos"
          count={sharedCount}
          disabled={isDisabled}
          onClick={onShare}
        />

        <chakra.button
          type="button"
          display="flex"
          alignItems="center"
          gap={1}
          color="var(--text-color)"
          cursor={isDisabled ? "default" : "pointer"}
          opacity={isDisabled ? 0.5 : 1}
          onClick={() => !isDisabled && onSave()}
          aria-label={isSaved ? "Quitar de guardados" : "Guardar publicacion"}
        >
          {isSaved ? <FaBookmark size={18} /> : <FaRegBookmark size={18} />}
          <Text>{savedCount}</Text>
        </chakra.button>
      </Flex>

      <Flex justify="space-between" gap={3} wrap="wrap" align="center">
        {canFollowCreator && (
          <AppButton
            type="button"
            tone={isFollowingCreator ? "secondary" : "ghost"}
            size="sm"
            minH="2.25rem"
            border="1px solid"
            borderColor={isFollowingCreator ? "brand.500" : "var(--card-border)"}
            disabled={isDisabled}
            onClick={onFollowCreator}
          >
            <Flex align="center" gap={2}>
              {isFollowingCreator ? <FaUserCheck /> : <FaUserPlus />}
              <Text>{isFollowingCreator ? "Siguiendo" : "Seguir"}</Text>
              <Text color={isFollowingCreator ? "whiteAlpha.800" : "var(--text-muted)"}>
                {followersCount}
              </Text>
            </Flex>
          </AppButton>
        )}

        {canReport && (
          <AppButton
            type="button"
            tone="ghost"
            size="sm"
            minH="2.25rem"
            border="1px solid"
            borderColor="var(--card-border)"
            disabled={isDisabled}
            onClick={onReport}
          >
            <Flex align="center" gap={2}>
              <FaFlag />
              <Text>Reportar</Text>
            </Flex>
          </AppButton>
        )}
      </Flex>
    </Flex>
  );
}

function ActionMetric({
  icon,
  label,
  count,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      onClick={() => !disabled && onClick()}
      display="flex"
      alignItems="center"
      gap={1}
      color="var(--text-color)"
      aria-label={label}
      cursor={disabled ? "default" : "pointer"}
      opacity={disabled ? 0.5 : 1}
    >
      {icon}
      <Text>{count}</Text>
    </chakra.button>
  );
}
