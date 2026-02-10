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
import React from 'react';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface BaseModalProps extends Omit<DialogProps, 'onClose'> {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  children: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  disableConfirm?: boolean;
  hideCancelButton?: boolean;
  hideConfirmButton?: boolean;
  confirmButtonColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  confirmButtonVariant?: 'contained' | 'outlined' | 'text';
  confirmButtonIcon?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  scroll?: 'paper' | 'body';
  customActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  disableClose?: boolean;
}

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const headerColorValue = theme.palette[headerColor].main;

  const handleClose = () => {
    if (!isLoading && !disableClose) onClose();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={(event, reason) => {
        if ((isLoading || disableClose) && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        handleClose();
      }}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      scroll={scroll}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: alpha(theme.palette.common.black, 0.4),
          }
        }
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          // Altura dinámica si el usuario la pasa vía PaperProps en el componente padre
          ...dialogProps.PaperProps?.sx
        },
      }}
      {...dialogProps}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha(headerColorValue, 0.04),
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          {icon && (
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(headerColorValue, 0.1),
                color: headerColorValue,
                width: 44,
                height: 44,
                borderRadius: 2,
                boxShadow: `0 4px 12px ${alpha(headerColorValue, 0.2)}`,
              }}
            >
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
          <IconButton
            onClick={handleClose}
            disabled={isLoading || disableClose}
            sx={{
              color: theme.palette.text.disabled,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.08),
                color: theme.palette.error.main,
                transform: 'rotate(90deg)',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ opacity: 0.6 }} />

      <DialogContent
        sx={{
          p: { xs: 3, md: 4 },
          bgcolor: 'background.default',
        }}
      >
        {children}
      </DialogContent>

      <Divider sx={{ opacity: 0.6 }} />

      <DialogActions
        sx={{
          p: 3,
          bgcolor: alpha(theme.palette.secondary.light, 0.1), // Suavizado para mejor contraste
          gap: 1.5
        }}
      >
        {customActions ? (
          customActions
        ) : (
          <>
            {!hideCancelButton && (
              <Button
                onClick={handleClose}
                variant="text"
                color="inherit"
                disabled={isLoading || disableClose}
                sx={{
                  fontWeight: 700,
                  px: 3,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.05) }
                }}
              >
                {cancelText}
              </Button>
            )}

            {!hideConfirmButton && onConfirm && (
              <Button
                onClick={onConfirm}
                variant={confirmButtonVariant}
                color={confirmButtonColor}
                // ✅ Deshabilita si está cargando O si el padre lo solicita
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