// src/pages/client/MiCuenta/MensajesPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Divider, TextField, IconButton, 
  Badge, Stack, CircularProgress, 
  ListItemButton, // 👈 IMPORTADO CORRECTAMENTE
  Button
} from '@mui/material';
import { 
  Send as SendIcon, 
  Person as PersonIcon, 
  AdminPanelSettings as SystemIcon,
  MarkEmailRead as ReadIcon
} from '@mui/icons-material';

import MensajeService from '../../../Services/mensaje.service';

import { useAuth } from '../../../context/AuthContext';
import { PageContainer, PageHeader } from '../../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MensajeDto } from '../../../types/dto/mensaje';

// ID del usuario SISTEMA (definido en tu backend como 2)
const SYSTEM_USER_ID = 2; 

const MensajesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estado para mensaje nuevo
  const [newMessage, setNewMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  // 1. Cargar todos los mensajes
  const { data: mensajes = [], isLoading } = useQuery<MensajeDto[]>({
    queryKey: ['misMensajes'],
    queryFn: async () => (await MensajeService.obtenerMisMensajes()).data,
    refetchInterval: 10000 // Polling cada 10s para "tiempo real"
  });

  // 2. Agrupar mensajes por contacto (Lógica Frontend para armar la lista de la izquierda)
  const conversaciones = useMemo(() => {
    if (!user) return [];
    
    const map = new Map<number, MensajeDto[]>();
    
    mensajes.forEach(msg => {
      // Identificar quién es el "otro" en la conversación
      const isMeSender = msg.id_remitente === user.id;
      const otherId = isMeSender ? msg.id_receptor : msg.id_remitente;
      
      if (!map.has(otherId)) {
        map.set(otherId, []);
      }
      map.get(otherId)?.push(msg);
    });

    // Convertir a array y ordenar por fecha del último mensaje
    return Array.from(map.entries()).map(([contactId, msgs]) => {
      const lastMsg = msgs[msgs.length - 1]; // Asumiendo que vienen ordenados por fecha
      // Buscar datos del contacto
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

  // Efecto para seleccionar automáticamente el primer contacto si no hay selección
  useEffect(() => {
    if (!selectedContactId && conversaciones.length > 0) {
      setSelectedContactId(conversaciones[0].contactId);
    }
  }, [conversaciones, selectedContactId]);

  // 3. Mutación Enviar Mensaje
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

  // 4. Mutación Marcar Leído (Automático al abrir chat)
  const markReadMutation = useMutation({
    mutationFn: async (msgId: number) => MensajeService.marcarComoLeido(msgId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['misMensajes'] });
        queryClient.invalidateQueries({ queryKey: ['mensajesNoLeidos'] }); // Actualizar badge del navbar
    }
  });

  // Efecto: Marcar leídos al seleccionar contacto
  useEffect(() => {
    if (selectedContactId && user) {
      const chat = conversaciones.find(c => c.contactId === selectedContactId);
      if (chat) {
        chat.allMessages.forEach(msg => {
          if (msg.id_receptor === user.id && !msg.leido) {
            markReadMutation.mutate(msg.id);
          }
        });
      }
    }
  }, [selectedContactId, conversaciones, user]);

  // Renderizado del Chat Activo
  const activeChat = conversaciones.find(c => c.contactId === selectedContactId);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader 
        title="Centro de Mensajes" 
        subtitle="Comunícate con soporte o revisa notificaciones del sistema." 
      />

      <Paper 
        sx={{ 
          display: 'flex', 
          height: '75vh', 
          overflow: 'hidden', 
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider' 
        }} 
        elevation={0}
      >
        {/* === SIDEBAR: LISTA DE CONTACTOS === */}
        <Box sx={{ width: 320, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
          <Box p={2}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
              CONVERSACIONES ({conversaciones.length})
            </Typography>
          </Box>
          <Divider />
          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {isLoading ? (
               <Box p={4} textAlign="center"><CircularProgress size={24} /></Box>
            ) : conversaciones.length === 0 ? (
               <Box p={4} textAlign="center"><Typography variant="body2" color="text.secondary">No tienes mensajes.</Typography></Box>
            ) : (
              conversaciones.map((chat) => (
                <React.Fragment key={chat.contactId}>
                  <ListItem disablePadding> {/* ✅ CORRECCIÓN: ListItem solo contenedor */}
                    <ListItemButton         /* ✅ CORRECCIÓN: ListItemButton es el interactivo */
                      selected={selectedContactId === chat.contactId}
                      onClick={() => setSelectedContactId(chat.contactId)}
                      sx={{ 
                        bgcolor: selectedContactId === chat.contactId ? 'action.selected' : 'transparent',
                        borderLeft: selectedContactId === chat.contactId ? '4px solid' : '4px solid transparent',
                        borderLeftColor: 'primary.main'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={chat.unreadCount} color="error">
                          <Avatar sx={{ bgcolor: chat.contactId === SYSTEM_USER_ID ? 'secondary.main' : 'primary.main' }}>
                            {chat.contactId === SYSTEM_USER_ID ? <SystemIcon /> : <PersonIcon />}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle2" fontWeight={chat.unreadCount > 0 ? 700 : 400} noWrap>
                            {chat.contactName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color={chat.unreadCount > 0 ? "text.primary" : "text.secondary"} noWrap display="block">
                            {chat.lastMessage.contenido}
                          </Typography>
                        }
                      />
                      <Typography variant="caption" color="text.disabled" sx={{ minWidth: 40, textAlign: 'right' }}>
                         {format(new Date(chat.lastMessage.fecha_envio), 'HH:mm')}
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))
            )}
            
            {/* Botón flotante para iniciar soporte si no existe chat */}
            {!conversaciones.find(c => c.contactId === SYSTEM_USER_ID) && (
                 <Box p={2}>
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

        {/* === AREA DE CHAT === */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
          {selectedContactId ? (
            <>
              {/* Header Chat */}
              <Box p={2} borderBottom="1px solid" borderColor="divider" display="flex" alignItems="center" gap={2}>
                 <Avatar sx={{ bgcolor: selectedContactId === SYSTEM_USER_ID ? 'secondary.main' : 'primary.main' }}>
                    {selectedContactId === SYSTEM_USER_ID ? <SystemIcon /> : activeChat?.contactName?.charAt(0)}
                 </Avatar>
                 <Typography variant="h6">
                    {selectedContactId === SYSTEM_USER_ID ? 'Soporte / Sistema' : activeChat?.contactName}
                 </Typography>
              </Box>

              {/* Mensajes */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                        bgcolor: isMe ? 'primary.main' : 'grey.100',
                                        color: isMe ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        borderTopRightRadius: isMe ? 0 : 2,
                                        borderTopLeftRadius: isMe ? 2 : 0
                                    }}
                                >
                                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
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
                        <Typography>Inicia una conversación con soporte aquí.</Typography>
                    </Box>
                )}
              </Box>

              {/* Input Area */}
              <Box p={2} borderTop="1px solid" borderColor="divider" bgcolor="background.default">
                <Stack direction="row" spacing={1}>
                    <TextField 
                        fullWidth 
                        placeholder="Escribe tu mensaje..." 
                        size="small"
                        variant="outlined"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMutation.mutate()}
                        multiline
                        maxRows={3}
                        sx={{ bgcolor: 'white' }}
                    />
                    <IconButton 
                        color="primary" 
                        onClick={() => sendMutation.mutate()}
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 40, height: 40 }}
                    >
                        {sendMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                    </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" color="text.secondary">
               <Typography>Selecciona una conversación para empezar</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default MensajesPage;