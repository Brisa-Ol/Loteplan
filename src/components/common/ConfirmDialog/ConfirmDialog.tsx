import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Avatar, useTheme, alpha, TextField 
} from '@mui/material';
import { Warning, Help, CheckCircle, ErrorOutline } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../hooks/useConfirmDialog';

interface Props {
  controller: ReturnType<typeof useConfirmDialog>; 
  onConfirm: (inputValue?: string) => void; // ✅ Recibe string opcional
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const ConfirmDialog: React.FC<Props> = ({ 
  controller, onConfirm, isLoading, title, description
}) => {
  const theme = useTheme();
  const { open, close, config } = controller;
  
  // ✅ Estado para el input
  const [inputValue, setInputValue] = useState('');

  // Limpiar input al abrir
  useEffect(() => {
    if (open) setInputValue('');
  }, [open]);
  
  if (!config) return null;

  const displayTitle = title || config.title;
  const displayDesc = description || config.description;
  const severity = config.severity || 'info';
  const confirmText = config.confirmText || 'Confirmar';

  const getSeverityColor = () => {
    switch(severity) {
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'success': return theme.palette.success.main;
      default: return theme.palette.primary.main;
    }
  };

  const getSeverityIcon = () => {
    switch(severity) {
      case 'error': return <ErrorOutline />;
      case 'warning': return <Warning />;
      case 'success': return <CheckCircle />;
      default: return <Help />;
    }
  };

  const getButtonColor = (): 'error' | 'warning' | 'success' | 'primary' => {
    switch(severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'primary';
    }
  };

  const severityColor = getSeverityColor();

  const handleConfirmClick = () => {
    onConfirm(inputValue);
  };

  // Bloquear si es requerido y está vacío
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
            {getSeverityIcon()}
          </Avatar>
         <Typography variant="h6" component="span" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            {displayTitle}
         </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Typography variant="body1" color="text.secondary" mb={config.requireInput ? 2 : 0}>
          {displayDesc}
        </Typography>

        {/* ✅ RENDERIZADO DEL INPUT */}
        {config.requireInput && (
            <TextField
                autoFocus
                fullWidth
                variant="outlined"
                label={config.inputLabel || "Motivo"}
                placeholder={config.inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                size="small"
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5), borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={close} disabled={isLoading} color="inherit" sx={{ borderRadius: 2, fontWeight: 600, mr: 'auto' }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirmClick} 
          disabled={isConfirmDisabled}
          variant="contained" 
          color={getButtonColor()}
          disableElevation
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};