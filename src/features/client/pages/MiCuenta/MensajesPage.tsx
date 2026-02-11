// src/pages/Client/Mensajes/MensajesPage.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Person as PersonIcon,
  DoneAll as ReadIcon,
  Send as SendIcon,
  SupportAgent as SupportIcon,
  ChatBubbleOutline
} from '@mui/icons-material';
import {
  alpha, Avatar, Badge, Box, Button, CircularProgress, Divider,
  IconButton, List, ListItemAvatar, ListItemButton, Paper,
  Stack, TextField, Typography, useTheme
} from '@mui/material';

// Servicios y Contexto
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { useAuth } from '@/core/context/AuthContext';
import MensajeService from '@/core/api/services/mensaje.service';
import type { MensajeDto } from '@/core/types/dto/mensaje';

// Config
const SYSTEM_USER_ID = 2;

const MensajesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();

  // ✅ CAMBIO 1: Referencia al contenedor del chat, no al final
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  // 1. Cargar mensajes
  const { data: mensajes = [], isLoading } = useQuery<MensajeDto[]>({
    queryKey: ['misMensajes'],
    queryFn: async () => (await MensajeService.obtenerMisMensajes()).data,
    refetchInterval: 5000
  });

  // 2. Agrupar mensajes
  const conversations = useMemo(() => {
    if (!user) return [];
    const map = new Map<number, MensajeDto[]>();

    mensajes.forEach(msg => {
      const isMeSender = msg.id_remitente === user.id;
      const otherId = isMeSender ? msg.id_receptor : msg.id_remitente;
      if (!map.has(otherId)) map.set(otherId, []);
      map.get(otherId)?.push(msg);
    });

    return Array.from(map.entries()).map(([contactId, msgs]) => {
      msgs.sort((a, b) => new Date(a.fecha_envio).getTime() - new Date(b.fecha_envio).getTime());
      const lastMsg = msgs[msgs.length - 1];
      const contactInfo = contactId === lastMsg.id_remitente ? lastMsg.remitente : lastMsg.receptor;
      const unreadCount = msgs.filter(m => m.id_receptor === user.id && !m.leido).length;

      return {
        contactId,
        contactName: contactId === SYSTEM_USER_ID ? 'Soporte Técnico' : `${contactInfo?.nombre} ${contactInfo?.apellido}`,
        lastMessage: lastMsg,
        unreadCount,
        allMessages: msgs
      };
    }).sort((a, b) => new Date(b.lastMessage.fecha_envio).getTime() - new Date(a.lastMessage.fecha_envio).getTime());

  }, [mensajes, user]);

  // Auto-selección inicial
  useEffect(() => {
    if (!selectedContactId && conversations.length > 0) {
      setSelectedContactId(conversations[0].contactId);
    }
  }, [conversations, selectedContactId]);

  // ✅ CAMBIO 2: Scroll controlado SOLO dentro del contenedor
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      // Solo scrolleamos el contenedor interno
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [selectedContactId, mensajes]); // Se ejecuta al cambiar de chat o recibir mensaje

  // Mutaciones
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContactId || !newMessage.trim()) return;
      return await MensajeService.enviarMensaje({
        id_receptor: selectedContactId,
        contenido: newMessage
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['misMensajes'] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (msgId: number) => MensajeService.marcarComoLeido(msgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misMensajes'] });
      queryClient.invalidateQueries({ queryKey: ['mensajesNoLeidos'] });
    }
  });

  useEffect(() => {
    if (selectedContactId && user) {
      const chat = conversations.find(c => c.contactId === selectedContactId);
      if (chat) {
        chat.allMessages.forEach(msg => {
          if (msg.id_receptor === user.id && !msg.leido) {
            markReadMutation.mutate(msg.id);
          }
        });
      }
    }
  }, [selectedContactId, conversations, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMutation.mutate();
    }
  }, [sendMutation]);

  const activeChat = conversations.find(c => c.contactId === selectedContactId);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Mis Mensajes"
        subtitle="Canal directo de atención y novedades de tu cuenta."
      />

      <Paper
        sx={{
          display: 'flex',
          height: '70vh',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          boxShadow: theme.shadows[2]
        }}
        elevation={0}
      >
        {/* === SIDEBAR === */}
        <Box sx={{
          width: { xs: 80, md: 320 },
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}>
          <Box p={2} display={{ xs: 'none', md: 'flex' }} justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
              CHATS ({conversations.length})
            </Typography>
          </Box>
          <Divider />

          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {isLoading ? (
              <Box p={4} textAlign="center"><CircularProgress size={24} /></Box>
            ) : conversations.length === 0 ? (
              <Box p={4} textAlign="center" display={{ xs: 'none', md: 'block' }}>
                <Typography variant="body2" color="text.secondary">No tienes conversaciones activas.</Typography>
              </Box>
            ) : (
              conversations.map((chat) => (
                <React.Fragment key={chat.contactId}>
                  <ListItemButton
                    selected={selectedContactId === chat.contactId}
                    onClick={() => setSelectedContactId(chat.contactId)}
                    sx={{
                      py: 2,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                      },
                      borderLeft: selectedContactId === chat.contactId ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ListItemAvatar>
                      <Badge badgeContent={chat.unreadCount} color="error">
                        <Avatar sx={{
                          bgcolor: chat.contactId === SYSTEM_USER_ID
                            ? theme.palette.secondary.main
                            : alpha(theme.palette.primary.main, 0.1),
                          color: chat.contactId === SYSTEM_USER_ID
                            ? 'white'
                            : theme.palette.primary.main
                        }}>
                          {chat.contactId === SYSTEM_USER_ID ? <SupportIcon /> : <PersonIcon />}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, minWidth: 0 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={chat.unreadCount > 0 ? 800 : 600} noWrap color="text.primary">
                          {chat.contactName}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {format(new Date(chat.lastMessage.fecha_envio), 'HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color={chat.unreadCount > 0 ? "text.primary" : "text.secondary"} noWrap display="block" fontWeight={chat.unreadCount > 0 ? 600 : 400}>
                        {chat.lastMessage.contenido}
                      </Typography>
                    </Box>
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))
            )}

            {!conversations.find(c => c.contactId === SYSTEM_USER_ID) && (
              <Box p={2} mt="auto" display={{ xs: 'none', md: 'block' }}>
                <Button
                  variant="contained" fullWidth startIcon={<SupportIcon />}
                  onClick={() => setSelectedContactId(SYSTEM_USER_ID)}
                  sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}
                >
                  Contactar Soporte
                </Button>
              </Box>
            )}
          </List>
        </Box>

        {/* === AREA DE MENSAJES === */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fb' }}>
          {selectedContactId ? (
            <>
              {/* Header Chat */}
              <Box
                p={2}
                borderBottom={`1px solid ${theme.palette.divider}`}
                display="flex" alignItems="center" gap={2}
                bgcolor="background.paper"
                boxShadow={theme.shadows[1]}
                zIndex={1}
              >
                <Avatar sx={{
                  bgcolor: selectedContactId === SYSTEM_USER_ID ? theme.palette.secondary.main : theme.palette.primary.main,
                  color: 'white'
                }}>
                  {selectedContactId === SYSTEM_USER_ID ? <SupportIcon /> : activeChat?.contactName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    {selectedContactId === SYSTEM_USER_ID ? 'Soporte Técnico' : activeChat?.contactName || 'Nuevo Chat'}
                  </Typography>
                  {selectedContactId === SYSTEM_USER_ID && (
                    <Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5}>
                      <Box width={6} height={6} borderRadius="50%" bgcolor="success.main" /> En línea
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* ✅ CAMBIO 3: Lista de Mensajes con REF al contenedor */}
              <Box
                ref={chatContainerRef} // ✨ La referencia va aquí
                sx={{
                  flex: 1,
                  overflowY: 'auto', // ✨ El scroll ocurre aquí
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  scrollBehavior: 'smooth' // Suavidad CSS
                }}
              >
                {activeChat ? (
                  activeChat.allMessages.map((msg) => {
                    const isMe = msg.id_remitente === user?.id;
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: { xs: '85%', md: '65%' },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            px: 2,
                            bgcolor: isMe ? 'primary.main' : 'white',
                            color: isMe ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            borderTopRightRadius: isMe ? 0 : 2,
                            borderTopLeftRadius: isMe ? 2 : 0,
                            boxShadow: theme.shadows[1]
                          }}
                        >
                          <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {msg.contenido}
                          </Typography>
                        </Paper>
                        <Stack direction="row" spacing={0.5} mt={0.5} alignItems="center">
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {format(new Date(msg.fecha_envio), "HH:mm", { locale: es })}
                          </Typography>
                          {isMe && msg.leido && <ReadIcon sx={{ fontSize: 14, color: 'info.main' }} />}
                        </Stack>
                      </Box>
                    );
                  })
                ) : (
                  <Box
                    height="100%" display="flex" flexDirection="column"
                    justifyContent="center" alignItems="center" color="text.disabled"
                  >
                    <ChatBubbleOutline sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                    <Typography variant="body2">Escribe un mensaje para comenzar.</Typography>
                  </Box>
                )}
                {/* Eliminamos el div dummy al final */}
              </Box>

              {/* Input Area */}
              <Box p={2} bgcolor="background.paper" borderTop={`1px solid ${theme.palette.divider}`}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    placeholder="Escribe tu mensaje..."
                    size="small"
                    variant="outlined"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    multiline
                    maxRows={4}
                    sx={{
                      bgcolor: 'background.default',
                      '& .MuiOutlinedInput-root': { borderRadius: 3 }
                    }}
                  />
                  <IconButton
                    onClick={() => sendMutation.mutate()}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    color="primary"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 40, height: 40,
                      '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                    }}
                  >
                    {sendMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                  </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" color="text.disabled" flexDirection="column" gap={2}>
              <ChatBubbleOutline sx={{ fontSize: 80, opacity: 0.1 }} />
              <Typography variant="h6" color="text.secondary">Selecciona una conversación</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default MensajesPage;