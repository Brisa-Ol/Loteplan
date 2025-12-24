import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography 
} from '@mui/material';
import { Warning, Info, Help, CheckCircle } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../hooks/useConfirmDialog';

interface Props {
  // Recibe directamente el objeto retornado por el hook
  controller: ReturnType<typeof useConfirmDialog>; 
  onConfirm: () => void;
  isLoading?: boolean;
  
  // Props opcionales para personalizar desde el padre
  title?: string;
  description?: string;
}

export const ConfirmDialog: React.FC<Props> = ({ 
  controller, 
  onConfirm, 
  isLoading,
  title,
  description
}) => {
  const { open, close, config } = controller;

  // 1. Calculamos los textos finales.
  const displayTitle = title || config?.title || 'Confirmar acción';
  const displayDesc = description || config?.description || '¿Estás seguro de realizar esta acción?';
  
  // 2. Calculamos la severidad. 
  // Si no existe config, usamos 'info' como default (que usaremos para el ícono de pregunta).
  const severity = config?.severity || 'info';
  const confirmText = config?.confirmText || 'Confirmar';

  // 3. Helper para decidir el color del botón según severidad
  const getButtonColor = () => {
    if (severity === 'error') return 'error';
    if (severity === 'warning') return 'warning';
    if (severity === 'success') return 'success';
    return 'primary'; // para 'info' o default
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : close} 
      maxWidth="xs" 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* LÓGICA DE ICONOS CORREGIDA */}
        {severity === 'error' && <Warning color="error" />}
        {severity === 'warning' && <Warning color="warning" />}
        {severity === 'success' && <CheckCircle color="success" />}
        {/* Usamos 'info' para mostrar el signo de interrogación (Help) */}
        {severity === 'info' && <Help color="primary" />}
        
        {displayTitle}
      </DialogTitle>
      
      <DialogContent>
        <Typography>{displayDesc}</Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={close} disabled={isLoading} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isLoading}
          variant="contained" 
          color={getButtonColor()}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};