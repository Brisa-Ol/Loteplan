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
  // Detectar si es móvil para ajustar botones
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

  // 🎨 CONFIGURACIÓN VISUAL OPTIMIZADA PARA TU TEMA
  const getSeverityData = () => {
    switch(severity) {
      case 'error': 
        return { 
            // Rojo para acciones destructivas (Borrar)
            color: theme.palette.error.main, 
            icon: <ErrorOutline />, 
            btnColor: 'error' as const,
            bgAlpha: 0.08
        };
      case 'success': 
        return { 
            // Verde para éxito
            color: theme.palette.success.main, 
            icon: <CheckCircle />, 
            btnColor: 'success' as const,
            bgAlpha: 0.08
        };
      case 'warning': 
        // 🌟 CAMBIO CLAVE:
        // Aunque semánticamente es 'warning', visualmente usamos el estilo PRIMARY (Tu Naranja)
        // para que se vea igual que el de "Cerrar sesión".
        return { 
            color: theme.palette.primary.main, 
            icon: <Help />, // Usamos el signo de interrogación para mantener consistencia
            btnColor: 'primary' as const, 
            bgAlpha: 0.08
        };
      default: // info
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

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : close} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
            // Usamos el borde definido en tu tema (borderRadius: 12 según tu theme.ts)
            borderRadius: 3, 
            boxShadow: theme.shadows[8], // Sombra suave
            overflow: 'hidden'
        }
      }}
    >
      {/* HEADER CON COLOR DE FONDO SUAVE */}
      <DialogTitle sx={{ 
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: alpha(severityColor, bgAlpha), // Fondo sutil del color principal
          pt: 3, pb: 2, px: 3
      }}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(severityColor, 0.15), color: severityColor, width: 42, height: 42, borderRadius: 2 }}>
            {severityIcon}
          </Avatar>
          <Typography variant="h6" component="span" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            {displayTitle}
          </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 1, pt: 2 }}>
        <Stack spacing={2}> 
            {/* Aumentamos un poco el peso de la fuente para mejor legibilidad */}
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
                    helperText={isInputInvalid ? "Este campo es requerido (mínimo 3 caracteres)" : ""}
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={4}
                />
            )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ 
          p: 3,
          pt: 2,
          // En móvil apilamos los botones, en escritorio van en fila
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
                mr: isMobile ? 0 : 'auto', 
                px: 3,
                '&:hover': {
                    backgroundColor: theme.palette.action.hover
                }
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
            sx={{ 
                borderRadius: 2, 
                fontWeight: 700, 
                px: 4, 
                py: 1.2,
                boxShadow: theme.shadows[4]
            }}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};