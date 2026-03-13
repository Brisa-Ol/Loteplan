import React from 'react';
import { Box, Avatar, Typography, useTheme } from '@mui/material';
import { SupportAgent as SupportIcon } from '@mui/icons-material';

interface Props {
  activeChat: any;
  systemId: number;
}

const ChatHeader: React.FC<Props> = ({ activeChat, systemId }) => {
  const theme = useTheme();
  const isSupport = activeChat?.contactId === systemId;

  return (
    <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`} display="flex" alignItems="center" gap={2} bgcolor="background.paper" zIndex={1}>
      <Avatar sx={{ bgcolor: isSupport ? 'secondary.main' : 'primary.main', color: 'white' }}>
        {isSupport ? <SupportIcon /> : activeChat?.contactName?.charAt(0)}
      </Avatar>
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">{isSupport ? 'Soporte Técnico' : activeChat?.contactName}</Typography>
        {isSupport && (
          <Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5}>
            <Box width={6} height={6} borderRadius="50%" bgcolor="success.main" /> En línea
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ChatHeader;