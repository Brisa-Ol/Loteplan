// src/pages/Client/Mensajes/MensajesPage.tsx

import {
  Person as PersonIcon,
  MarkEmailRead as ReadIcon,
  Send as SendIcon,
  AdminPanelSettings as SystemIcon
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Servicios y Contexto
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { useAuth } from '../../../context/AuthContext';
import MensajeService from '../../../services/mensaje.service';
import type { MensajeDto } from '../../../types/dto/mensaje';

// ✅ Importamos configuración

const SYSTEM_USER_ID = 2; 

const MensajesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme(); 
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  // 1. Cargar mensajes
  const { data: mensajes = [], isLoading } = useQuery<MensajeDto[]>({
    queryKey: ['misMensajes'],
    queryFn: async () => (await MensajeService.obtenerMisMensajes()).data,
    // Usamos configuración, pero permitimos un override para chat (ej. 5s es mejor que 30s para chat)
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
        contactName: contactId === SYSTEM_USER_ID ? 'Soporte / Sistema' : `${contactInfo?.nombre} ${contactInfo?.apellido}`,
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

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContactId, mensajes]);

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

  // Marcar como leído al abrir chat
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
        title="Centro de Mensajes" 
        subtitle="Comunícate con soporte o revisa notificaciones." 
      />

      <Paper 
        sx={{ 
          display: 'flex', 
          height: '75vh', 
          overflow: 'hidden', 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3
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
          <Box p={2} display={{ xs: 'none', md: 'block' }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
              CONVERSACIONES ({conversations.length})
            </Typography>
          </Box>
          <Divider />
          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {isLoading ? (
               <Box p={4} textAlign="center"><CircularProgress size={24} /></Box>
            ) : conversations.length === 0 ? (
               <Box p={4} textAlign="center" display={{ xs: 'none', md: 'block' }}>
                   <Typography variant="body2" color="text.secondary">No tienes mensajes.</Typography>
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
                            {chat.contactId === SYSTEM_USER_ID ? <SystemIcon /> : <PersonIcon />}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      
                      {/* Texto solo en desktop */}
                      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={chat.unreadCount > 0 ? 700 : 600} noWrap color="text.primary">
                            {chat.contactName}
                          </Typography>
                          <Typography variant="caption" color={chat.unreadCount > 0 ? "text.primary" : "text.secondary"} noWrap display="block">
                            {chat.lastMessage.contenido}
                          </Typography>
                      </Box>
                      
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Typography variant="caption" color="text.disabled" sx={{ minWidth: 40, textAlign: 'right' }}>
                              {format(new Date(chat.lastMessage.fecha_envio), 'HH:mm')}
                          </Typography>
                      </Box>
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))
            )}
            
            {!conversations.find(c => c.contactId === SYSTEM_USER_ID) && (
                 <Box p={2} display={{ xs: 'none', md: 'block' }}>
                    <Button 
                        variant="outlined" fullWidth startIcon={<SystemIcon />}
                        onClick={() => setSelectedContactId(SYSTEM_USER_ID)}
                    >
                        Contactar Soporte
                    </Button>
                 </Box>
            )}
          </List>
        </Box>

        {/* === CHAT AREA === */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
          {selectedContactId ? (
            <>
              {/* Header */}
              <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`} display="flex" alignItems="center" gap={2} bgcolor="background.default">
                 <Avatar sx={{ 
                    bgcolor: selectedContactId === SYSTEM_USER_ID ? theme.palette.secondary.main : theme.palette.primary.main,
                    color: 'white'
                 }}>
                    {selectedContactId === SYSTEM_USER_ID ? <SystemIcon /> : activeChat?.contactName?.charAt(0)}
                 </Avatar>
                 <Typography variant="h6" fontWeight="bold" color="text.primary">
                    {selectedContactId === SYSTEM_USER_ID ? 'Soporte / Sistema' : activeChat?.contactName || 'Nuevo Chat'}
                 </Typography>
              </Box>

              {/* Mensajes */}
              <Box sx={{ 
                flex: 1, 
                overflowY: 'auto', 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                bgcolor: 'background.paper' 
              }}>
                {activeChat ? (
                    activeChat.allMessages.map((msg) => {
                        const isMe = msg.id_remitente === user?.id;
                        return (
                            <Box 
                                key={msg.id} 
                                sx={{ 
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '70%'
                                }}
                            >
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2, 
                                        bgcolor: isMe ? 'primary.main' : 'background.default',
                                        color: isMe ? 'primary.contrastText' : 'text.primary',
                                        borderRadius: 2,
                                        borderTopRightRadius: isMe ? 0 : 2,
                                        borderTopLeftRadius: isMe ? 2 : 0,
                                        border: isMe ? 'none' : `1px solid ${theme.palette.divider}`,
                                        boxShadow: theme.shadows[1]
                                    }}
                                >
                                    <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                        {msg.contenido}
                                    </Typography>
                                </Paper>
                                <Stack direction="row" justifyContent={isMe ? 'flex-end' : 'flex-start'} spacing={0.5} mt={0.5}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        {format(new Date(msg.fecha_envio), "dd/MM HH:mm", { locale: es })}
                                    </Typography>
                                    {isMe && msg.leido && <ReadIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
                                </Stack>
                            </Box>
                        );
                    })
                ) : (
                    <Box textAlign="center" mt={4} color="text.secondary">
                        <Typography>Escribe tu primer mensaje para iniciar la conversación.</Typography>
                    </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box p={2} borderTop={`1px solid ${theme.palette.divider}`} bgcolor="background.default">
                <Stack direction="row" spacing={1}>
                    <TextField 
                        fullWidth 
                        placeholder="Escribe tu mensaje..." 
                        size="small"
                        variant="outlined"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        multiline
                        maxRows={3}
                    />
                    <IconButton 
                        onClick={() => sendMutation.mutate()}
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          '&:hover': { bgcolor: 'primary.dark' }, 
                          width: 40, height: 40, alignSelf: 'flex-end',
                          '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                        }}
                    >
                        {sendMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                    </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" color="text.disabled" flexDirection="column" gap={2}>
               <PersonIcon sx={{ fontSize: 60, opacity: 0.2 }} />
               <Typography variant="h6" color="text.secondary">Selecciona una conversación</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default MensajesPage;