import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Avatar, useTheme, alpha, TextField, Stack
} from '@mui/material';
import { Warning, Help, CheckCircle, ErrorOutline } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../hooks/useConfirmDialog';

interface Props {
  controller: ReturnType<typeof useConfirmDialog>; 
  onConfirm: (inputValue?: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const ConfirmDialog: React.FC<Props> = ({ 
  controller, onConfirm, isLoading, title, description
}) => {
  const theme = useTheme();
  const { open, close, config } = controller;
  
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false); // Para mostrar error solo si tocó

  useEffect(() => {
    if (open) {
        setInputValue('');
        setTouched(false);
    }
  }, [open]);
  
  if (!config) return null;

  const displayTitle = title || config.title;
  const displayDesc = description || config.description;
  const severity = config.severity || 'info';
  const confirmText = config.confirmText || 'Confirmar';

  const getSeverityData = () => {
    switch(severity) {
      case 'error': return { color: theme.palette.error.main, icon: <ErrorOutline />, btnColor: 'error' as const };
      case 'warning': return { color: theme.palette.warning.main, icon: <Warning />, btnColor: 'warning' as const };
      case 'success': return { color: theme.palette.success.main, icon: <CheckCircle />, btnColor: 'success' as const };
      default: return { color: theme.palette.primary.main, icon: <Help />, btnColor: 'primary' as const };
    }
  };

  const { color: severityColor, icon: severityIcon, btnColor } = getSeverityData();

  const handleConfirmClick = () => {
    if (config.requireInput && inputValue.trim().length < 3) {
        setTouched(true);
        return;
    }
    onConfirm(inputValue);
  };

  const isInputInvalid = config.requireInput && touched && inputValue.trim().length < 3;
  const isConfirmDisabled = isLoading || (config.requireInput && inputValue.trim().length < 3);

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : close} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: theme.shadows[10], overflow: 'hidden' }
      }}
    >
      <DialogTitle sx={{ 
          pb: 2, pt: 3, px: 3,
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: alpha(severityColor, 0.04)
      }}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(severityColor, 0.1), color: severityColor, width: 40, height: 40 }}>
            {severityIcon}
          </Avatar>
          <Typography variant="h6" component="span" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            {displayTitle}
          </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">
            {displayDesc}
            </Typography>

            {config.requireInput && (
                <TextField
                    autoFocus
                    fullWidth
                    variant="outlined"
                    label={config.inputLabel || "Motivo"}
                    placeholder={config.inputPlaceholder || "Escribe aquí..."}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (touched) setTouched(false);
                    }}
                    onBlur={() => setTouched(true)}
                    error={isInputInvalid}
                    helperText={isInputInvalid ? "Este campo es requerido (mínimo 3 caracteres)" : ""}
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={4}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5), borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={close} disabled={isLoading} color="inherit" sx={{ borderRadius: 2, fontWeight: 600, mr: 'auto' }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirmClick} 
          disabled={isConfirmDisabled}
          variant="contained" 
          color={btnColor}
          disableElevation
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};