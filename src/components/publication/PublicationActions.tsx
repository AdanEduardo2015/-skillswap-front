import { Flex, Image, Text } from "@chakra-ui/react";
import { useUserData } from "../../utils/UserStore";

interface PublicationActionsProps {
    isLiked: boolean;
    likes: number;
    commentCount: number;
    sharedCount: number;
    isPreview: boolean;
    onLike: () => void;
    onComment?: () => void;
    onShare: () => void;
}

export default function PublicationActions({
    isLiked,
    likes,
    commentCount,
    sharedCount,
    isPreview,
    onLike,
    onComment,
    onShare,
}: PublicationActionsProps) {
    const { role: globalRole } = useUserData();
    const isBannedUser = globalRole === "banned";

    return (
        <Flex justify="space-between" mt={2}>
            <Flex onClick={e => { e.stopPropagation(); !isPreview && !isBannedUser && onLike(); }} align="center">
                <Image mr={1} cursor="pointer" src={isLiked ? "Like_active.svg" : "Like.svg"} width="20px" opacity={isBannedUser ? 0.5 : 1} />
                <Text>{likes}</Text>
            </Flex>

            <Flex onClick={e => { if (onComment) { e.stopPropagation(); !isPreview && !isBannedUser && onComment(); } }} align="center">
                <Image mr={1} cursor={isBannedUser ? "default" : "pointer"} src="Comment.svg" width="20px" opacity={isBannedUser ? 0.5 : 1} filter="none" />
                <Text>{commentCount}</Text>
            </Flex>

            <Flex onClick={e => { e.stopPropagation(); !isPreview && !isBannedUser && onShare(); }} align="center">
                <Image mr={1} cursor="pointer" src="Share.svg" width="20px" opacity={isBannedUser ? 0.5 : 1} filter="none" />
                <Text>{sharedCount}</Text>
            </Flex>
        </Flex>
    );
}
