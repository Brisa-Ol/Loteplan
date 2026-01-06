// src/components/common/ConfirmDialog/ConfirmDialog.tsx

import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Avatar, useTheme, alpha, Box
} from '@mui/material';
import { Warning, Help, CheckCircle, ErrorOutline } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../hooks/useConfirmDialog';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controller: ReturnType<typeof useConfirmDialog<any>>; 
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const ConfirmDialog: React.FC<Props> = ({ 
  controller, onConfirm, isLoading, title, description
}) => {
  const theme = useTheme();
  const { open, close, config } = controller;
  
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

  const severityColor = getSeverityColor();

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : close} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3, 
          boxShadow: theme.shadows[10], 
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        component="div" // ✅ CORRECCIÓN 1: Renderizar DialogTitle como div para evitar h2 automático
        sx={{ 
          pb: 2, pt: 3, px: 3,
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: alpha(severityColor, 0.04) 
      }}>
          <Avatar 
            variant="rounded"
            sx={{ 
              bgcolor: alpha(severityColor, 0.1), 
              color: severityColor,
              width: 40, height: 40 
            }}
          >
            {getSeverityIcon()}
          </Avatar>
          
          {/* ✅ CORRECCIÓN 2: Typography con component="span" o "div" */}
          <Typography 
            variant="h6" 
            component="span" 
            fontWeight={800} 
            color="text.primary" 
            sx={{ lineHeight: 1.2 }}
          >
            {displayTitle}
          </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {displayDesc}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ 
          p: 3, 
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button 
          onClick={close} 
          disabled={isLoading} 
          color="inherit"
          sx={{ borderRadius: 2, fontWeight: 600, mr: 'auto' }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isLoading}
          variant="contained" 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color={severity === 'info' ? 'primary' : (severity as any)}
          disableElevation
          sx={{ 
            borderRadius: 2, 
            fontWeight: 700, 
            px: 3,
            color: severity === 'success' ? '#fff' : 'inherit'
          }}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};