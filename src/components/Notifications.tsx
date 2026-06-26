import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, Image, VStack, Button } from "@chakra-ui/react";
import { useNotificationStore } from "../utils/NotificationStore";
import { SkeletonNotification } from "./Skeletons";

function Notifications() {
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isClearing, setIsClearing] = useState<boolean>(false);
    const setHasUnreadNotifications = useNotificationStore((state) => state.setHasUnreadNotifications);

    useEffect(() => {
        setIsLoading(true);
        const loadNotifications = async () => {
            try {
                const res = await api.notifications.list();
                const data = res.notifications || [];
                setNotificaciones(data);

                if (data.length === 0) {
                    setHasUnreadNotifications(false);
                }
            } catch {
            } finally {
                setIsLoading(false);
            }
        };

        loadNotifications();
    }, []);

    const leerNotificacion = async (id: string) => {
        const previousNotifications = [...notificaciones];

        setNotificaciones(prev => {
            const newNotifs = prev.filter(n => n.id !== id);
            if (newNotifs.length === 0) {
                setHasUnreadNotifications(false);
            }
            return newNotifs;
        });

        try {
            await api.notifications.read(id);
        } catch {
            setNotificaciones(previousNotifications);
            setHasUnreadNotifications(previousNotifications.length > 0);
        }
    };

    const handleClearAll = async () => {
        const previousNotifications = [...notificaciones];
        setIsClearing(true);
        setNotificaciones([]);
        setHasUnreadNotifications(false);

        try {
            await api.notifications.deleteAll();
        } catch (error) {
            console.error(error);
            setNotificaciones(previousNotifications);
            setHasUnreadNotifications(previousNotifications.length > 0);
        } finally {
            setIsClearing(false);
        }
    };

    const hasNotificaciones = notificaciones.length > 0;

    return (
        <Flex direction="column" minH="100vh" textAlign="center">
            <Flex w={["90%", "75%"]} mx="auto" mb={4} justify="space-between" align="center" mt={3}>
                <Heading as="h1" size="4xl" color="white" textAlign="left">Notificaciones</Heading>
                {hasNotificaciones && (
                    <Button
                        size="sm"
                        bg="transparent"
                        color="red.400"
                        _hover={{ bg: "rgba(255,0,0,0.15)" }}
                        onClick={handleClearAll}
                        disabled={isClearing}
                        fontWeight="bold"
                    >
                        {isClearing ? "Limpiando..." : "Limpiar Todo"}
                    </Button>
                )}
            </Flex>

            {isLoading && (
                <VStack w={["90%", "75%"]} mx="auto" gap={3}>
                    <SkeletonNotification />
                    <SkeletonNotification />
                    <SkeletonNotification />
                    <SkeletonNotification />
                    <SkeletonNotification />
                    <SkeletonNotification />
                    <SkeletonNotification />
                </VStack>
            )}

            {!isLoading && !hasNotificaciones && (
                <Text color="white" textAlign="center">No tienes notificaciones</Text>
            )}

            {!isLoading && hasNotificaciones && (
                <VStack w={["90%", "75%"]} mx="auto" gap={3}>
                    {notificaciones.map((noti) => (
                        <React.Fragment key={noti.id}>
                            <Flex
                                align="start"
                                p={1}
                                mb={3}
                                w="100%"
                                color="white"
                                justify="space-between"
                                bg="#8A8A8A"
                                borderRadius="md"
                                cursor="pointer"
                                onClick={() => {
                                    leerNotificacion(noti.id);
                                    navigate("/publication?post=" + noti.publicationId);
                                }}
                            >
                                <Flex mb={2} align="center">
                                    <Image
                                        src={noti.user?.profilePicUrl ?? "/Profile.svg"}
                                        alt={noti.user?.username ?? "Usuario"}
                                        cursor="pointer"
                                        userSelect="none"
                                        mr={2}
                                        borderRadius="full"
                                        boxSize="1.3rem"
                                    />
                                    <Box>
                                        <Text as="span">{noti.message}</Text>
                                    </Box>
                                </Flex>

                                <Image
                                    src="/Cancel-white.svg"
                                    cursor="pointer"
                                    m={1}
                                    boxSize="1rem"
                                    alt="Eliminar"
                                    filter="none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        leerNotificacion(noti.id);
                                    }}
                                />
                            </Flex>
                        </React.Fragment>
                    ))}
                </VStack>
            )}
        </Flex>
    );
}

export default Notifications;
