// src/components/common/BaseModal/BaseModal.tsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip,
  Slide,
  type DialogProps,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { TransitionProps } from 'node_modules/@mui/material/esm/transitions/transition';

// ════════════════════════════════════════════════════════════
// ANIMACIÓN (UX)
// ════════════════════════════════════════════════════════════

// Transición suave hacia arriba tipo "Slide"
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

export interface BaseModalProps extends Omit<DialogProps, 'onClose'> {
  /** Control de visibilidad del modal */
  open: boolean;
  
  /** Callback al cerrar el modal */
  onClose: () => void;
  
  /** Título principal del modal */
  title: string;
  
  /** Subtítulo descriptivo (opcional) */
  subtitle?: string;
  
  /** Ícono para el avatar del header (opcional) */
  icon?: React.ReactNode;
  
  /** Color del avatar/header - por defecto 'primary' */
  headerColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  
  /** Contenido del modal */
  children: React.ReactNode;
  
  /** Texto del botón de cancelar - por defecto "Cancelar" */
  cancelText?: string;
  
  /** Texto del botón de confirmar - por defecto "Confirmar" */
  confirmText?: string;
  
  /** Callback al confirmar */
  onConfirm?: () => void;
  
  /** Estado de carga del modal */
  isLoading?: boolean;
  
  /** Deshabilitar botón de confirmar */
  disableConfirm?: boolean;
  
  /** Ocultar botón de cancelar */
  hideCancelButton?: boolean;
  
  /** Ocultar botón de confirmar */
  hideConfirmButton?: boolean;
  
  /** Color del botón de confirmar */
  confirmButtonColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  
  /** Variante del botón de confirmar */
  confirmButtonVariant?: 'contained' | 'outlined' | 'text';
  
  /** Ícono del botón de confirmar (opcional) */
  confirmButtonIcon?: React.ReactNode;
  
  /** Ancho máximo del modal - por defecto 'md' */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Habilitar scroll interno - por defecto 'paper' */
  scroll?: 'paper' | 'body';
  
  /** Acciones personalizadas del footer (reemplaza botones default) */
  customActions?: React.ReactNode;
  
  /** Contenido adicional en el header (a la izquierda del close) */
  headerExtra?: React.ReactNode;
  
  /** Deshabilitar el cierre del modal (útil durante loading) */
  disableClose?: boolean;
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  headerColor = 'primary',
  children,
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  onConfirm,
  isLoading = false,
  disableConfirm = false,
  hideCancelButton = false,
  hideConfirmButton = false,
  confirmButtonColor = 'primary',
  confirmButtonVariant = 'contained',
  confirmButtonIcon,
  maxWidth = 'md',
  scroll = 'paper',
  customActions,
  headerExtra,
  disableClose = false,
  ...dialogProps
}) => {
  const theme = useTheme();
  
  // Detección móvil
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const headerColorValue = theme.palette[headerColor].main;

  // Lógica de cierre segura
  const handleClose = () => {
    if (!isLoading && !disableClose) {
      onClose();
    }
  };

  // Lógica de confirmación
  const handleConfirm = () => {
    if (onConfirm && !isLoading && !disableConfirm) {
      onConfirm();
    }
  };

  // ✅ UX: Confirmar con ENTER (ignorando TextAreas)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && onConfirm && !hideConfirmButton && !disableConfirm && !isLoading) {
      const target = event.target as HTMLElement;
      // Si el usuario está escribiendo en un textarea, Enter debe hacer salto de línea, no enviar
      if (target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        handleConfirm();
      }
    }
  };

  return (
    <Dialog
      open={open}
      // ✅ UX: Control fino del cierre (Backdrop/Esc)
      onClose={(event, reason) => {
        if ((isLoading || disableClose) && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
          return;
        }
        handleClose();
      }}
      TransitionComponent={Transition} // ✅ UX: Animación Slide
      maxWidth={maxWidth}
      fullWidth
      fullScreen={dialogProps.fullScreen ?? isMobile}
      scroll={scroll}
      onKeyDown={handleKeyDown} // ✅ UX: Listener de teclado
      aria-labelledby="base-modal-title"
      PaperProps={{
        elevation: 24,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          boxShadow: theme.shadows[10],
          overflow: 'hidden',
          ...(scroll === 'paper' && { maxHeight: isMobile ? '100%' : '90vh' }),
        },
      }}
      {...dialogProps}
    >
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <DialogTitle
        id="base-modal-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          pt: 3,
          px: 3,
          bgcolor: alpha(headerColorValue, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Lado Izquierdo: Avatar + Textos */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
          {icon && (
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(headerColorValue, 0.1),
                color: headerColorValue,
                width: 40,
                height: 40,
              }}
            >
              {icon}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="text.primary"
              sx={{ lineHeight: 1.2 }}
              noWrap // ✅ UX: Previene rotura de layout en títulos largos
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Lado Derecho: Extra + Close Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          {headerExtra}
          
          {/* ✅ UX: Tooltip + Feedback visual al hover */}
          <Tooltip title="Cerrar (Esc)">
            <span>
              <IconButton
                onClick={handleClose}
                size="small"
                disabled={isLoading || disableClose}
                sx={{ 
                  color: 'text.secondary',
                  transition: '0.2s',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.error.main, 0.1), 
                    color: theme.palette.error.main 
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogTitle>

      <Divider />

      {/* ═══════════════════ CONTENT ═══════════════════ */}
      <DialogContent
        dividers={scroll === 'paper'}
        sx={{
          p: { xs: 2, md: 4 },
          ...(scroll === 'paper' && {
            overflow: 'auto',
          }),
        }}
      >
        {children}
      </DialogContent>

      <Divider />

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <DialogActions
        sx={{
          p: 3,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        {customActions ? (
          customActions
        ) : (
          <>
            {!hideCancelButton && (
              <Button
                onClick={handleClose}
                color="inherit"
                disabled={isLoading || disableClose}
                sx={{
                  borderRadius: 2,
                  mr: 'auto',
                  textTransform: 'none', // ✅ UX: Texto más legible
                  fontWeight: 600,
                }}
              >
                {cancelText}
              </Button>
            )}

            {!hideConfirmButton && onConfirm && (
              <Button
                onClick={handleConfirm}
                variant={confirmButtonVariant}
                color={confirmButtonColor}
                disabled={isLoading || disableConfirm}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    confirmButtonIcon
                  )
                }
                sx={{
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none', // ✅ UX: Texto más legible
                  boxShadow: confirmButtonVariant === 'contained' ? 4 : 0,
                }}
              >
                {isLoading ? 'Procesando...' : confirmText}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BaseModal;