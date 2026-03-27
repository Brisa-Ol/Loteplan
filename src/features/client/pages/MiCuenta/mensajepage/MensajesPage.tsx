import { PageContainer, PageHeader } from '@/shared';
import { Box, Paper, useTheme } from '@mui/material';
import React, { useEffect, useRef } from 'react';

import { SYSTEM_USER_ID, useChatLogic } from './hooks/useChatLogic';

import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import ChatSidebar from './components/ChatSidebar';
import EmptyChatState from './components/EmptyChatState';
import MessageList from './components/MessageList';

const MensajesPage: React.FC = () => {
  const theme = useTheme();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Registro de IDs ya enviados al backend para marcar como leídos.
  // Aunque el efecto se re-ejecute (por polling o cambio de chat), nunca
  // se duplica un PUT para el mismo mensaje.
  const markedIdsRef = useRef(new Set<number>());

  const {
    user,
    conversations,
    isLoading,
    selectedContactId,
    setSelectedContactId,
    newMessage,
    setNewMessage,
    sendMutation,
    markRead,
  } = useChatLogic();

  const activeChat = conversations.find(c => c.contactId === selectedContactId);

  // Limpiar el registro al cambiar de conversación para que los mensajes
  // no leídos del nuevo chat sí se procesen correctamente.
  useEffect(() => {
    markedIdsRef.current.clear();
  }, [selectedContactId]);

  // 1. Auto-selección inicial
  useEffect(() => {
    if (!selectedContactId && conversations.length > 0) {
      setSelectedContactId(conversations[0].contactId);
    }
  }, [conversations, selectedContactId, setSelectedContactId]);

  // 2. Scroll automático al recibir mensajes nuevos o cambiar de chat
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedContactId, activeChat?.allMessages.length]);

  // 3. Marcar mensajes como leídos.
  // El ref `markedIdsRef` actúa como guardia: cada ID solo se envía una vez,
  // independientemente de cuántas veces se re-ejecute el efecto (polling, etc.)
  useEffect(() => {
    if (!selectedContactId || !user || !activeChat) return;

    activeChat.allMessages
      .filter(msg =>
        msg.id_receptor === user.id &&
        !msg.leido &&
        !markedIdsRef.current.has(msg.id)
      )
      .forEach(msg => {
        markedIdsRef.current.add(msg.id);
        markRead(msg.id);
      });
  }, [selectedContactId, user?.id, activeChat?.allMessages.length, markRead]);

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
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedContactId}
          onSelect={setSelectedContactId}
          isLoading={isLoading}
          systemId={SYSTEM_USER_ID}
        />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fb' }}>
          {selectedContactId ? (
            <>
              <ChatHeader
                activeChat={activeChat}
                systemId={SYSTEM_USER_ID}
                selectedContactId={selectedContactId}
              />
              <MessageList
                ref={chatContainerRef}
                messages={activeChat?.allMessages || []}
                currentUserId={user?.id}
              />
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
              />
            </>
          ) : (
            <EmptyChatState />
          )}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default MensajesPage;