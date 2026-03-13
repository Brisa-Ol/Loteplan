import { ChatBubbleOutline } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

const EmptyChatState = () => (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%" color="text.disabled" flexDirection="column" gap={2}>
        <ChatBubbleOutline sx={{ fontSize: 80, opacity: 0.1 }} />
        <Typography variant="h6" color="text.secondary">Selecciona una conversación</Typography>
    </Box>
);

export default EmptyChatState;