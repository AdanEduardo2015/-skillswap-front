import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, Flex, Heading, Spinner, Text, VStack, chakra } from "@chakra-ui/react";
import { FiMessageCircle, FiRefreshCw, FiSend, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { ConversationSummary, Follow, MessagesSettings, PrivateMessage, UserSummary } from "../types";
import { useSearchParamsGlobal } from "../utils/GlobalVariables";
import { useUserData } from "../utils/UserStore";
import { normalizeRole } from "../domain/roles";
import { AppButton, EmptyState } from "../shared/ui";

const PROFILE_FALLBACK = "/Profile.svg";
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

type PresenceInfo = {
  isActive: boolean;
  label: string;
};

const clean = (value?: string | null) => value?.trim() ?? "";

const parseDate = (value?: string | null) => {
  const raw = clean(value);
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMessageTime = (value?: string) => {
  const date = parseDate(value);
  if (!date) return "";

  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatConversationTime = (value?: string) => {
  const date = parseDate(value);
  if (!date) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return formatMessageTime(value);

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
};

const titleCase = (value: string) => value.replace(/\b\w/g, (character) => character.toUpperCase());

const nameFromEmail = (email?: string | null) => {
  const localPart = clean(email).split("@")[0];
  if (!localPart) return "Usuario";

  return titleCase(localPart.replace(/[._-]+/g, " "));
};

const getConversationName = (conversation?: ConversationSummary | null, fallbackEmail?: string | null) =>
  clean(conversation?.otherUser?.username) ||
  clean(conversation?.otherUsername) ||
  clean(conversation?.otherName) ||
  nameFromEmail(conversation?.otherEmail || fallbackEmail);

const getConversationAvatar = (conversation?: ConversationSummary | null) =>
  clean(conversation?.otherUser?.profilePicUrl) ||
  clean(conversation?.otherUser?.profilePicture) ||
  clean(conversation?.otherProfilePicUrl) ||
  clean(conversation?.otherProfilePicture) ||
  PROFILE_FALLBACK;

const getPresenceInfo = (conversation?: ConversationSummary | null): PresenceInfo => {
  const explicitStatus = clean(conversation?.presenceStatus);
  const normalizedStatus = explicitStatus.toLowerCase();

  if (conversation?.isOnline || normalizedStatus === "activo" || normalizedStatus === "active") {
    return { isActive: true, label: explicitStatus || "Activo ahora" };
  }

  const lastActive = parseDate(conversation?.lastActiveAt);
  if (!lastActive) {
    return { isActive: false, label: explicitStatus || "Desconectado" };
  }

  const elapsed = Math.max(Date.now() - lastActive.getTime(), 0);
  if (elapsed <= ACTIVE_WINDOW_MS) {
    return { isActive: true, label: explicitStatus || "Activo ahora" };
  }

  if (elapsed < HOUR_MS) {
    return { isActive: false, label: `Activo hace ${Math.max(Math.round(elapsed / MINUTE_MS), 1)} min` };
  }

  if (elapsed < DAY_MS) {
    return { isActive: false, label: `Activo hace ${Math.max(Math.round(elapsed / HOUR_MS), 1)} h` };
  }

  return { isActive: false, label: explicitStatus || "Desconectado" };
};

const createContactConversation = (
  email: string,
  user?: UserSummary,
  lastMessage = "Sin mensajes todavia"
): ConversationSummary => {
  const profilePicture = user?.profilePicUrl || user?.profilePicture || null;

  return {
    threadKey: `contact#${email}`,
    otherEmail: email,
    otherName: user?.username,
    otherUsername: user?.username,
    otherProfilePicture: profilePicture,
    otherProfilePicUrl: profilePicture,
    otherUser: user,
    lastMessage,
    lastMessageAt: "",
    lastMessageId: "",
    unreadCount: 0,
  };
};

const createInitialConversation = (email: string): ConversationSummary => ({
  threadKey: email,
  otherEmail: email,
  lastMessage: "Nueva conversacion",
  lastMessageAt: "",
  lastMessageId: "",
  unreadCount: 0,
});

const normalizeEmail = (email?: string | null) => clean(email).toLowerCase();

const conversationHasMessages = (conversation: ConversationSummary) =>
  Boolean(clean(conversation.lastMessageId) || clean(conversation.lastMessageAt));

const mergeConversationData = (
  existing: ConversationSummary,
  incoming: ConversationSummary
): ConversationSummary => ({
  ...existing,
  ...incoming,
  threadKey: clean(incoming.threadKey) || existing.threadKey,
  otherEmail: clean(incoming.otherEmail) || existing.otherEmail,
  otherName: clean(incoming.otherName) || existing.otherName,
  otherUsername: clean(incoming.otherUsername) || existing.otherUsername,
  otherProfilePicture: incoming.otherProfilePicture || existing.otherProfilePicture,
  otherProfilePicUrl: incoming.otherProfilePicUrl || existing.otherProfilePicUrl,
  otherUser: incoming.otherUser || existing.otherUser,
  isOnline: incoming.isOnline ?? existing.isOnline,
  lastActiveAt: incoming.lastActiveAt ?? existing.lastActiveAt,
  presenceStatus: clean(incoming.presenceStatus) || existing.presenceStatus,
  lastMessage: conversationHasMessages(incoming)
    ? incoming.lastMessage
    : existing.lastMessage || incoming.lastMessage,
  lastMessageAt: clean(incoming.lastMessageAt) || existing.lastMessageAt,
  lastMessageId: clean(incoming.lastMessageId) || existing.lastMessageId,
  unreadCount: incoming.unreadCount ?? existing.unreadCount,
});

const mergeConversationLists = (...lists: ConversationSummary[][]) => {
  const byEmail = new Map<string, ConversationSummary>();

  for (const list of lists) {
    for (const conversation of list) {
      const key = normalizeEmail(conversation.otherEmail);
      if (!key) continue;

      const existing = byEmail.get(key);
      byEmail.set(key, existing ? mergeConversationData(existing, conversation) : conversation);
    }
  }

  return [...byEmail.values()].sort((left, right) => {
    const leftTime = parseDate(left.lastMessageAt)?.getTime() ?? 0;
    const rightTime = parseDate(right.lastMessageAt)?.getTime() ?? 0;
    if (leftTime !== rightTime) return rightTime - leftTime;

    return getConversationName(left).localeCompare(getConversationName(right), "es", { sensitivity: "base" });
  });
};

const getFollowUser = (follow: Follow, kind: "following" | "follower") =>
  kind === "following" ? follow.creator || follow.user : follow.follower || follow.user;

const getFollowEmail = (follow: Follow, kind: "following" | "follower") =>
  kind === "following" ? follow.creatorEmail : follow.followerEmail;

const fetchUserProfiles = async (emails: string[]) => {
  const uniqueEmails = [...new Set(emails.map(normalizeEmail).filter(Boolean))].slice(0, 50);
  const results = await Promise.allSettled(
    uniqueEmails.map(async (email) => {
      const profile = await api.publications.listByUser(email, 1);
      return { email, user: profile.userProfile };
    })
  );

  const profiles = new Map<string, UserSummary>();
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.user) {
      profiles.set(result.value.email, result.value.user);
    }
  }

  return profiles;
};

const loadRelationshipContacts = async (currentEmail: string) => {
  const contacts = new Map<string, UserSummary | undefined>();
  const [followingResult, followersResult] = await Promise.allSettled([
    api.social.listFollowing(100),
    api.social.listFollowers(currentEmail, 100),
  ]);

  if (followingResult.status === "fulfilled") {
    for (const follow of followingResult.value.following) {
      const email = normalizeEmail(getFollowEmail(follow, "following"));
      if (!email || email === normalizeEmail(currentEmail)) continue;
      contacts.set(email, getFollowUser(follow, "following") || contacts.get(email));
    }
  }

  if (followersResult.status === "fulfilled") {
    for (const follow of followersResult.value.followers) {
      const email = normalizeEmail(getFollowEmail(follow, "follower"));
      if (!email || email === normalizeEmail(currentEmail)) continue;
      contacts.set(email, getFollowUser(follow, "follower") || contacts.get(email));
    }
  }

  const missingProfiles = [...contacts.entries()].filter(([, user]) => !user).map(([email]) => email);
  const profiles = await fetchUserProfiles(missingProfiles);

  return [...contacts.entries()].map(([email, user]) =>
    createContactConversation(email, user || profiles.get(email))
  );
};

export default function Messages() {
  const navigate = useNavigate();
  const searchParams = useSearchParamsGlobal();
  const initialUser = searchParams.get("user");
  const { email: currentEmail, role } = useUserData();
  const normalizedRole = normalizeRole(role);
  const isAdmin = normalizedRole === "admin";
  const isBanned = normalizedRole === "banned";

  const [messagesSettings, setMessagesSettings] = useState<MessagesSettings | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [relationshipContacts, setRelationshipContacts] = useState<ConversationSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(initialUser);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [content, setContent] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesEnabled = messagesSettings?.messagesEnabled === true;

  const initialConversation = useMemo(() => {
    const existingContacts = mergeConversationLists(relationshipContacts, conversations);
    if (
      !initialUser ||
      existingContacts.some(
        (conversation) => normalizeEmail(conversation.otherEmail) === normalizeEmail(initialUser)
      )
    ) {
      return null;
    }

    return createInitialConversation(initialUser);
  }, [conversations, initialUser, relationshipContacts]);

  const visibleConversations = useMemo(
    () =>
      mergeConversationLists(
        relationshipContacts,
        initialConversation ? [initialConversation] : [],
        conversations
      ),
    [conversations, initialConversation, relationshipContacts]
  );

  const selectedConversation = useMemo(
    () => visibleConversations.find((conversation) => conversation.otherEmail === selectedEmail) ?? null,
    [selectedEmail, visibleConversations]
  );

  const selectedName = selectedEmail
    ? getConversationName(selectedConversation, selectedEmail)
    : "Selecciona una conversacion";
  const selectedAvatar = getConversationAvatar(selectedConversation);
  const selectedPresence = getPresenceInfo(selectedConversation);

  useEffect(() => {
    const loadMessagesSettings = async () => {
      setIsLoadingSettings(true);
      setFeedback("");

      try {
        const settings = await api.messages.getSettings();
        setMessagesSettings(settings);
      } catch (error: unknown) {
        setMessagesSettings({ messagesEnabled: false });
        if (isAdmin) {
          setFeedback(
            error instanceof Error ? error.message : "No se pudo cargar la configuracion de mensajes."
          );
        }
      } finally {
        setIsLoadingSettings(false);
      }
    };

    void loadMessagesSettings();
  }, [isAdmin, reloadVersion]);

  useEffect(() => {
    if (isLoadingSettings || !messagesEnabled || isAdmin) {
      setIsLoadingConversations(false);
      setConversations([]);
      setRelationshipContacts([]);
      return;
    }

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      setFeedback("");

      try {
        const [conversationResult, contactResult] = await Promise.all([
          api.messages.listConversations(50),
          currentEmail ? loadRelationshipContacts(currentEmail) : Promise.resolve([]),
        ]);
        const merged = mergeConversationLists(
          contactResult,
          initialUser ? [createInitialConversation(initialUser)] : [],
          conversationResult.conversations
        );

        setConversations(conversationResult.conversations);
        setRelationshipContacts(contactResult);
        setSelectedEmail((current) => current ?? initialUser ?? merged[0]?.otherEmail ?? null);
      } catch (error: unknown) {
        setFeedback(error instanceof Error ? error.message : "No se pudieron cargar los chats.");
      } finally {
        setIsLoadingConversations(false);
      }
    };

    void loadConversations();
  }, [currentEmail, initialUser, isAdmin, isLoadingSettings, messagesEnabled, reloadVersion]);

  useEffect(() => {
    if (initialUser) setSelectedEmail(initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (!messagesEnabled || isAdmin) {
      setMessages([]);
      return;
    }

    if (!selectedEmail) {
      setMessages([]);
      return;
    }

    const loadThread = async () => {
      setIsLoadingThread(true);
      setFeedback("");

      try {
        const result = await api.messages.listThread(selectedEmail, 100);
        setMessages(result.messages);

        const unread = result.messages.filter(
          (message) => message.recipientEmail === currentEmail && !message.readAt && message.status !== "read"
        );

        if (unread.length > 0) {
          await Promise.allSettled(unread.map((message) => api.messages.markRead(message.id)));
          const readIds = new Set(unread.map((message) => message.id));
          const readAt = new Date().toISOString();

          setMessages((current) =>
            current.map((message) =>
              readIds.has(message.id)
                ? { ...message, readAt: message.readAt ?? readAt, status: "read" }
                : message
            )
          );
          setConversations((current) =>
            current.map((conversation) =>
              conversation.otherEmail === selectedEmail ? { ...conversation, unreadCount: 0 } : conversation
            )
          );
        }
      } catch (error: unknown) {
        setMessages([]);
        setFeedback(error instanceof Error ? error.message : "No se pudo cargar la conversacion.");
      } finally {
        setIsLoadingThread(false);
      }
    };

    void loadThread();
  }, [currentEmail, isAdmin, messagesEnabled, selectedEmail, reloadVersion]);

  useEffect(() => {
    if (!selectedEmail || isLoadingThread) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isLoadingThread, messages, selectedEmail]);

  const selectConversation = (email: string) => {
    setFeedback("");
    setSelectedEmail(email);
    navigate(`/messages?user=${encodeURIComponent(email)}`);
  };

  const sendMessage = async () => {
    const trimmed = content.trim();
    if (!selectedEmail || !trimmed || isSending || isBanned || isAdmin || !messagesEnabled) return;

    setIsSending(true);
    setFeedback("");

    try {
      const sent = await api.messages.send(selectedEmail, trimmed);
      setMessages((current) => [...current, sent]);
      setConversations((current) => {
        const existing =
          current.find((conversation) => conversation.otherEmail === selectedEmail) ?? selectedConversation;
        const remaining = current.filter((conversation) => conversation.otherEmail !== selectedEmail);
        const updated: ConversationSummary = {
          ...(existing ?? createInitialConversation(selectedEmail)),
          threadKey: sent.threadKey || existing?.threadKey || selectedEmail,
          lastMessage: sent.content,
          lastMessageAt: sent.sentAt,
          lastMessageId: sent.id,
          unreadCount: 0,
        };

        return [updated, ...remaining];
      });
      setContent("");
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await api.messages.delete(messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : "No se pudo eliminar el mensaje.");
    }
  };

  const updateMessagesAvailability = async (enabled: boolean) => {
    if (!isAdmin || isSavingSettings) return;

    setIsSavingSettings(true);
    setFeedback("");

    try {
      const settings = await api.admin.updateMessagesSettings(enabled);
      setMessagesSettings(settings);
      setFeedback(enabled ? "Mensajes habilitados." : "Mensajes deshabilitados.");
    } catch (error: unknown) {
      setFeedback(error instanceof Error ? error.message : "No se pudo actualizar la configuracion.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoadingSettings) {
    return <CenteredMessagesStatus isLoading />;
  }

  if (isAdmin) {
    return (
      <AdminMessagesSettings
        feedback={feedback}
        isSaving={isSavingSettings}
        settings={messagesSettings ?? { messagesEnabled: false }}
        onReload={() => setReloadVersion((current) => current + 1)}
        onToggle={(enabled) => void updateMessagesAvailability(enabled)}
      />
    );
  }

  if (!messagesEnabled) {
    return <CenteredMessagesStatus title="Próximamente" />;
  }

  return (
    <Box minH="100vh" color="var(--text-color)" px={{ base: 4, md: 8 }} py={6}>
      <Flex justify="space-between" align="center" mb={5} gap={3} wrap="wrap">
        <Flex align="center" gap={3}>
          <FiMessageCircle size={28} aria-hidden="true" />
          <Heading as="h1" size="4xl">
            Mensajes
          </Heading>
        </Flex>
        <AppButton type="button" tone="ghost" onClick={() => setReloadVersion((current) => current + 1)}>
          <Flex align="center" gap={2}>
            <FiRefreshCw />
            <Text>Recargar</Text>
          </Flex>
        </AppButton>
      </Flex>

      {feedback && (
        <Text color="red.400" mb={4}>
          {feedback}
        </Text>
      )}

      <Flex
        as="section"
        direction="row"
        align="stretch"
        minH={{ base: "calc(100dvh - 9rem)", lg: "72vh" }}
        maxH={{ lg: "calc(100dvh - 9rem)" }}
        border="1px solid"
        borderColor="var(--card-border)"
        borderRadius="panel"
        bg="var(--surface-bg)"
        overflowX={{ base: "auto", md: "hidden" }}
        overflowY="hidden"
      >
        <Box
          w={{ base: "18rem", md: "20rem", xl: "22.5rem" }}
          minW={{ base: "18rem", md: "20rem", xl: "22.5rem" }}
          flexShrink={0}
          display="flex"
          flexDirection="column"
          borderRightWidth="1px"
          borderBottomWidth="0"
          borderColor="var(--card-border)"
        >
          <Flex
            p={4}
            align="center"
            justify="space-between"
            gap={3}
            borderBottom="1px solid"
            borderColor="var(--card-border)"
          >
            <Box>
              <Heading as="h2" size="lg">
                Chats
              </Heading>
              <Text color="var(--text-muted)" fontSize="sm">
                {visibleConversations.length} contactos
              </Text>
            </Box>
          </Flex>

          <Box flex="1" overflowY="auto">
            {isLoadingConversations ? (
              <Flex justify="center" py={10}>
                <Spinner color="var(--text-color)" />
              </Flex>
            ) : visibleConversations.length === 0 ? (
              <EmptyState
                title="No tienes contactos"
                description="Cuando sigas a alguien o alguien te siga, aparecera aqui para iniciar chat."
                minH="35vh"
              />
            ) : (
              <VStack align="stretch" gap={0}>
                {visibleConversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.threadKey || conversation.otherEmail}
                    conversation={conversation}
                    isActive={selectedEmail === conversation.otherEmail}
                    onClick={() => selectConversation(conversation.otherEmail)}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </Box>

        <Box
          flex="1"
          minW={{ base: "24rem", md: 0 }}
          display="flex"
          flexDirection="column"
          bg="var(--surface-bg)"
        >
          <Flex
            px={{ base: 4, md: 5 }}
            py={4}
            align="center"
            gap={3}
            borderBottom="1px solid"
            borderColor="var(--card-border)"
          >
            {selectedEmail ? (
              <>
                <ProfileAvatar
                  src={selectedAvatar}
                  name={selectedName}
                  size="3rem"
                  presence={selectedPresence}
                />
                <Box minW={0}>
                  <Heading as="h2" size="lg" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {selectedName}
                  </Heading>
                  <Flex align="center" gap={2}>
                    <PresenceDot isActive={selectedPresence.isActive} />
                    <Text color="var(--text-muted)" fontSize="sm">
                      {selectedPresence.label}
                    </Text>
                  </Flex>
                </Box>
              </>
            ) : (
              <Heading as="h2" size="lg">
                Selecciona una conversacion
              </Heading>
            )}
          </Flex>

          <Box flex="1" minH="0" p={{ base: 4, md: 5 }} overflowY="auto" bg="var(--input-bg)">
            {!selectedEmail ? (
              <EmptyState title="Selecciona una conversacion" minH="40vh" />
            ) : isLoadingThread ? (
              <Flex justify="center" py={12}>
                <Spinner color="var(--text-color)" />
              </Flex>
            ) : messages.length === 0 ? (
              <EmptyState
                title="Todavia no hay mensajes"
                description="Escribe el primer mensaje para iniciar la conversacion."
                minH="40vh"
              />
            ) : (
              <VStack align="stretch" gap={3}>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isMine={message.senderEmail === currentEmail}
                    avatarSrc={selectedAvatar}
                    displayName={selectedName}
                    onDelete={() => void deleteMessage(message.id)}
                  />
                ))}
                <Box ref={messagesEndRef} />
              </VStack>
            )}
          </Box>

          {selectedEmail && (
            <Box p={{ base: 3, md: 4 }} borderTop="1px solid" borderColor="var(--card-border)">
              {isBanned ? (
                <Text color="red.300">
                  Tu cuenta esta restringida. Puedes consultar mensajes, pero no enviar nuevos.
                </Text>
              ) : (
                <chakra.form onSubmit={handleSubmit}>
                  <Flex gap={3} align="flex-end">
                    <chakra.textarea
                      aria-label="Mensaje"
                      value={content}
                      maxLength={1000}
                      rows={1}
                      placeholder="Escribe un mensaje..."
                      bg="var(--input-bg)"
                      color="var(--text-color)"
                      border="1px solid"
                      borderColor="var(--card-border)"
                      borderRadius="1.5rem"
                      minH="2.75rem"
                      maxH="9rem"
                      resize="vertical"
                      px={4}
                      py={3}
                      flex="1"
                      lineHeight="1.25"
                      outline="none"
                      _focus={{
                        borderColor: "brand.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
                      }}
                      onChange={(event) => setContent(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                    />
                    <chakra.button
                      type="submit"
                      aria-label="Enviar mensaje"
                      disabled={!content.trim() || isSending}
                      w="2.75rem"
                      h="2.75rem"
                      flexShrink={0}
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="full"
                      bg="brand.500"
                      color="white"
                      transition="opacity 0.15s ease, transform 0.15s ease"
                      _hover={{ opacity: 0.9 }}
                      _active={{ transform: "translateY(1px)" }}
                      _disabled={{ opacity: 0.45, cursor: "not-allowed" }}
                    >
                      {isSending ? <Spinner size="sm" /> : <FiSend size={18} aria-hidden="true" />}
                    </chakra.button>
                  </Flex>
                </chakra.form>
              )}
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function CenteredMessagesStatus({ title, isLoading = false }: { title?: string; isLoading?: boolean }) {
  return (
    <Box minH="100vh" color="var(--text-color)" px={{ base: 4, md: 8 }} py={6}>
      <Flex minH="calc(100vh - 8rem)" align="center" justify="center">
        {isLoading ? (
          <Spinner color="var(--text-color)" />
        ) : (
          <Heading as="h1" size="3xl" textAlign="center">
            {title}
          </Heading>
        )}
      </Flex>
    </Box>
  );
}

function AdminMessagesSettings({
  feedback,
  isSaving,
  settings,
  onReload,
  onToggle,
}: {
  feedback: string;
  isSaving: boolean;
  settings: MessagesSettings;
  onReload: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const isEnabled = settings.messagesEnabled;

  return (
    <Box minH="100vh" color="var(--text-color)" px={{ base: 4, md: 8 }} py={6}>
      <Flex minH="calc(100vh - 8rem)" align="center" justify="center">
        <Box
          w="100%"
          maxW="32rem"
          border="1px solid"
          borderColor="var(--card-border)"
          borderRadius="panel"
          bg="var(--surface-bg)"
          p={{ base: 5, md: 6 }}
        >
          <Flex align="center" gap={3} mb={4}>
            <FiMessageCircle size={26} aria-hidden="true" />
            <Heading as="h1" size="2xl">
              Mensajes
            </Heading>
          </Flex>

          <Text color="var(--text-muted)" mb={4}>
            El administrador solo puede activar o desactivar la funcion de mensajes.
          </Text>

          <Flex
            align="center"
            justify="space-between"
            gap={4}
            border="1px solid"
            borderColor="var(--card-border)"
            borderRadius="panel"
            p={4}
            mb={4}
          >
            <Box>
              <Text fontWeight="700">Estado</Text>
              <Flex align="center" gap={2} mt={1}>
                <PresenceDot isActive={isEnabled} />
                <Text color="var(--text-muted)" fontSize="sm">
                  {isEnabled ? "Habilitado" : "Deshabilitado"}
                </Text>
              </Flex>
            </Box>
            <AppButton type="button" onClick={() => onToggle(!isEnabled)} disabled={isSaving}>
              {isSaving ? "Guardando..." : isEnabled ? "Deshabilitar" : "Habilitar"}
            </AppButton>
          </Flex>

          {settings.updatedAt && (
            <Text color="var(--text-muted)" fontSize="sm" mb={4}>
              Ultimo cambio: {formatConversationTime(settings.updatedAt)}{" "}
              {settings.updatedBy ? `por ${settings.updatedBy}` : ""}
            </Text>
          )}

          {feedback && (
            <Text color={feedback.includes("No se") ? "red.400" : "green.400"} mb={4}>
              {feedback}
            </Text>
          )}

          <AppButton type="button" tone="ghost" onClick={onReload} disabled={isSaving}>
            <Flex align="center" gap={2}>
              <FiRefreshCw />
              <Text>Recargar</Text>
            </Flex>
          </AppButton>
        </Box>
      </Flex>
    </Box>
  );
}

function ConversationRow({
  conversation,
  isActive,
  onClick,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  const name = getConversationName(conversation);
  const avatar = getConversationAvatar(conversation);
  const presence = getPresenceInfo(conversation);
  const lastMessage = conversation.lastMessage || "Nueva conversacion";

  return (
    <chakra.button
      type="button"
      textAlign="left"
      w="100%"
      minH="5.25rem"
      px={4}
      py={3}
      bg={isActive ? "var(--ghost-hover-bg)" : "transparent"}
      borderBottom="1px solid"
      borderLeftWidth="3px"
      borderLeftColor={isActive ? "brand.500" : "transparent"}
      borderColor="var(--card-border)"
      onClick={onClick}
      _hover={{ bg: "var(--ghost-hover-bg)" }}
      aria-current={isActive ? "true" : undefined}
    >
      <Flex gap={3} align="center">
        <ProfileAvatar src={avatar} name={name} size="3rem" presence={presence} />
        <Box minW={0} flex="1">
          <Flex align="center" justify="space-between" gap={2}>
            <Text fontWeight="700" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {name}
            </Text>
            <Text color="var(--text-muted)" fontSize="xs" flexShrink={0}>
              {formatConversationTime(conversation.lastMessageAt)}
            </Text>
          </Flex>

          <Text
            color="var(--text-muted)"
            fontSize="sm"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {lastMessage}
          </Text>

          <Flex mt={1} align="center" justify="space-between" gap={2}>
            <Flex align="center" gap={2} minW={0}>
              <PresenceDot isActive={presence.isActive} />
              <Text
                color="var(--text-muted)"
                fontSize="xs"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {presence.label}
              </Text>
            </Flex>
            {conversation.unreadCount ? (
              <Badge colorPalette="blue" borderRadius="full" minW="1.45rem" textAlign="center">
                {conversation.unreadCount}
              </Badge>
            ) : null}
          </Flex>
        </Box>
      </Flex>
    </chakra.button>
  );
}

function MessageBubble({
  message,
  isMine,
  avatarSrc,
  displayName,
  onDelete,
}: {
  message: PrivateMessage;
  isMine: boolean;
  avatarSrc: string;
  displayName: string;
  onDelete: () => void;
}) {
  const sentAt = formatMessageTime(message.sentAt);
  const status = message.readAt || message.status === "read" ? "Leido" : "Enviado";

  return (
    <Flex justify={isMine ? "flex-end" : "flex-start"} align="flex-end" gap={2}>
      {!isMine && <ProfileAvatar src={avatarSrc} name={displayName} size="2rem" />}
      <Box
        maxW={{ base: "82%", md: "68%" }}
        bg={isMine ? "brand.500" : "var(--surface-bg)"}
        color={isMine ? "white" : "var(--text-color)"}
        border="1px solid"
        borderColor={isMine ? "brand.500" : "var(--card-border)"}
        borderTopLeftRadius="1.15rem"
        borderTopRightRadius="1.15rem"
        borderBottomLeftRadius={isMine ? "1.15rem" : "0.35rem"}
        borderBottomRightRadius={isMine ? "0.35rem" : "1.15rem"}
        px={4}
        py={3}
        boxShadow="0 1px 2px rgba(0, 0, 0, 0.08)"
      >
        <Text whiteSpace="pre-wrap" wordBreak="break-word" lineHeight="1.45">
          {message.content}
        </Text>
        <Flex align="center" justify="space-between" gap={3} mt={2}>
          <Text fontSize="xs" opacity={0.78}>
            {sentAt}
            {isMine && status ? ` - ${status}` : ""}
          </Text>
          <chakra.button
            type="button"
            aria-label="Eliminar mensaje"
            color={isMine ? "white" : "var(--text-muted)"}
            opacity={0.78}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            onClick={onDelete}
            _hover={{ opacity: 1 }}
          >
            <FiTrash2 size={14} aria-hidden="true" />
          </chakra.button>
        </Flex>
      </Box>
    </Flex>
  );
}

function ProfileAvatar({
  src,
  name,
  size,
  presence,
}: {
  src: string;
  name: string;
  size: string;
  presence?: PresenceInfo;
}) {
  return (
    <Box position="relative" w={size} h={size} flexShrink={0}>
      <chakra.img
        src={src || PROFILE_FALLBACK}
        alt={`Foto de ${name}`}
        w="100%"
        h="100%"
        objectFit="cover"
        borderRadius="full"
        bg="var(--input-bg)"
        onError={(event) => {
          event.currentTarget.src = PROFILE_FALLBACK;
        }}
      />
      {presence && (
        <Box
          position="absolute"
          right="0.05rem"
          bottom="0.05rem"
          bg="var(--surface-bg)"
          borderRadius="full"
          p="0.12rem"
        >
          <PresenceDot isActive={presence.isActive} size="0.7rem" />
        </Box>
      )}
    </Box>
  );
}

function PresenceDot({ isActive, size = "0.55rem" }: { isActive: boolean; size?: string }) {
  return (
    <Box
      as="span"
      aria-hidden="true"
      display="inline-block"
      w={size}
      h={size}
      flexShrink={0}
      borderRadius="full"
      bg={isActive ? "#22c55e" : "#8a8f98"}
    />
  );
}
