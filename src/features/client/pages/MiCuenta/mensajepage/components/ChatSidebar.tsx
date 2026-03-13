import { Person as PersonIcon, SupportAgent as SupportIcon } from '@mui/icons-material';
import { Avatar, Badge, Box, Button, CircularProgress, Divider, List, ListItemAvatar, ListItemButton, Typography, alpha, useTheme } from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import type { ConversationItem } from '../hooks/useChatLogic';


interface Props {
    conversations: ConversationItem[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    isLoading: boolean;
    systemId: number;
}

const ChatSidebar: React.FC<Props> = ({ conversations, selectedId, onSelect, isLoading, systemId }) => {
    const theme = useTheme();

    return (
        <Box sx={{ width: { xs: 80, md: 320 }, borderRight: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Box p={2} display={{ xs: 'none', md: 'flex' }} justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">CHATS ({conversations.length})</Typography>
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                {isLoading ? (
                    <Box p={4} textAlign="center"><CircularProgress size={24} /></Box>
                ) : (
                    conversations.map((chat) => (
                        <ListItemButton
                            key={chat.contactId}
                            selected={selectedId === chat.contactId}
                            onClick={() => onSelect(chat.contactId)}
                            sx={{
                                py: 2,
                                borderLeft: selectedId === chat.contactId ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                            }}
                        >
                            <ListItemAvatar>
                                <Badge badgeContent={chat.unreadCount} color="error">
                                    <Avatar sx={{ bgcolor: chat.contactId === systemId ? 'secondary.main' : alpha(theme.palette.primary.main, 0.1), color: chat.contactId === systemId ? 'white' : 'primary.main' }}>
                                        {chat.contactId === systemId ? <SupportIcon /> : <PersonIcon />}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, minWidth: 0 }}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="subtitle2" fontWeight={chat.unreadCount > 0 ? 800 : 600} noWrap>{chat.contactName}</Typography>
                                    <Typography variant="caption" color="text.disabled">{format(new Date(chat.lastMessage.fecha_envio), 'HH:mm')}</Typography>
                                </Box>
                                <Typography variant="caption" noWrap display="block" color={chat.unreadCount > 0 ? "text.primary" : "text.secondary"}>{chat.lastMessage.contenido}</Typography>
                            </Box>
                        </ListItemButton>
                    ))
                )}
            </List>
            {!conversations.find(c => c.contactId === systemId) && (
                <Box p={2} mt="auto" display={{ xs: 'none', md: 'block' }}>
                    <Button variant="contained" fullWidth startIcon={<SupportIcon />} onClick={() => onSelect(systemId)}>Contactar Soporte</Button>
                </Box>
            )}
        </Box>
    );
};

export default ChatSidebar;