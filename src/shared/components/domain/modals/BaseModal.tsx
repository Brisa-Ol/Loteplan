// src/shared/components/domain/modals/BaseModal/BaseModal.tsx

import { Close as CloseIcon } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  type DialogProps
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

export interface BaseModalProps extends Omit<DialogProps, 'onClose'> {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerColor?: ThemeColor;
  children: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  disableConfirm?: boolean;
  hideCancelButton?: boolean;
  hideConfirmButton?: boolean;
  confirmButtonColor?: ThemeColor;
  confirmButtonVariant?: 'contained' | 'outlined' | 'text';
  confirmButtonIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  customActions?: React.ReactNode;
  disableClose?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const Transition = React.forwardRef((
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) => <Slide direction="up" ref={ref} {...props} />);

Transition.displayName = 'BaseModalTransition';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  headerColor = 'primary',
  children,
  cancelText,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // --- Memos & Logic ---
  const headerColorValue = theme.palette[headerColor].main;
  const finalCancelText = useMemo(() =>
    cancelText || (onConfirm ? 'Cancelar' : 'Cerrar'),
    [cancelText, onConfirm]);

  const canClose = !isLoading && !disableClose;

  const handleCloseRequest = () => {
    if (canClose) onClose();
  };

  // --- Styles Objects ---
  const styles = {
    dialogPaper: {
      borderRadius: isMobile ? 0 : 3,
      border: '1px solid',
      borderColor: alpha(theme.palette.divider, 0.1),
      transform: 'translateZ(0)', // Hardware Acceleration
      willChange: 'transform',
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)',
      overflow: 'hidden',
    },
    header: {
      m: 0,
      p: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      bgcolor: alpha(headerColorValue, 0.04),
    },
    avatar: {
      bgcolor: alpha(headerColorValue, 0.1),
      color: headerColorValue,
      width: 44,
      height: 44,
      borderRadius: 2,
      boxShadow: `0 4px 12px ${alpha(headerColorValue, 0.2)}`,
    },
    closeButton: {
      color: theme.palette.text.disabled,
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: alpha(theme.palette.error.main, 0.08),
        color: theme.palette.error.main,
        transform: 'rotate(90deg)',
      }
    },
    actions: {
      p: 3,
      bgcolor: alpha(theme.palette.secondary.light, 0.05),
      gap: 1.5
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      transitionDuration={{ enter: 225, exit: 195 }}
      onClose={(_, reason) => {
        if (!canClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        handleCloseRequest();
      }}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      scroll={scroll}
      slotProps={{
        backdrop: {
          sx: {
            // ✅ Eliminado backdropFilter (difuminado)
            // ✅ Fondo negro con 20% de opacidad para una "sombra" nítida y suave
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            WebkitBackfaceVisibility: 'hidden',
          }
        }
      }}
      PaperProps={{ sx: { ...styles.dialogPaper, ...dialogProps.PaperProps?.sx } }}
      {...dialogProps}
    >
      {/* HEADER */}
      <DialogTitle sx={styles.header}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          {icon && (
            <Avatar variant="rounded" sx={styles.avatar}>
              {icon}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} color="text.primary" noWrap sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {headerExtra}
          <IconButton onClick={handleCloseRequest} disabled={!canClose} sx={styles.closeButton}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ opacity: 0.6 }} />

      {/* CONTENT */}
      <DialogContent sx={{ p: { xs: 3, md: 4 }, bgcolor: 'background.default' }}>
        {children}
      </DialogContent>

      <Divider sx={{ opacity: 0.6 }} />

      {/* ACTIONS */}
      <DialogActions sx={styles.actions}>
        {customActions || (
          <>
            {!hideCancelButton && (
              <Button
                onClick={handleCloseRequest}
                variant="text"
                color="inherit"
                disabled={!canClose}
                sx={{ fontWeight: 700, px: 3, color: 'text.secondary' }}
              >
                {finalCancelText}
              </Button>
            )}

            {!hideConfirmButton && onConfirm && (
              <Button
                onClick={onConfirm}
                variant={confirmButtonVariant}
                color={confirmButtonColor}
                disabled={isLoading || disableConfirm}
                startIcon={!isLoading && confirmButtonIcon}
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 800,
                  minWidth: 140,
                  boxShadow: confirmButtonVariant === 'contained'
                    ? `0 8px 16px ${alpha(theme.palette[confirmButtonColor].main, 0.25)}`
                    : 'none',
                }}
              >
                {isLoading ? <CircularProgress size={20} color="inherit" /> : confirmText}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BaseModal;