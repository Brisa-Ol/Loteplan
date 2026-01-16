import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Avatar, useTheme, alpha, TextField, Stack, useMediaQuery
} from '@mui/material';
import { Warning, Help, CheckCircle, ErrorOutline } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../../hooks/useConfirmDialog';

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
  
  // ✅ DETECCIÓN MÓVIL: Para ajustar los botones
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { open, close, config } = controller;
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);

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
      // ✅ LIMPIEZA: Eliminamos PaperProps con borderRadius hardcodeado.
      // El theme ya se encarga de darle bordes (12px desk / 8px mobile) y sombras.
    >
      <DialogTitle sx={{ 
          // ✅ MANTENEMOS solo lo cosmético/color, el padding lo maneja el theme
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: alpha(severityColor, 0.04),
          borderBottom: `1px solid ${alpha(severityColor, 0.1)}` // Sutil separador
      }}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(severityColor, 0.1), color: severityColor, width: 40, height: 40 }}>
            {severityIcon}
          </Avatar>
          <Typography variant="h6" component="span" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            {displayTitle}
          </Typography>
      </DialogTitle>
      
      {/* ✅ LIMPIEZA: Quitamos sx={{ px: 3 }} porque el theme ya pone el padding correcto */}
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}> 
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
                    size="small" // El theme ya ajusta las fuentes en mobile
                    multiline
                    minRows={2}
                    maxRows={4}
                />
            )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ 
          bgcolor: alpha(theme.palette.background.default, 0.5), 
          borderTop: `1px solid ${theme.palette.divider}`,
          // ✅ MEJORA UX: En móvil cambiamos la dirección de los botones
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: isMobile ? 2 : 0,
      }}>
        <Button 
            onClick={close} 
            disabled={isLoading} 
            color="inherit" 
            fullWidth={isMobile} // Botón ancho completo en móvil
            sx={{ 
                borderRadius: 2, 
                fontWeight: 600, 
                mr: isMobile ? 0 : 'auto' // Quitamos el margen derecho en móvil al estar en columna
            }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirmClick} 
          disabled={isConfirmDisabled}
          variant="contained" 
          color={btnColor}
          fullWidth={isMobile} // Botón ancho completo en móvil
          disableElevation
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};