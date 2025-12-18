import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Warning, Info, Help } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../hooks/useConfirmDialog';



interface Props {
  // Recibe directamente el objeto retornado por el hook
  controller: ReturnType<typeof useConfirmDialog>; 
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<Props> = ({ controller, onConfirm, isLoading }) => {
  const { open, close, config } = controller;

  if (!config) return null;

  return (
    <Dialog open={open} onClose={isLoading ? undefined : close} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {config.severity === 'error' ? <Warning color="error" /> : <Help color="primary" />}
        {config.title}
      </DialogTitle>
      
      <DialogContent>
        <Typography>{config.description}</Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={close} disabled={isLoading} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isLoading}
          variant="contained" 
          color={config.severity === 'info' ? 'primary' : config.severity}
        >
          {config.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};