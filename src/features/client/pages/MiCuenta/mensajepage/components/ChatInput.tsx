import React from 'react';
import { Box, Stack, TextField, IconButton, CircularProgress, useTheme } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<Props> = ({ value, onChange, onSend, disabled }) => {

  const theme = useTheme();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box p={2} bgcolor="background.paper" borderTop={`1px solid ${theme.palette.divider}`}>
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          placeholder="Escribe tu mensaje..."
          size="small"
          multiline
          maxRows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <IconButton
          onClick={onSend}
          disabled={!value.trim() || disabled}
          color="primary"
          sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 40, height: 40 }}
        >
          {disabled ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Stack>
    </Box>
  );
};

export default ChatInput;