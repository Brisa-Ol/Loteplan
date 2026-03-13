import { DoneAll as ReadIcon } from '@mui/icons-material';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { forwardRef } from 'react';

interface Props {
    messages: any[];
    currentUserId?: number;
}

const MessageList = forwardRef<HTMLDivElement, Props>(({ messages, currentUserId }, ref) => {
    return (
        <Box ref={ref} sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, scrollBehavior: 'smooth' }}>
            {messages.map((msg) => {
                const isMe = msg.id_remitente === currentUserId;
                return (
                    <Box key={msg.id} sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: { xs: '85%', md: '65%' }, display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <Paper elevation={0} sx={{ p: 1.5, px: 2, bgcolor: isMe ? 'primary.main' : 'white', color: isMe ? 'primary.contrastText' : 'text.primary', borderRadius: 2, borderTopRightRadius: isMe ? 0 : 2, borderTopLeftRadius: isMe ? 2 : 0 }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.contenido}</Typography>
                        </Paper>
                        <Stack direction="row" spacing={0.5} mt={0.5} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                {format(new Date(msg.fecha_envio), "HH:mm", { locale: es })}
                            </Typography>
                            {isMe && msg.leido && <ReadIcon sx={{ fontSize: 14, color: 'info.main' }} />}
                        </Stack>
                    </Box>
                );
            })}
        </Box>
    );
});

export default MessageList;