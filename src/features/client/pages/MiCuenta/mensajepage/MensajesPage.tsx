import { PageContainer, PageHeader } from '@/shared';
import { Box, Paper, useTheme } from '@mui/material';
import React, { useEffect, useRef } from 'react';

// Importamos el Hook de lógica
import { SYSTEM_USER_ID, useChatLogic } from './hooks/useChatLogic';

// Importamos los Sub-componentes
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import ChatSidebar from './components/ChatSidebar';
import EmptyChatState from './components/EmptyChatState';
import MessageList from './components/MessageList';

const MensajesPage: React.FC = () => {
  const theme = useTheme();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Extraemos toda la lógica y estado del Hook
  const {
    user,
    conversations,
    isLoading,
    selectedContactId,
    setSelectedContactId,
    newMessage,
    setNewMessage,
    sendMutation,
    markReadMutation
  } = useChatLogic();

  // Encontramos el chat que el usuario está viendo actualmente
  const activeChat = conversations.find(c => c.contactId === selectedContactId);

  // 1. Efecto de Auto-selección inicial (selecciona el primero de la lista)
  useEffect(() => {
    if (!selectedContactId && conversations.length > 0) {
      setSelectedContactId(conversations[0].contactId);
    }
  }, [conversations, selectedContactId, setSelectedContactId]);

  // 2. Efecto de Scroll automático al recibir mensajes o cambiar de chat
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [selectedContactId, activeChat?.allMessages.length]);

  // 3. Efecto para marcar mensajes como leídos
  useEffect(() => {
    if (selectedContactId && user && activeChat) {
      activeChat.allMessages.forEach(msg => {
        if (msg.id_receptor === user.id && !msg.leido) {
          markReadMutation.mutate(msg.id);
        }
      });
    }
  }, [selectedContactId, activeChat, user, markReadMutation]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Mis Mensajes"
        subtitle="Canal directo de atención y novedades de tu cuenta."
      />

      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          height: '70vh',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
        }}
      >
        {/* Lado Izquierdo: Lista de Chats */}
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedContactId}
          onSelect={setSelectedContactId}
          isLoading={isLoading}
          systemId={SYSTEM_USER_ID}
        />

        {/* Lado Derecho: Contenido del Chat */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fb' }}>
          {selectedContactId ? (
            <>
              {/* Cabecera del chat seleccionado */}
              <ChatHeader
                activeChat={activeChat}
                systemId={SYSTEM_USER_ID}
              />

              {/* Área de burbujas de mensajes */}
              <MessageList
                ref={chatContainerRef}
                messages={activeChat?.allMessages || []}
                currentUserId={user?.id}
              />

              {/* Input para escribir nuevos mensajes */}
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
              />
            </>
          ) : (
            /* Estado cuando no hay nada seleccionado */
            <EmptyChatState />
          )}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default MensajesPage;