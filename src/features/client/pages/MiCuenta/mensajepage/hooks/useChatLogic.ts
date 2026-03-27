import MensajeService from '@/core/api/services/mensaje.service';
import { useAuth } from '@/core/context/AuthContext';
import type { MensajeDto } from '@/core/types/mensaje';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export const SYSTEM_USER_ID = 2;

const REFETCH_INTERVAL = Number(import.meta.env.VITE_QUERY_REFETCH_INTERVAL) || 30_000;

export interface ConversationItem {
  contactId: number;
  contactName: string;
  lastMessage: MensajeDto;
  unreadCount: number;
  allMessages: MensajeDto[];
}

export const useChatLogic = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { data: mensajes = [], isLoading } = useQuery<MensajeDto[]>({
    queryKey: ['misMensajes'],
    queryFn: async () => (await MensajeService.obtenerMisMensajes()).data,
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });

  const conversations = useMemo((): ConversationItem[] => {
    if (!user) return [];
    const map = new Map<number, MensajeDto[]>();

    mensajes.forEach((msg: MensajeDto) => {
      const otherId = msg.id_remitente === user.id ? msg.id_receptor : msg.id_remitente;
      if (!map.has(otherId)) map.set(otherId, []);
      map.get(otherId)?.push(msg);
    });

    return Array.from(map.entries()).map(([contactId, msgs]) => {
      msgs.sort((a: MensajeDto, b: MensajeDto) =>
        new Date(a.fecha_envio).getTime() - new Date(b.fecha_envio).getTime()
      );

      const lastMsg = msgs[msgs.length - 1];
      const contactInfo = contactId === lastMsg.id_remitente ? lastMsg.remitente : lastMsg.receptor;

      return {
        contactId,
        contactName: contactId === SYSTEM_USER_ID ? 'Soporte Técnico' : `${contactInfo?.nombre} ${contactInfo?.apellido}`,
        lastMessage: lastMsg,
        unreadCount: msgs.filter((m: MensajeDto) => m.id_receptor === user.id && !m.leido).length,
        allMessages: msgs,
      };
    }).sort((a, b) =>
      new Date(b.lastMessage.fecha_envio).getTime() - new Date(a.lastMessage.fecha_envio).getTime()
    );
  }, [mensajes, user]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContactId || !newMessage.trim()) {
        throw new Error('No hay destinatario o el mensaje está vacío.');
      }
      return await MensajeService.enviarMensaje({ id_receptor: selectedContactId, contenido: newMessage });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['misMensajes'] });
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (msgId: number) => MensajeService.marcarComoLeido(msgId),
    onSuccess: (_, msgId) => {

      queryClient.setQueryData<MensajeDto[]>(['misMensajes'], (old = []) =>
        old.map(m => (m.id === msgId ? { ...m, leido: true } : m))
      );
      // Solo invalida el conteo del badge (request pequeño, necesario para el navbar).
      queryClient.invalidateQueries({ queryKey: ['mensajesNoLeidos'] });
    },
  });

  return {
    user,
    conversations,
    isLoading,
    selectedContactId,
    setSelectedContactId,
    newMessage,
    setNewMessage,
    sendMutation,
    markRead,
  };
};