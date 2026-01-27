// src/components/common/ConfirmDialog/ConfirmDialog.tsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Avatar, useTheme, alpha, TextField, Stack, useMediaQuery, Slide, CircularProgress
} from '@mui/material';
import { Help, CheckCircle, ErrorOutline } from '@mui/icons-material';
import type { useConfirmDialog } from '../../../../hooks/useConfirmDialog';
import type { TransitionProps } from 'node_modules/@mui/material/esm/transitions/transition';

// ════════════════════════════════════════════════════════════
// ✨ UX: ANIMACIÓN SLIDE
// ════════════════════════════════════════════════════════════
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { open, close, config } = controller;
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset del estado al abrir
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

  // 🎨 CONFIGURACIÓN VISUAL
  const getSeverityData = () => {
    switch(severity) {
      case 'error': 
        return { 
          color: theme.palette.error.main, 
          icon: <ErrorOutline />, 
          btnColor: 'error' as const,
          bgAlpha: 0.08
        };
      case 'success': 
        return { 
          color: theme.palette.success.main, 
          icon: <CheckCircle />, 
          btnColor: 'success' as const,
          bgAlpha: 0.08
        };
      case 'warning': 
        return { 
          color: theme.palette.primary.main, // Mantenemos tu preferencia de Primary para Warnings
          icon: <Help />, 
          btnColor: 'primary' as const, 
          bgAlpha: 0.08
        };
      default: 
        return { 
          color: theme.palette.primary.main, 
          icon: <Help />, 
          btnColor: 'primary' as const,
          bgAlpha: 0.08
        };
    }
  };

  const { color: severityColor, icon: severityIcon, btnColor, bgAlpha } = getSeverityData();

  const handleConfirmClick = () => {
    if (config.requireInput && inputValue.trim().length < 3) {
      setTouched(true);
      return;
    }
    onConfirm(inputValue);
  };

  const isInputInvalid = config.requireInput && touched && inputValue.trim().length < 3;
  const isConfirmDisabled = isLoading || (config.requireInput && inputValue.trim().length < 3);

  // ✨ UX: MANEJO DE TECLADO INTELIGENTE
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Si está cargando o deshabilitado, ignorar
    if (isLoading || isConfirmDisabled) return;

    // Caso 1: Input requerido (Textarea)
    if (config.requireInput) {
      // Permitir enviar con Ctrl + Enter (Estándar de UX en formularios)
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleConfirmClick();
      }
      // Enter normal hace salto de línea en el textarea, así que no hacemos nada
    } 
    // Caso 2: Confirmación simple (Sí/No)
    else {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirmClick();
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      // ✨ UX: Evita cierre accidental si está cargando
      onClose={(event, reason) => {
        if (isLoading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        close();
      }}
      TransitionComponent={Transition} // ✨ UX: Animación
      maxWidth="xs" 
      fullWidth
      onKeyDown={handleKeyDown} // ✨ UX: Listener de teclado
      PaperProps={{
        elevation: 24, // ✨ UX: Mayor profundidad para destacar sobre el contenido
        sx: {
          borderRadius: 3, 
          overflow: 'hidden'
        }
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: alpha(severityColor, bgAlpha), 
          pt: 3, pb: 2, px: 3
      }}>
          <Avatar variant="rounded" sx={{ 
            bgcolor: alpha(severityColor, 0.15), 
            color: severityColor, 
            width: 42, 
            height: 42, 
            borderRadius: 2 
          }}>
            {severityIcon}
          </Avatar>
          <Typography variant="h6" component="span" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            {displayTitle}
          </Typography>
      </DialogTitle>
      
      {/* CONTENT */}
      <DialogContent sx={{ px: 3, pb: 1, pt: 2 }}>
        <Stack spacing={2}> 
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
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
                    helperText={isInputInvalid 
                      ? "Este campo es requerido (mínimo 3 caracteres)" 
                      : "Presiona Ctrl + Enter para confirmar"} // ✨ UX: Tip para el usuario
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={4}
                    disabled={isLoading}
                    sx={{
                      // Estilo visual sutil para el input
                      '& .MuiOutlinedInput-root': {
                        bgcolor: alpha(theme.palette.background.paper, 0.5)
                      }
                    }}
                />
            )}
        </Stack>
      </DialogContent>
      
      {/* ACTIONS */}
      <DialogActions sx={{ 
          p: 3,
          pt: 2,
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: isMobile ? 1.5 : 1,
      }}>
        <Button 
            onClick={close} 
            disabled={isLoading} 
            color="inherit" 
            fullWidth={isMobile}
            sx={{ 
                borderRadius: 2, 
                fontWeight: 600, 
                color: 'text.secondary',
                textTransform: 'none', // ✨ UX: Texto más legible
                mr: isMobile ? 0 : 'auto', 
                px: 3,
            }}
        >
          Cancelar
        </Button>
        <Button 
            onClick={handleConfirmClick} 
            disabled={isConfirmDisabled}
            variant="contained" 
            color={btnColor} 
            fullWidth={isMobile}
            disableElevation
            // ✨ UX: Spinner integrado en lugar de cambiar todo el texto
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
                borderRadius: 2, 
                fontWeight: 700, 
                textTransform: 'none', // ✨ UX: Texto más legible
                px: 4, 
                py: 1, // Ajuste ligero para compensar el icono
                boxShadow: theme.shadows[4],
                minWidth: 120 // Evita que el botón cambie de tamaño drásticamente
            }}
        >
          {/* Mantenemos el texto visible, el spinner va a la izquierda */}
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};